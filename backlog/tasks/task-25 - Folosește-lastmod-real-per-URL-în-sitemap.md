---
id: TASK-25
title: Folosește lastmod real per URL în sitemap
status: To Do
assignee: []
created_date: '2026-05-07 08:00'
updated_date: '2026-06-17 08:46'
labels:
  - seo
  - sitemap
  - crawl-budget
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`sitemap.xml` curent (22 URL-uri) are `lastmod = 2026-04-16` PE TOATE entry-urile. Asta e probabil data build-ului. Google folosește `lastmod` pentru a aloca crawl budget — când e static, semnalul e ignorat. Cu `lastmod` real per pagină, Google re-crawlează exact paginile care s-au schimbat.

Impact: după ce listezi o proprietate nouă sau actualizezi descrierea, Googlebot revine în ore (vs. zile sau săptămâni).

## Cum

În `hai-in-sat/hai-in-sat/scripts/generate-sitemap.js`:

1. Pentru proprietăți: query API-ul backend pentru fiecare proprietate, citește `property.updatedAt` (sau echivalent) și folosește acea valoare ISO ca `<lastmod>`.
2. Pentru pagini statice (acasă, /properties, /under-the-mountain etc.): folosește data ultimului commit pe componenta corespondentă (`git log -1 --format=%cI <component-path>`), sau hardcodează data deploy-ului ca fallback (mai bine decât toate egale).
3. `/properties` (listing) ar trebui să aibă `lastmod = max(updatedAt)` peste toate proprietățile (orice listing nou pe pagina 1 modifică listing-ul).

Dacă backend-ul nu expune `updatedAt`: ține o coloană `updated_at` în MongoDB pe `properties` și expune-o în răspunsul `GET /properties/list`.

## Verificare

`curl https://xn--hai-n-sat-t5a.ro/sitemap.xml | grep lastmod` — să fie diverse (cel puțin pentru proprietăți).

## Fișiere afectate

- `hai-in-sat/hai-in-sat/scripts/generate-sitemap.js`
- (eventual) backend Java: `java.hai-in-sat/hai-in-sat/src/main/java/.../PropertyResponseDto.java` pentru a expune `updatedAt`
- `npm run generate-sitemap` înainte de fiecare build (deja e pattern-ul)

## Efort

2 ore (dacă API-ul deja expune `updatedAt`); 4-5 ore total dacă trebuie modificat și backend-ul.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 sitemap.xml conține `lastmod`-uri DIVERSE: cel puțin 3 valori diferite peste cele 22 URL-uri
- [ ] #2 `lastmod` pe URL-uri de proprietate corespunde cu data ultimei actualizări în baza de date
- [ ] #3 `lastmod` folosește format ISO 8601 valid (`yyyy-mm-dd` sau `yyyy-mm-ddThh:mm:ssZ`)
- [ ] #4 Pagini statice au `lastmod` cel puțin egal cu data ultimului commit relevant pe codul componentei
- [ ] #5 Comanda `npm run generate-sitemap` rulează fără erori și pe API real, nu doar pe mock
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. generate-sitemap.js foloseste 'today' (linia 83) pentru lastmod la TOATE intrarile (liniile 99, 106) - nu citeste updatedAt per proprietate. Backend-ul nu expune updatedAt in /get-all-properties. Niciun AC satisfacut.
<!-- SECTION:NOTES:END -->
