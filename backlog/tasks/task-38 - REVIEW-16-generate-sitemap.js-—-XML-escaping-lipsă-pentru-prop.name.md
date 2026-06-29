---
id: TASK-38
title: 'REVIEW-16: generate-sitemap.js — XML escaping lipsă pentru prop.name'
status: To Do
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-06-17 14:24'
labels:
  - review
  - bug
  - sitemap
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`scripts/generate-sitemap.js:48-55` construiește URL-uri XML prin string interpolation:

```javascript
function buildUrlEntry(pagePath, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${BASE_URL}${pagePath}</loc>
    <lastmod>${lastmod}</lastmod>
    ...
  </url>`;
}
```

Apoi pentru proprietăți:

```javascript
for (const prop of properties) {
  if (!prop.id || !prop.name) continue;
  const slug = generateSlug(prop.type, prop.name);
  const propPath = `/property/${prop.id}/${slug}`;
  entries.push(buildUrlEntry(propPath, 'weekly', '0.7', today));
}
```

`prop.name` trece prin `slugify()` care strip-uiește orice nu e `[a-z0-9-]`, deci diacritice și `&`/`<`/`>` sunt eliminate. Asta protejează de XML breakage **pentru slug-uri**.

Dar `BASE_URL = 'https://hai-în-sat.ro'` conține caracterul `î` care, când e copy-paste-uit ca Unicode în XML, e valid (UTF-8). OK.

**Problema reală**: dacă numele proprietății conține `&` (ex: `"Casa & terenul lui Ion"`):
1. `slugify` strip-uiește `&` → slug = `casa-terenul-lui-ion`. OK pentru URL.
2. Dar `prop.id` (UUID) nu e strip-uit; UUID-uri normale n-au caractere speciale → OK.

Deci **nu e bug critic în implementarea curentă**. Totuși, există fragilitate latentă:

1. Dacă în viitor decizi să pui `prop.name` direct în `<title>` sau alt element textual XML extins (ex: news sitemap, video sitemap), va sparge.
2. Dacă slug-uri viitoare include caractere ne-XML-safe (foarte improbabil cu slugify-ul actual, dar...).
3. **Bug real existent**: BASE_URL = `'https://hai-în-sat.ro'` (cu diacritică) interpolat direct fără IDN encoding. Când Google parsează `<loc>`, conform RFC pentru sitemap.xml, URL-ul trebuie să fie ASCII (punycode pentru host) și URL-encoded pentru path. Diacriticele în hostname nu sunt strict compatibile cu toate parser-ele. Verificat cu live tooling: Google acceptă, dar e best-practice să folosești punycode.

## Cum se rezolvă

### Phase 1 — Helper de XML escape

Adaugă în `scripts/generate-sitemap.js`:

```javascript
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}
```

Aplică în `buildUrlEntry`:

```javascript
function buildUrlEntry(pagePath, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${xmlEscape(BASE_URL + pagePath)}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>${xmlEscape(changefreq)}</changefreq>
    <priority>${xmlEscape(priority)}</priority>
  </url>`;
}
```

### Phase 2 — Decide IDN

Decide canonical: punycode (`xn--hai-n-sat-t5a.ro`) vs Unicode (`hai-în-sat.ro`).

- Toolarul SEO majoritar acceptă ambele cu redirect între ele.
- Pentru sitemap.xml, recomandare RFC: `<loc>` trebuie URL-encoded și ASCII pentru host. Folosește punycode.
- Schimbă BASE_URL la `https://xn--hai-n-sat-t5a.ro` și update și canonical/og:url în SeoService și `index.html` să fie consistent.

(Notă: canonical-ul a fost DECIS ca IDN — vezi TASK-49 și TASK-MANUAL-1. Aliniază `BASE_URL`/escaping-ul cu forma canonică IDN; nu re-decide aici.)

### Phase 3 — Test

`xmllint --noout src/sitemap.xml` (Linux/WSL) sau https://www.xmlvalidation.com/ — trebuie să fie XML valid.

## Fișiere afectate

- `scripts/generate-sitemap.js`
- (potential) `src/app/service/seo.service.ts` (BASE_URL aliniat)
- (potential) `src/index.html` (JSON-LD URLs aliniați)

## Efort

1 oră.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `scripts/generate-sitemap.js` are funcție `xmlEscape` aplicată la toate string-urile interpolate în XML
- [ ] #2 `npm run generate-sitemap` urmat de `xmllint --noout src/sitemap.xml` (sau echivalent online) trece fără erori
- [ ] #3 Decizie luată privind formă canonică (Unicode vs punycode) și aplicată consistent în BASE_URL al script-ului, SeoService, și `index.html`
- [ ] #4 Sitemap-ul rezultat trece validarea Google Search Console (Submit → Status: Success)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. generate-sitemap.js nu are functie xmlEscape; buildUrlEntry (liniile 48-55) interpoleaza direct. BASE_URL = https://hai-în-sat.ro (IDN Unicode, nu punycode). Slug-urile sunt deja stripuite de slugify, deci nu e bug critic acum, dar lipseste escaping-ul defensiv + decizia IDN vs punycode.
<!-- SECTION:NOTES:END -->
