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
    const type = url.searchParams.get('type');
    const properties = (state.catalog ?? state.properties ?? []).filter(property => !type || property.type === type);
    const requestedPage = Number(url.searchParams.get('page') ?? 0);
    const requestedSize = Number(url.searchParams.get('size') ?? 6);
    const number = Number.isInteger(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
    const size = Number.isInteger(requestedSize) && requestedSize > 0 ? requestedSize : 6;
    const content = properties.slice(number * size, (number + 1) * size);
    body = { content, totalElements: properties.length, totalPages: Math.ceil(properties.length / size), size, number };
  } else if (url.pathname === '/get-by-id') {
    const id = url.searchParams.get('id');
    if (id === '00000000-0000-0000-0000-000000000000') body = null;
    else if (id === '22222222-2222-2222-2222-222222222222') {
      status = 503;
      body = { message: 'Temporary test failure' };
    } else if (state.catalog) {
      body = state.catalog.find(property => property.id === id) ?? null;
    } else {
      body = { name: 'Proprietate test', description: 'Descriere test', type: 'land', thumbnail: '', ...state.property, id };
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
