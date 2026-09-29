const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { existsSync, mkdtempSync, readdirSync, writeFileSync } = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { parse } = require('parse5');

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

function elements(node) {
  return [node, ...(node.childNodes ?? []).flatMap(elements)];
}

function attr(node, name) {
  return node.attrs?.find(attribute => attribute.name === name)?.value;
}

function textContent(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(textContent).join('');
}

function verifySeoPhones(result) {
  assert.equal(result.status, 200, result.url);
  const nodes = elements(parse(result.html));
  const descriptions = ['description', 'og:description', 'twitter:description'].map(name => {
    const tag = nodes.find(node => node.tagName === 'meta' &&
      (attr(node, 'name') === name || attr(node, 'property') === name));
    assert.ok(tag, `${result.url}: missing ${name}`);
    const value = attr(tag, 'content');
    assert.ok(value, `${result.url}: empty ${name}`);
    assert.doesNotMatch(value, /(?:\+?40|0)[\s.\-]*7(?:[\s.\-]*\d){8}/, result.url);
    return value;
  });
  const schemas = nodes.filter(node => node.tagName === 'script' && attr(node, 'type') === 'application/ld+json')
    .map(node => JSON.parse(textContent(node)));
  const agent = schemas.find(schema => schema['@type'] === 'RealEstateAgent');
  assert.equal(agent?.telephone, '+40728140628', result.url);
  console.log(`PASS SEO ${result.url}: ${descriptions[0]}`);
  return { nodes, schemas, descriptions };
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
  // TASK-118: toate rutele statice, plus un anunț cu telefoane în nume/descriere.
  for (const url of ['/', '/homes', '/about-us', '/info-page', '/contact-us', '/under-the-mountain',
    '/see-the-area', '/properties', '/village-of-the-month', '/login', '/add-property']) {
    const result = await request(url);
    const { nodes } = verifySeoPhones(result);
    if (url === '/contact-us') {
      const phones = nodes.filter(node => node.tagName === 'a' && attr(node, 'href')?.startsWith('tel:'));
      assert.ok(phones.length >= 2);
      for (const phone of phones) {
        assert.equal(attr(phone, 'href'), 'tel:+40728140628');
        assert.equal(textContent(phone).replace(/\s/g, ''), '0728140628');
      }
    }
  }
  const seoProperty = {
    id: '44444444-4444-4444-4444-444444444444', name: 'Proprietate test +40 768 915 198', type: 'land',
    description: '<p>Teren 1.250 mp, preț 75.000 euro. Telefon: 0763144967 și +40&nbsp;728&nbsp;140&nbsp;628</p>',
    thumbnail: '/assets/poza_landing1.avif',
  };
  writeFileSync(fixtureState, JSON.stringify({ property: seoProperty, properties: [seoProperty] }));
  const listingUrl = `/property/${seoProperty.id}/teren-de-vanzare-proprietate-test-40-768-915-198`;
  for (const expectedCache of ['MISS', 'HIT']) {
    const result = await request(listingUrl);
    verify(result, 200, expectedCache, true);
    const { nodes, schemas, descriptions } = verifySeoPhones(result);
    const listing = schemas.find(schema => schema['@type'] === 'RealEstateListing');
    assert.equal(listing?.description, 'Teren 1.250 mp, preț 75.000 euro. Telefon: și');
    assert.equal(descriptions[0], 'Teren de vânzare în Oltenia de sub Munte: Proprietate test. Teren 1.250 mp, preț 75.000 euro. Telefon: și');
    assert.ok(nodes.some(node => node.tagName === 'a' && attr(node, 'href') === 'tel:0763144967'));
    assert.ok(nodes.some(node => attr(node, 'class')?.split(' ').includes('property-description') &&
      textContent(node).includes('+40\u00a0728\u00a0140\u00a0628')));
  }
  // Query-ul evită intrarea goală /properties deja salvată în cache în scenariile anterioare.
  const cards = verifySeoPhones(await request('/properties?seo-test=1')).nodes;
  const imageAlts = cards.filter(node => node.tagName === 'img').map(node => attr(node, 'alt'));
  assert.ok(imageAlts.includes('Teren de vânzare: Proprietate test - Teren 1.250 mp, preț 75.000 euro. Telefon: și'));
  const llms = await request('/llms.txt');
  assert.equal(llms.status, 200);
  assert.ok(llms.html.includes('Telefon: +40728140628'));
  assert.ok(!llms.html.includes('+40 728 140 628'));
  console.log(`PASS redirect, static assets, SEO phones; ${evidence.length} HTTP responses checked.`);
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
