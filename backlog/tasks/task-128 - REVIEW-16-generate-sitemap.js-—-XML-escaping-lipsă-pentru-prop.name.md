---
id: TASK-128
title: 'REVIEW-16: generate-sitemap.js — XML escaping lipsă pentru prop.name'
status: To Do
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-07-27'
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

### Phase 2 — DECIS: unicode IDN peste tot, NU punycode

> **Decizie owner (2026-07-27).** `BASE_URL` ramane `https://hai-în-sat.ro` (forma unicode) in `scripts/generate-sitemap.js`, in `src/app/service/seo.service.ts` si in `src/index.html`. NU se trece pe punycode nicaieri.

Motivul: e forma canonica deja folosita in canonical tags, og:url si JSON-LD, si e conventia scrisa in `CLAUDE.md` („links in code, sitemaps, and SEO metadata use the Unicode form, not punycode"). A schimba doar sitemap-ul pe punycode ar crea un dezacord sitemap↔canonical, greu de explicat la audituri viitoare.

Acest task **nu re-decide nimic pe tema IDN** — analiza din sectiunea „De ce" despre recomandarea RFC ramane ca nota istorica, dar concluzia e cea de mai sus. Ce se face efectiv aici e DOAR escaping-ul defensiv din Phase 1.

Singura exceptie ramane headerul `Host` din TASK-113, care soseste inevitabil in punycode — acolo e forma corecta, si nu contrazice decizia asta.

### Phase 3 — Test (local, fara unelte externe)

`xmllint` nu e disponibil implicit pe Windows, iar validatoarele online nu sunt automatizabile. Foloseste parserul XML din Python, care e prezent pe masina:

```bash
npm run generate-sitemap
python -c "import xml.etree.ElementTree as ET; ET.parse('src/sitemap.xml'); print('XML valid')"
```

Pentru a demonstra ca escaping-ul chiar functioneaza, adauga si un test cu date sintetice: apeleaza `xmlEscape` cu un string care contine `&`, `<`, `>`, `"` si `'` si verifica iesirea.

## Fișiere afectate

- `scripts/generate-sitemap.js`
- (potential) `src/app/service/seo.service.ts` (BASE_URL aliniat)
- (potential) `src/index.html` (JSON-LD URLs aliniați)

## Efort

1 oră.
## Verificare post-deploy (owner)

Nu e cazul. Escaping-ul XML si forma canonica se verifica integral local, pe `src/sitemap.xml` regenerat. Resubmiterea sitemap-ului in Search Console e acoperita de TASK-MANUAL-2.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `scripts/generate-sitemap.js` are functia `xmlEscape(s)` care inlocuieste, in aceasta ordine, `&` → `&amp;`, apoi `<`, `>`, `'`, `"` (ampersandul PRIMUL — altfel se dubleaza escaping-ul entitatilor deja produse)
- [ ] #2 `xmlEscape` e aplicat pe TOATE valorile interpolate in XML din `buildUrlEntry` (azi liniile 48-55): `loc`, `lastmod`, `changefreq`, `priority`
- [ ] #3 `BASE_URL` din `scripts/generate-sitemap.js` (azi linia 10) ramane forma unicode `https://hai-în-sat.ro` — NU se converteste in punycode (decizie owner 2026-07-27)
- [ ] #4 `src/app/service/seo.service.ts` si `src/index.html` NU se modifica: forma unicode e deja cea folosita si ramane canonica
- [ ] #5 Implementatorul a rulat `npm run generate-sitemap` urmat de `python -c "import xml.etree.ElementTree as ET; ET.parse('src/sitemap.xml'); print('XML valid')"` si a lipit iesirea in `## Implementation Notes`
- [ ] #6 Implementatorul a demonstrat escaping-ul cu date sintetice si a lipit rezultatul: `xmlEscape("Casa & terenul <lui> Ion's")` produce `Casa &amp; terenul &lt;lui&gt; Ion&apos;s` — fara dubla-escapare a ampersandului
- [ ] #7 `src/sitemap.xml` regenerat contine acelasi numar de intrari `<url>` ca inainte (escaping-ul nu trebuie sa piarda intrari)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. generate-sitemap.js nu are functie xmlEscape; buildUrlEntry (liniile 48-55) interpoleaza direct. BASE_URL = https://hai-în-sat.ro (IDN Unicode, nu punycode). Slug-urile sunt deja stripuite de slugify, deci nu e bug critic acum, dar lipseste escaping-ul defensiv + decizia IDN vs punycode.
Verificare 2026-07-06: neschimbat — generate-sitemap.js fara xmlEscape (buildUrlEntry liniile 48-55, interpolare directa), BASE_URL = forma unicode (linia 10). Reamintire: canonicalul DECIS ramane IDN (TASK-MANUAL-1 e acum in wont-do — domeniul ASCII nu se cumpara momentan, ceea ce intareste decizia: canonical IDN); aici doar aliniezi si escapezi defensiv, nu re-decizi forma.
Revizuire 2026-07-27 (pregatire pentru pipeline). CONTRADICTIA principala rezolvata: descrierea (Phase 2) recomanda punycode in `<loc>`, iar nota de verificare spunea ca forma canonica e DECISA ca IDN unicode. Un agent ar fi trebuit sa aleaga singur intre doua instructiuni opuse din acelasi fisier. DECIZIE owner: **unicode IDN peste tot**; Phase 2 rescrisa ca decizie, nu ca intrebare.

Consecinta: task-ul se reduce la escaping defensiv, deci a devenit mic si sigur.

Alte ambiguitati eliminate:
1. Phase 3 cerea `xmllint` (absent pe Windows) sau un validator online (neautomatizabil) → inlocuite cu parserul XML din Python.
2. AC-ul vechi #3 („decizie luata privind forma canonica") era un criteriu care cerea o decizie, nu o verificare → inlocuit cu criteriul concret: `BASE_URL` ramane unicode.
3. AC-ul vechi #4 (validare in Google Search Console) cere productie → eliminat; resubmit-ul sitemap-ului e deja acoperit de TASK-MANUAL-2.
4. Adaugat criteriul de ordine a inlocuirilor in `xmlEscape` — o implementare care escapeaza `&` la final produce `&amp;lt;` in loc de `&lt;`, bug clasic si tacut.
<!-- SECTION:NOTES:END -->
