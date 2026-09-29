import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Request, Response } from 'express';
import { LRUCache } from 'lru-cache';
import { isPrivateSsrPath, SsrCacheEntry, SsrHtmlCache } from './ssr-cache';
import type { SsrRenderState } from './app/ssr-render-state';

function request(url = '/', method = 'GET', headers = {}): Request {
  return { path: url.split('?')[0], originalUrl: url, method, query: {}, headers } as Request;
}

function response(statusCode = 200) {
  const headers = new Map<string, string>();
  let body: string | undefined;
  const res = {
    statusCode,
    set(name: string | Record<string, string>, value?: string) {
      if (typeof name === 'string') headers.set(name.toLowerCase(), value!);
      else Object.entries(name).forEach(([key, val]) => headers.set(key.toLowerCase(), val));
      return res;
    },
    hasHeader(name: string) { return headers.has(name.toLowerCase()); },
    send(html: string) { body = html; return res; },
  };
  return { res: res as unknown as Response, headers, body: () => body };
}

function harness() {
  let now = Date.UTC(2026, 8, 28);
  const entries = new LRUCache<string, SsrCacheEntry>({ max: 100, ttl: 300000, updateAgeOnGet: false });
  const cache = new SsrHtmlCache(entries, () => now);
  const state = (): SsrRenderState => ({ serviceUnavailable: false, notFound: false, cacheable: true });
  function render(req = request(), html = '<h1>Public</h1>', renderState = state(), status = 200) {
    const result = response(status);
    assert.equal(cache.tryServe(req, result.res), false);
    cache.send(req, result.res, renderState, html, now);
    return result;
  }
  return { cache, entries, state, render, now: () => now, advance: (ms: number) => { now += ms; } };
}

test('first GET renders once; subsequent GET serves the same HTML and preserves current response headers', () => {
  const h = harness();
  const miss = h.render();
  assert.equal(miss.headers.get('x-cache'), 'MISS');
  assert.equal(miss.headers.get('cache-control'), 'public, max-age=300');
  const hit = response();
  hit.res.set('X-Frame-Options', 'SAMEORIGIN');
  assert.equal(h.cache.tryServe(request(), hit.res), true);
  assert.equal(hit.body(), miss.body());
  assert.equal(hit.headers.get('x-cache'), 'HIT');
  assert.equal(hit.headers.get('x-frame-options'), 'SAMEORIGIN');
});

test('Age includes render time; Date and the expiry stay fixed across HITs', () => {
  const h = harness();
  const req = request();
  const miss = response();
  h.cache.tryServe(req, miss.res);
  const startedAt = h.now();
  h.advance(5000);
  h.cache.send(req, miss.res, h.state(), '<h1>Version 1</h1>', startedAt);
  assert.equal(miss.headers.get('age'), '5');
  const originalDate = miss.headers.get('date');
  for (const seconds of [100, 199]) {
    h.advance(seconds * 1000);
    const result = response();
    if (h.now() - startedAt < 300000) {
      assert.equal(h.cache.tryServe(req, result.res), true);
      assert.equal(result.headers.get('age'), '105');
      assert.equal(result.headers.get('date'), originalDate);
    } else {
      assert.equal(h.cache.tryServe(req, result.res), false);
      assert.equal(result.headers.get('cache-control'), 'no-store');
    }
  }
  const fresh = h.render(req, '<h1>Version 2</h1>');
  assert.equal(fresh.headers.get('age'), '0');
  assert.notEqual(fresh.headers.get('date'), originalDate);
});

test('entry expires exactly at five minutes even after a recent HIT', () => {
  const h = harness();
  h.render();
  h.advance(299999);
  assert.equal(h.cache.tryServe(request(), response().res), true);
  h.advance(1);
  assert.equal(h.cache.tryServe(request(), response().res), false);
  assert.equal(h.entries.size, 0);
});

test('only the 100 most recently used pages remain; a HIT affects eviction but not TTL', () => {
  const h = harness();
  for (let index = 0; index < 100; index++) h.render(request(`/page-${index}`), String(index));
  assert.equal(h.cache.tryServe(request('/page-0'), response().res), true);
  h.render(request('/page-100'));
  assert.equal(h.entries.size, 100);
  assert.equal(h.cache.tryServe(request('/page-1'), response().res), false);
  assert.equal(h.cache.tryServe(request('/page-0'), response().res), true);
});

for (const url of ['/properties?page=2', '/properties?__proto__=ignored', '/properties?',
  '/login', '/add-property', '/login/', '/login;source=test', '/%6cogin',
  '//login', '/(primary:login)', '/(primary:add-property)', '/%invalid']) {
  test(`bypasses both read and write for ${url}`, () => {
    const h = harness();
    // Even an existing entry must not defeat a request's bypass policy.
    h.entries.set(url.split('?')[0], { html: 'must not be served', renderedAt: h.now() });
    for (let count = 0; count < 2; count++) {
      const result = h.render(request(url), 'new render');
      assert.equal(result.body(), 'new render');
      assert.equal(result.headers.get('x-cache'), 'MISS');
      assert.equal(result.headers.get('cache-control'), 'no-store');
      assert.equal(result.headers.has('age'), false);
      assert.equal(h.entries.peek(url.split('?')[0])?.html, 'must not be served');
    }
  });
}

test('HEAD and authenticated requests never read or populate the cache', () => {
  const h = harness();
  h.render();
  for (const req of [request('/', 'HEAD'), request('/', 'GET', { authorization: 'Bearer test' }), request('/', 'POST')]) {
    const result = h.render(req, 'uncached');
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(h.entries.peek('/')?.html, '<h1>Public</h1>');
  }
});

for (const [name, patch, status] of [
  ['404', { notFound: true }, 404],
  ['503', { serviceUnavailable: true }, 503],
  ['notFound flagged before status', { notFound: true }, 200],
  ['unavailable flagged before status', { serviceUnavailable: true }, 200],
  ['noindex or degraded HTML', { cacheable: false }, 200],
  ['other non-200', {}, 302],
] as const) {
  test(`does not store ${name} or mark it public`, () => {
    const h = harness();
    for (let count = 0; count < 2; count++) {
      const result = h.render(request(), 'error', { ...h.state(), ...patch }, status);
      assert.equal(result.headers.get('cache-control'), 'no-store');
      assert.equal(h.entries.size, 0);
    }
  });
}

test('Set-Cookie responses are not shared', () => {
  const h = harness();
  const result = response();
  h.cache.tryServe(request(), result.res);
  result.res.set('Set-Cookie', 'session=test');
  h.cache.send(request(), result.res, h.state(), 'private', h.now());
  assert.equal(h.entries.size, 0);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('different paths and application instances do not share entries', () => {
  const first = harness();
  const second = harness();
  first.render(request('/one'), 'one');
  first.render(request('/two'), 'two');
  const result = response();
  assert.equal(first.cache.tryServe(request('/two'), result.res), true);
  assert.equal(result.body(), 'two');
  assert.equal(second.cache.tryServe(request('/two'), response().res), false);
});

test('administrative path recognition covers Angular encoded, matrix and outlet forms', () => {
  for (const path of ['/login', '/%6cogin', '/login;mode=test', '//add-property', '/(primary:login)']) {
    assert.equal(isPrivateSsrPath(path), true, path);
  }
  assert.equal(isPrivateSsrPath('/login-help'), false);
  assert.equal(isPrivateSsrPath('/properties'), false);
});
