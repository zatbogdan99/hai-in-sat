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

  // TASK-119: inspect the actual SSR DOM for every indexed route, including
  // headings in CSS-hidden desktop/mobile branches. All requests stay local;
  // property data comes from the API fixture, never from the production API.
  const sitemap = await request('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  const sitemapUrls = elements(parse(sitemap.html)).filter(node => node.tagName === 'loc')
    .map(node => new URL(textContent(node).trim()));
  assert.ok(sitemapUrls.length > 0, 'The sitemap must contain URLs to check.');

  // TASK-120: represent every indexed property with local data whose name/type
  // reproduces its real slug. The fixture respects filtering and pagination;
  // no sitemap rewrite or production API request is needed for this crawl.
  const propertyUrls = sitemapUrls.filter(url => url.pathname.startsWith('/property/'));
  const catalog = propertyUrls.map((url, sortOrder) => {
    const match = url.pathname.match(/^\/property\/([^/]+)\/(teren|casa)-de-vanzare-(.+)$/);
    assert.ok(match, `Unsupported property sitemap URL: ${url.pathname}`);
    return {
      id: match[1], type: match[2] === 'casa' ? 'house' : 'land',
      name: decodeURIComponent(match[3]).replace(/-/g, ' '), sortOrder,
      description: 'Proprietate din catalogul local pentru verificarea linkurilor interne.',
      thumbnail: '/assets/poza_landing1.avif',
    };
  });
  assert.ok(catalog.length > 0, 'The sitemap must contain property URLs to check.');
  const propertyPaths = new Map(propertyUrls.map(url => [url.pathname.split('/')[2], url.pathname]));
  assert.equal(propertyPaths.size, catalog.length, 'Sitemap property IDs must be unique.');
  writeFileSync(fixtureState, JSON.stringify({ catalog }));

  const incoming = new Map(sitemapUrls.map(url => [url.pathname, new Set()]));
  const indexedPages = [];
  const listingPages = [];
  const discoveredProperties = new Set();
  const localOrigin = `http://localhost:${port}`;

  function inspectInternalLinks(result, nodes) {
    const anchors = nodes.filter(node => node.tagName === 'a' && /^\/(?!\/)/.test(attr(node, 'href') ?? ''));
    const hrefs = [...new Set(anchors.map(node => attr(node, 'href')))];
    assert.ok(hrefs.length >= 5, `${result.url}: expected at least five distinct internal anchor hrefs, got ${hrefs.length}`);
    const sourcePath = new URL(result.url, localOrigin).pathname;
    for (const href of hrefs) {
      const destination = new URL(href, localOrigin);
      assert.equal(destination.origin, localOrigin, `${result.url}: expected a local internal href`);
      assert.ok(!['/sate', '/articole'].includes(destination.pathname), `${result.url}: link to a route that does not exist`);
      if (destination.pathname !== sourcePath) incoming.get(destination.pathname)?.add(result.url);
    }
    return { anchors, hrefs };
  }

  for (const url of sitemapUrls) {
    const result = await request(url.pathname + url.search);
    assert.equal(result.status, 200, result.url);
    const nodes = elements(parse(result.html));
    const headings = nodes.filter(node => node.tagName === 'h1');
    assert.equal(headings.length, 1, `${result.url}: expected exactly one H1 in the SSR DOM`);
    assert.ok(textContent(headings[0]).trim(), `${result.url}: the H1 must not be empty`);
    console.log(`PASS H1 ${result.url}: ${textContent(headings[0]).trim()}`);
    if (url.pathname.startsWith('/property/')) {
      const canonical = nodes.find(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical');
      assert.ok(canonical && attr(canonical, 'href'), `${result.url}: missing canonical property URL`);
      assert.equal(new URL(attr(canonical, 'href')).pathname, url.pathname, `${result.url}: fixture must preserve the indexed property slug`);
    }
    const { hrefs } = inspectInternalLinks(result, nodes);
    indexedPages.push({ url: result.url, internalLinkCount: hrefs.length, internalLinks: hrefs });
  }

  // The initial query bypasses /properties cached while the earlier API-failure
  // scenario had an empty list. Every later listing URL must be discovered in
  // rendered HTML, including the house filter and subsequent land pages.
  const queue = ['/properties?type=land&page=0&size=6'];
  const visited = new Set();
  while (queue.length) {
    const next = new URL(queue.shift(), localOrigin);
    next.searchParams.sort();
    const requestPath = next.pathname + next.search;
    if (visited.has(requestPath)) continue;
    visited.add(requestPath);
    assert.ok(visited.size <= catalog.length * 2 + 10, 'Listing crawl did not converge; check generated pagination hrefs.');
    const result = await request(requestPath);
    assert.equal(result.status, 200, requestPath);
    const { anchors, hrefs } = inspectInternalLinks(result, elements(parse(result.html)));
    const type = next.searchParams.get('type');
    const page = Number(next.searchParams.get('page'));
    const size = Number(next.searchParams.get('size'));
    assert.ok(['land', 'house'].includes(type), `${requestPath}: missing property filter`);
    assert.ok(Number.isInteger(page) && page >= 0, `${requestPath}: invalid page`);
    assert.ok(Number.isInteger(size) && size > 0, `${requestPath}: invalid page size`);
    const expectedProperties = catalog.filter(property => property.type === type).slice(page * size, (page + 1) * size);
    const actualPropertyPaths = new Set();
    for (const anchor of anchors) {
      const destination = new URL(attr(anchor, 'href'), localOrigin);
      if (destination.pathname === '/properties' && destination.search) {
        queue.push(destination.pathname + destination.search);
      }
      if (!destination.pathname.startsWith('/property/')) continue;
      const id = destination.pathname.split('/')[2];
      assert.equal(destination.pathname, propertyPaths.get(id), `${requestPath}: incorrect property ID or slug`);
      for (const [key, expected] of [['page', String(page)], ['size', String(size)], ['type', type]]) {
        assert.equal(destination.searchParams.get(key), expected, `${requestPath}: property href must preserve ${key}`);
      }
      actualPropertyPaths.add(destination.pathname);
      discoveredProperties.add(destination.pathname);
    }
    assert.deepEqual([...actualPropertyPaths].sort(), expectedProperties.map(property => propertyPaths.get(property.id)).sort(),
      `${requestPath}: rendered property links must match the requested fixture page/filter`);
    for (const property of expectedProperties) {
      assert.ok(anchors.some(anchor => {
        const destination = new URL(attr(anchor, 'href'), localOrigin);
        const label = textContent(anchor).trim().replace(/\.\.\.$/, '');
        return destination.pathname === propertyPaths.get(property.id) && label.length > 0 && property.name.startsWith(label);
      }), `${requestPath}: ${property.id} must have its name as anchor text`);
    }
    listingPages.push({ url: requestPath, internalLinkCount: hrefs.length, internalLinks: hrefs });
    console.log(`PASS CRAWL ${requestPath}: ${actualPropertyPaths.size} property destinations, ${hrefs.length} distinct internal hrefs`);
  }
  assert.deepEqual([...discoveredProperties].sort(), propertyUrls.map(url => url.pathname).sort(),
    'Following SSR listing/filter/pagination hrefs must discover every property in the sitemap.');
  for (const page of indexedPages) {
    const sources = [...incoming.get(new URL(page.url, localOrigin).pathname)].sort();
    assert.ok(sources.length > 0, `${page.url}: no incoming link from another page`);
    page.incomingFrom = sources;
    console.log(`PASS LINKS ${page.url}: ${page.internalLinkCount} distinct internal hrefs; incoming from ${sources[0]}`);
  }
  writeFileSync(path.join(output, 'internal-links.json'), JSON.stringify({ indexedPages, listingPages, discoveredProperties: [...discoveredProperties] }, null, 2));
  console.log(`PASS redirect, static assets, SEO phones, ${sitemapUrls.length} sitemap headings and incoming links, ${discoveredProperties.size} discovered properties; ${evidence.length} HTTP responses checked.`);
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
