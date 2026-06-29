---
id: TASK-17
title: Crawl JS-rendered și audit imagini per pagină
status: Done
assignee: []
created_date: '2026-05-07 08:03'
updated_date: '2026-06-12 16:00'
labels:
  - seo
  - images
  - a11y
  - follow-up
dependencies:
  - TASK-2
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
  - ../../../../seo-audit-2026-06-12/FULL-AUDIT-REPORT.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Auditul inițial s-a făcut pe HTML brut (fără execuție JS). Mulți factori on-page (heading-uri h1/h2/h3, alt-text pe imagini, link-uri interne, dimensiuni reale per imagine, schema-uri injectate client-side) NU se pot evalua decât după rendering.

După ce TASK-2 livrează SSR/prerender, aceste lucruri vor fi vizibile direct, dar până atunci este utilă o auditare separată cu un crawler care rulează Chromium.

## Cum

1. **Rendered crawl** — alege una:
   - `/seo firecrawl https://xn--hai-n-sat-t5a.ro/` dacă extensia Firecrawl MCP e instalată
   - Screaming Frog SEO Spider cu rendering enabled (versiune paid sau trial)
   - Sau script Puppeteer simplu: pentru fiecare URL din sitemap, deschide pagina, așteaptă networkidle, extrage h1/h2/h3, alt-text, internal link-uri, JSON-LD-uri vizibile.

2. **Image audit** după crawl:
   - Toate `<img>` au alt-text non-empty? (Decision: decorative images au `alt=""` explicit, restul descriere semantică)
   - Toate `<img>` au `width` și `height` (previne CLS)?
   - Lazy-loading pe imagini below-the-fold?
   - Format AVIF/WebP cu fallback JPEG via `<picture>`?
   - Vezi `src/app/service/photo.service.ts` — generație de variante

3. **Heading hierarchy**: fiecare pagină are exact 1x h1, fără sărituri (h1 → h3 sărind h2 = problem).

4. **Internal linking gaps**: pagini orfane (fără link din alte pagini), număr de internal links per pagină.

## Output

Un fișier `seo-audit-output/RENDERED-CRAWL-FINDINGS.md` cu remedii noi. Eventual deschide task-uri specifice pentru fiecare problemă găsită (alt-text missing, h1 duplicate, etc.).

## Fișiere afectate

De determinat post-crawl. Probabil:
- `src/app/components/*/*.html` (corectări heading hierarchy, alt-text)
- `src/app/service/photo.service.ts` (variante imagine)

## Efort

2-3 ore pentru crawl + raport; remedierile depind de finding-uri (estimat 1-3 zile suplimentare).
<!-- SECTION:DESCRIPTION:END -->

## Update 2026-06-12 — ÎNDEPLINIT prin auditul SEO #2

Auditul complet din 2026-06-12 a livrat exact acest deliverable (locație diferită de cea planificată, conținut echivalent și mai amplu): crawl pe toate cele 22 URL-uri din sitemap cu HTML SSR complet randat, salvat local.

- Raport: `seo-audit-2026-06-12/FULL-AUDIT-REPORT.md` + `findings/visual.md` (imagini) + `findings/content.md` (headings) — echivalentul lui RENDERED-CRAWL-FINDINGS.md
- Inventar per pagină (h1/h2 count, img, alt lipsă, lazy, internal links, word count): `seo-audit-2026-06-12/crawl/inventory.csv` + `inventory.json` + `jsonld-summary.json`
- H1: lipsă pe /under-the-mountain și /contact-us; multiplu pe /homes, /see-the-area, /about-us, /village-of-the-month → TASK-21
- Alt lipsă: ~40% din imaginile anunțurilor → TASK-24
- Descoperire majoră neanticipată: imaginile sunt data:URI base64 (HTML 3,7–42,5 MB) → TASK-3
- Task-uri create pentru toate finding-urile high/medium: TASK-47…TASK-16 (AC #5 ✓)

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Raport rendered crawl scris la `seo-audit-output/RENDERED-CRAWL-FINDINGS.md`
- [x] #2 Inventariere completă: pentru fiecare URL din sitemap, lista h1/h2/h3, count `<img>`, count `<img alt="">`, count internal links
- [x] #3 Identificate paginile cu h1 lipsă, h1 duplicat sau ierarhie spartă
- [x] #4 Identificate `<img>` fără alt text NEdecorativ; lista lor cu pagini și componente
- [x] #5 Pentru fiecare finding categorizat ca high/medium, există fie un fix direct fie un task nou în backlog
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid ca deliverable de audit. Acum ca SSR randeaza HTML complet (h1/alt/JSON-LD vizibile in raw HTML), un crawl rendered e mai usor de interpretat. Inca nu exista seo-audit-output/RENDERED-CRAWL-FINDINGS.md. Task de tip raport, nu modificare de cod.

Inchis 2026-06-12: deliverable-ul livrat de auditul SEO #2 (folderul seo-audit-2026-06-12/ la radacina workspace-ului). AC#1 satisfacut prin echivalent la alta cale (FULL-AUDIT-REPORT.md + findings/), nu la seo-audit-output/RENDERED-CRAWL-FINDINGS.md.
<!-- SECTION:NOTES:END -->
