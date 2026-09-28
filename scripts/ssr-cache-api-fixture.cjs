// Folosit exclusiv de testul HTTP local; nu este importat de aplicație.
const { readFileSync } = require('node:fs');
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.origin !== 'https://hai-in-sat-api.lm.r.appspot.com') return originalFetch(input, init);

  const state = JSON.parse(readFileSync(process.env.SSR_CACHE_FIXTURE_STATE, 'utf8'));
  let status = 200;
  let body;
  if (url.pathname === '/get-all-properties') {
    status = state.listError ? 503 : 200;
    body = { content: [], totalElements: 0, totalPages: 0, size: 6, number: 0 };
  } else if (url.pathname === '/get-by-id') {
    const id = url.searchParams.get('id');
    if (id === '00000000-0000-0000-0000-000000000000') body = null;
    else if (id === '22222222-2222-2222-2222-222222222222') {
      status = 503;
      body = { message: 'Temporary test failure' };
    } else {
      body = { id, name: 'Proprietate test', description: 'Descriere test', type: 'land', thumbnail: '' };
    }
  } else if (url.pathname === '/get-photos') {
    status = url.searchParams.get('propertyId') === '33333333-3333-3333-3333-333333333333' ? 503 : 200;
    body = { photos: [], total: 0 };
  } else {
    throw new Error(`Unexpected API call in SSR cache test: ${url.pathname}`);
  }
  return Promise.resolve(new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  }));
};
