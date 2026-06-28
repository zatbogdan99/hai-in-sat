---
id: TASK-18
title: Activează compresie Brotli pe asseturi statice
status: To Do
assignee: []
created_date: '2026-05-07 08:04'
updated_date: '2026-06-17 08:47'
labels:
  - seo
  - performance
  - perf
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Response curent pentru `main.js` folosește `Content-Encoding: gzip` (verificat — 684 KB gzip dintr-un original de 2.23 MB). Brotli (q=11) ar reduce tipic cu încă 20-30% pe JS bundles → estimat 480-540 KB pe `main.js`. Cu LCP/TTFB sensibil, fiecare 100KB economisit contează pe mobile.

## Cum

App Engine standard NU face Brotli automat. Trebuie precompresie + servire `.br` files.

1. Adaugă plugin de compresie la build-ul Angular. Webpack-based (`extra-webpack.config.js` există dar e neactiv per CLAUDE.md):
   - `npm install --save-dev compression-webpack-plugin`
   - Configurează 2 instances ale plugin-ului: gzip + brotli, generând `.gz` și `.br` alături de fiecare asset.
   - Sau folosește custom builder Angular (mai complicat).

2. În `app.yaml`, configurează handler care servește `.br` cu `Content-Encoding: br` când Accept-Encoding includes "br":
   ```yaml
   - url: /(.+\.[0-9a-f]{16}\.js)\.br
     static_files: dist/hai-in-sat/\1.br
     upload: dist/hai-in-sat/.+\.[0-9a-f]{16}\.js\.br
     mime_type: application/javascript
     http_headers:
       Cache-Control: "public, max-age=31536000, immutable"
       Content-Encoding: br
   ```
   Notă: App Engine static handlers nu pot citi `Accept-Encoding` direct. Soluții:
   - **Mai simplu**: migrează la App Engine Flexible / Cloud Run cu Nginx/Express care face content negotiation.
   - **Combinat cu SSR (TASK-2)**: dacă oricum migrezi la Node.js runtime, folosește middleware `express-static-gzip` care servește .br/.gz dynamic.

3. Verifică: `curl -H "Accept-Encoding: br" -I https://xn--hai-n-sat-t5a.ro/main.<hash>.js` → `Content-Encoding: br` + Content-Length redus față de gzip.

## Trade-off

Dacă TASK-2 livrează SSR via Node.js runtime, brotli e ușor de adăugat (`express-static-gzip`). Dacă rămânem pe App Engine static, e mai complicat. Recomandare: leagă de TASK-2 sau task de migrare runtime.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/extra-webpack.config.js` sau `angular.json` (build pipeline)
- `hai-in-sat/hai-in-sat/app.yaml` (handlers)
- (eventual) `server.ts` (dacă SSR) — middleware `express-static-gzip`

## Efort

4 ore (combinat cu TASK-2); 1 zi standalone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Build-ul Angular generează fișiere `.br` (brotli q=11) alături de fiecare asset main/runtime/polyfill/styles
- [ ] #2 Cu Accept-Encoding: br, response pentru `main.<hash>.js` are `Content-Encoding: br` și transfer mai mic decât varianta gzip cu cel puțin 15%
- [ ] #3 Cu Accept-Encoding: gzip (fără br), response folosește gzip — fallback funcționează
- [ ] #4 Lighthouse mobile pe `/` arată „Use efficient cache policy" și „Enable text compression" verzi
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. Build-ul nu genereaza .br; server.ts foloseste express.static simplu (fara express-static-gzip). Acum ca rulam Node SSR, calea recomandata e middleware express-static-gzip (serveste .br/.gz cu content negotiation) - mai simpla decat pe App Engine static.
<!-- SECTION:NOTES:END -->
