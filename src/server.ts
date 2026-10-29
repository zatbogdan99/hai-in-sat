import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LRUCache } from 'lru-cache';
import bootstrap from './main.server';
import { createSsrRenderState, SSR_RENDER_STATE } from './app/ssr-render-state';
import { isPrivateSsrPath, SsrCacheEntry, SsrHtmlCache } from './ssr-cache';

const SSR_RENDER_TIMEOUT_MS = 25000;
const RETRY_AFTER_SECONDS = 60;
const CANONICAL_HOST = 'xn--hai-n-sat-t5a.ro';
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

class SsrRenderTimeoutError extends Error {
  constructor() {
    super(`SSR render timed out after ${SSR_RENDER_TIMEOUT_MS}ms`);
    this.name = 'SsrRenderTimeoutError';
  }
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/hai-in-sat/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? join(distFolder, 'index.original.html')
    : join(distFolder, 'index.html');

  // Angular 20 validates render hosts. Keep this aligned with the canonical
  // redirect and its local-development exceptions; never trust a request header
  // to populate this list, or use a wildcard that bypasses SSRF protection.
  const commonEngine = new CommonEngine({
    allowedHosts: [CANONICAL_HOST, 'localhost', '127.0.0.1', '[::1]'],
  });
  const htmlCache = new SsrHtmlCache(new LRUCache<string, SsrCacheEntry>({
    max: 100,
    ttl: 300000,
    updateAgeOnGet: false,
    // Limita de memorie a instanței F2: paginile cu poze base64 aveau 20–30 MB, iar 100 de intrări
    // puteau ține gigabytes în memorie. Paginile peste 4 MB nu se mai păstrează în cache.
    maxSize: 96 * 1024 * 1024,
    maxEntrySize: 4 * 1024 * 1024,
    sizeCalculation: (entry) => entry.html.length,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Redirect canonic 301: www->apex si http->https (TASK-113)
  server.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const host = req.headers.host ?? '';
    const rawProto: string | string[] = req.headers['x-forwarded-proto'] ?? 'https'; // GAE seteaza x-forwarded-proto
    const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;

    // Exceptie localhost (decizie owner 2026-08-07): fara ea, `npm run serve:ssr`
    // ar raspunde 301 spre productie la orice verificare SSR locala.
    if (LOCAL_HOST_PATTERN.test(host)) {
      return next();
    }

    if (host !== CANONICAL_HOST || proto !== 'https') {
      return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
    }
    next();
  });

  // Headere de securitate pentru răspunsurile SSR (TASK-114).
  // CSP raportează încălcările; aplicarea restrictivă se va face separat.
  server.use((_req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set({
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy-Report-Only':
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        // data: pentru fontul de iconițe PrimeIcons, încorporat în CSS.
        "font-src 'self' data: https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        // Videoclipurile de prezentare ale proprietăților vin din bucketul public din GCS.
        "media-src 'self' https://storage.googleapis.com; " +
        "connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; " +
        'frame-src https://www.youtube.com https://www.youtube-nocookie.com; ' +
        // Fără report-uri, politica Report-Only nu avea unde raporta (Safari avertiza pe fiecare pagină).
        'report-uri /csp-report;',
    });
    next();
  });

  // Rapoartele CSP ajung în logul App Engine (scurtate), ca să vedem ce ar bloca politica înainte s-o facem obligatorie.
  server.post('/csp-report', express.json({
    type: ['application/csp-report', 'application/reports+json', 'application/json'],
    limit: '16kb',
  }), (req: express.Request, res: express.Response) => {
    console.warn('[CSP] ' + JSON.stringify(req.body ?? null).slice(0, 2000));
    res.status(204).end();
  });

  // Pagina /contact-us a fost scoasă: adresele vechi (Google, linkuri externe) ajung pe prima pagină,
  // unde subsolul are telefonul, emailul și fereastra Contact.
  server.get(['/contact-us', '/contact-us/'], (_req: express.Request, res: express.Response) => {
    res.redirect(301, '/');
  });

  // Pagina „Vezi zona” a fost scoasă: terenurile din ramura „Cumpără” sunt anunțuri în /properties,
  // iar „Închiriază” n-avea oferte. Adresa veche (sitemap, linkuri externe) duce la listă.
  server.get(['/see-the-area', '/see-the-area/'], (_req: express.Request, res: express.Response) => {
    res.redirect(301, '/properties');
  });

  // /info-page arăta satul ales anterior în memorie (direct: satul lunii). Fiecare sat are acum /sate/:slug,
  // iar adresa veche duce la lista satelor.
  server.get(['/info-page', '/info-page/'], (_req: express.Request, res: express.Response) => {
    res.redirect(301, '/under-the-mountain');
  });

  // Paginile administrative rămân accesibile, dar nu trebuie indexate.
  server.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (isPrivateSsrPath(req.path)) {
      res.set('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  // Aceeași ordine și politică pentru fișiere statice ca în app.yaml.
  // Immutable se aplică exclusiv bundle-urilor JS/CSS cu hash de conținut.
  server.get(/^\/(.+\.[0-9a-f]{16}\.(?:js|css))$/, express.static(distFolder, {
    maxAge: '1y',
    immutable: true,
    index: false,
  }));

  server.use('/assets', express.static(join(distFolder, 'assets'), {
    maxAge: '30d',
    index: false,
  }));

  // HTML-ul ajunge la SSR; robots/sitemap și fișierele fără hash nu sunt immutable.
  server.get(/\.(?:js|css|map|ico|png|jpg|jpeg|avif|svg|woff|woff2|ttf|eot|xml|txt|json)$/, express.static(distFolder, {
    maxAge: '10m',
    index: false,
  }));

  // All regular routes use the Angular engine
  server.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (htmlCache.tryServe(req, res)) return;

    const { protocol, originalUrl, baseUrl, headers } = req;
    // Preserve Angular's existing route semantics for //login etc. while giving
    // Angular 20 an unambiguous same-host path. Cache/private-route checks above
    // and below deliberately continue to use the original request.
    const renderPath = originalUrl.replace(/^\/+/, '/');
    const ssrRenderState = createSsrRenderState();
    const renderedAt = Date.now();

    renderWithTimeout(commonEngine, {
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${renderPath}`,
      publicPath: distFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        { provide: SSR_RENDER_STATE, useValue: ssrRenderState },
      ],
    })
      .then((html) => {
        if (ssrRenderState.serviceUnavailable) {
          console.error(`[SSR] Render marked unavailable for ${originalUrl}`, ssrRenderState.error);
          sendSsrServiceUnavailable(res);
          return;
        }

        if (ssrRenderState.notFound) {
          res.status(404).set('X-Robots-Tag', 'noindex, nofollow').send(html);
          return;
        }

        htmlCache.send(req, res, ssrRenderState, html, renderedAt);
      })
      .catch((err) => next(err));
  });

  server.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[SSR] Render failed for ${req.originalUrl}`, err);

    if (res.headersSent) {
      next(err);
      return;
    }

    sendSsrServiceUnavailable(res);
  });

  return server;
}

function renderWithTimeout(
  commonEngine: CommonEngine,
  options: Parameters<CommonEngine['render']>[0]
): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new SsrRenderTimeoutError()), SSR_RENDER_TIMEOUT_MS);
  });

  return Promise.race([
    commonEngine.render(options),
    timeoutPromise,
  ]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function sendSsrServiceUnavailable(res: express.Response): void {
  res
    .status(503)
    .set({
      'Retry-After': String(RETRY_AFTER_SECONDS),
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store',
    })
    .type('html')
    .send(renderSsrServiceUnavailablePage());
}

function renderSsrServiceUnavailablePage(): string {
  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Serviciu indisponibil temporar | Hai in Sat</title>
  <style>
    body{margin:0;font-family:Arial,sans-serif;color:#1f2933;background:#faf7f1;display:grid;min-height:100vh;place-items:center}
    main{max-width:36rem;padding:2rem}
    h1{font-size:1.75rem;line-height:1.2;margin:0 0 1rem}
    p{font-size:1rem;line-height:1.6;margin:0 0 1.25rem}
    a{color:#0f766e;font-weight:700}
  </style>
</head>
<body>
  <main>
    <h1>Serviciul este temporar indisponibil</h1>
    <p>Pagina proprietății nu poate fi încărcată acum. Te rugăm să revii peste puțin timp.</p>
    <p><a href="/properties">Vezi lista de proprietăți</a></p>
  </main>
</body>
</html>`;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export default bootstrap;
