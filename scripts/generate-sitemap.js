/**
 * Script de generare sitemap dinamic.
 * Fetch-uiește toate proprietățile din API și generează sitemap.xml cu paginile statice + proprietăți.
 *
 * Utilizare: node scripts/generate-sitemap.js
 * Rulează înainte de deploy (sau adaugă în npm scripts).
 */

const API_URL = 'https://hai-in-sat-api.lm.r.appspot.com/get-all-properties';
const BASE_URL = 'https://hai-în-sat.ro';
const fs = require('fs');
const path = require('path');

const STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/properties', changefreq: 'daily', priority: '0.9' },
  { path: '/under-the-mountain', changefreq: 'monthly', priority: '0.8' },
  { path: '/village-of-the-month', changefreq: 'monthly', priority: '0.8' },
  { path: '/homes', changefreq: 'monthly', priority: '0.7' },
  { path: '/see-the-area', changefreq: 'monthly', priority: '0.6' },
  { path: '/about-us', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact-us', changefreq: 'monthly', priority: '0.5' },
];

const DIACRITICS_MAP = {
  'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't',
  'Ă': 'a', 'Â': 'a', 'Î': 'i', 'Ș': 's', 'Ş': 's', 'Ț': 't', 'Ţ': 't',
};

function removeDiacritics(text) {
  return text.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, char => DIACRITICS_MAP[char] || char);
}

function slugify(text) {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function generateSlug(type, name) {
  const prefix = type === 'house' ? 'casa-de-vanzare' : 'teren-de-vanzare';
  const nameSlug = slugify(name);
  return nameSlug ? `${prefix}-${nameSlug}` : prefix;
}

function buildUrlEntry(pagePath, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${BASE_URL}${pagePath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchAllProperties() {
  let page = 0;
  const size = 50;
  const allProperties = [];

  while (true) {
    const url = `${API_URL}?page=${page}&size=${size}`;
    console.log(`Fetching page ${page}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = Array.isArray(data.content) ? data.content : [];
    allProperties.push(...content);

    if (page + 1 >= (data.totalPages || 1)) break;
    page++;
  }

  return allProperties;
}

async function main() {
  const today = new Date().toISOString().split('T')[0];

  console.log('Generating sitemap...');

  let properties = [];
  try {
    properties = await fetchAllProperties();
    console.log(`Fetched ${properties.length} properties from API.`);
  } catch (err) {
    console.error('Failed to fetch properties:', err.message);
    console.log('Generating sitemap with static pages only.');
  }

  const entries = [];

  for (const page of STATIC_PAGES) {
    entries.push(buildUrlEntry(page.path, page.changefreq, page.priority, today));
  }

  for (const prop of properties) {
    if (!prop.id || !prop.name) continue;
    const slug = generateSlug(prop.type, prop.name);
    const propPath = `/property/${prop.id}/${slug}`;
    entries.push(buildUrlEntry(propPath, 'weekly', '0.7', today));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n\n')}
</urlset>
`;

  const outputPath = path.join(__dirname, '..', 'src', 'sitemap.xml');
  fs.writeFileSync(outputPath, sitemap, 'utf-8');
  console.log(`Sitemap generated: ${outputPath}`);
  console.log(`Total URLs: ${entries.length} (${STATIC_PAGES.length} static + ${properties.length} properties)`);
}

main().catch(err => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
