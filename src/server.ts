import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import bootstrap from './main.server';
import { createSsrRenderState, SSR_RENDER_STATE } from './app/ssr-render-state';

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

  const commonEngine = new CommonEngine();

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

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const ssrRenderState = createSsrRenderState();

    renderWithTimeout(commonEngine, {
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
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

        res.send(html);
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
