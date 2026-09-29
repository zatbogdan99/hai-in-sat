const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { existsSync, mkdtempSync, readdirSync, writeFileSync } = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');

const root = path.resolve(__dirname, '..');
const bundle = path.join(root, 'dist/hai-in-sat/server/main.js');
const port = Number(process.env.SSR_CACHE_TEST_PORT || 4000);
const output = mkdtempSync(path.join(tmpdir(), 'hai-in-sat-ssr-cache-'));
const fixtureState = path.join(output, 'api-state.json');
let server;
let serverLog = '';
const evidence = [];

function request(url, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port, path: url, method, headers }, res => {
      let html = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { html += chunk; });
      res.on('end', () => {
        const result = { url, method, status: res.statusCode, headers: res.headers, html };
        evidence.push(result);
        resolve(result);
      });
    });
    req.setTimeout(35000, () => req.destroy(new Error(`Request timed out: ${url}`)));
    req.on('error', reject);
    req.end();
  });
}

function verify(result, status, cache, publicResponse = false) {
  assert.equal(result.status, status, `${result.method} ${result.url}`);
  assert.equal(result.headers['x-cache'], cache, result.url);
  assert.equal(result.headers['cache-control'], publicResponse ? 'public, max-age=300' : 'no-store', result.url);
  assert.equal(result.headers['x-frame-options'], 'SAMEORIGIN');
  assert.ok(result.headers['content-security-policy-report-only']);
  console.log(`PASS ${result.method} ${result.url} -> ${status}, ${cache}, ${result.headers['cache-control']}, Age=${result.headers.age ?? '-'}`);
}

async function main() {
  assert.ok(existsSync(bundle), 'Run npm run build before the SSR HTTP test.');
  // Nu folosi sau opri un server care rulează deja pe portul ales.
  const probe = net.createServer();
  probe.listen(port);
  await once(probe, 'listening');
  await new Promise(resolve => probe.close(resolve));
  writeFileSync(fixtureState, JSON.stringify({ listError: true }));
  server = spawn(process.execPath, ['--require', path.join(__dirname, 'ssr-cache-api-fixture.cjs'), bundle], {
    cwd: root, windowsHide: true,
    env: { ...process.env, PORT: String(port), SSR_CACHE_FIXTURE_STATE: fixtureState },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => { serverLog += chunk; });
  server.stderr.on('data', chunk => { serverLog += chunk; });
  for (let count = 0; count < 100 && !serverLog.includes('Node Express server listening'); count++) {
    assert.equal(server.exitCode, null, serverLog);
    await delay(100);
  }
  assert.ok(serverLog.includes('Node Express server listening'), 'SSR server did not start.');

  const first = await request('/');
  verify(first, 200, 'MISS', true);
  await delay(1200);
  const second = await request('/');
  verify(second, 200, 'HIT', true);
  assert.equal(second.html, first.html);
  assert.equal(second.headers.date, first.headers.date);
  assert.ok(Number(second.headers.age) > Number(first.headers.age));

  const conditional = await request('/', { headers: { 'If-None-Match': first.headers.etag } });
  verify(conditional, 304, 'HIT', true);
  assert.equal(conditional.headers.date, first.headers.date);
  assert.ok(Number(conditional.headers.age) >= Number(second.headers.age));

  for (const url of ['/login', '/add-property', '/%6cogin', '//login', '/(primary:login)',
    '/(primary:add-property)', '/login;source=test', '/login/']) {
    for (let count = 0; count < 2; count++) {
      const result = await request(url);
      verify(result, 200, 'MISS');
      assert.equal(result.headers['x-robots-tag'], 'noindex, nofollow');
    }
  }

  for (let count = 0; count < 2; count++) verify(await request('/properties'), 200, 'MISS');
  writeFileSync(fixtureState, JSON.stringify({ listError: false }));
  verify(await request('/properties'), 200, 'MISS', true);
  verify(await request('/properties'), 200, 'HIT', true);
  for (const url of ['/properties?page=2', '/properties?__proto__=ignored', '/properties?']) {
    for (let count = 0; count < 2; count++) verify(await request(url), 200, 'MISS');
  }

  for (let count = 0; count < 2; count++) {
    for (const url of ['/this-page-does-not-exist', '/.well-known/ai-policy',
      '/property/00000000-0000-0000-0000-000000000000/orice-slug']) {
      const result = await request(url);
      verify(result, 404, 'MISS');
      assert.ok(result.html.includes('href="/properties"'));
    }
    const unavailable = await request('/property/22222222-2222-2222-2222-222222222222/orice-slug');
    verify(unavailable, 503, 'MISS');
    assert.equal(unavailable.headers['retry-after'], '60');
    verify(await request('/property/33333333-3333-3333-3333-333333333333/teren-de-vanzare-proprietate-test'), 200, 'MISS');
  }
  const valid = '/property/11111111-1111-1111-1111-111111111111/teren-de-vanzare-proprietate-test';
  verify(await request(valid), 200, 'MISS', true);
  verify(await request(valid), 200, 'HIT', true);

  verify(await request('/contact-us', { method: 'HEAD' }), 200, 'MISS');
  verify(await request('/contact-us'), 200, 'MISS', true);
  verify(await request('/contact-us', { method: 'HEAD' }), 200, 'MISS');
  verify(await request('/contact-us'), 200, 'HIT', true);
  const redirect = await request('/properties?type=land', { headers: {
    Host: 'www.xn--hai-n-sat-t5a.ro', 'X-Forwarded-Proto': 'https',
  } });
  assert.equal(redirect.status, 301);
  assert.equal(redirect.headers.location, 'https://xn--hai-n-sat-t5a.ro/properties?type=land');

  // Politicile statice sunt independente de cache-ul HTML și de query string.
  const browser = path.join(root, 'dist/hai-in-sat/browser');
  const bundles = readdirSync(browser).filter(name => /\.(?:js|css)$/.test(name));
  assert.ok(bundles.some(name => name.startsWith('main.')));
  assert.ok(bundles.some(name => name.startsWith('styles.')));
  for (const name of bundles) {
    assert.match(name, /^.+\.[0-9a-f]{16}\.(?:js|css)$/);
    for (const suffix of ['', '?v=test']) {
      const result = await request(`/${name}${suffix}`, { method: 'HEAD' });
      assert.equal(result.status, 200);
      assert.equal(result.headers['cache-control'], 'public, max-age=31536000, immutable');
      assert.equal(result.headers['x-cache'], undefined);
      assert.equal(result.headers['x-content-type-options'], 'nosniff');
      console.log(`PASS HEAD /${name}${suffix} -> immutable, 365 days`);
    }
  }
  const image = await request('/assets/poza_landing1.avif', { method: 'HEAD' });
  assert.equal(image.status, 200);
  assert.equal(image.headers['cache-control'], 'public, max-age=2592000');
  assert.equal(image.headers['x-cache'], undefined);
  console.log('PASS /assets/poza_landing1.avif -> 30 days, without immutable');
  for (const url of ['/robots.txt', '/sitemap.xml', '/favicon.ico', '/llms.txt']) {
    const result = await request(url, { method: 'HEAD' });
    assert.equal(result.status, 200);
    assert.equal(result.headers['cache-control'], 'public, max-age=600');
    assert.equal(result.headers['x-cache'], undefined);
    console.log(`PASS HEAD ${url} -> 600 seconds, without immutable`);
  }
  // Angular normalizează /index.html la homepage; primește politica SSR scurtă.
  const index = await request('/index.html');
  verify(index, 200, 'MISS', true);
  assert.ok(index.html.includes('id="ng-state"'), 'index.html must be rendered by Angular SSR');
  for (const url of ['/index.original.html', '/missing.0123456789abcdef.js', '/assets/missing-task117.avif']) {
    verify(await request(url), 404, 'MISS');
  }
  console.log(`PASS redirect, static assets; ${evidence.length} HTTP responses checked.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  writeFileSync(path.join(output, 'responses.json'), JSON.stringify(evidence, null, 2));
  writeFileSync(path.join(output, 'server.log'), serverLog);
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
  console.log(`Evidence: ${output}`);
});
