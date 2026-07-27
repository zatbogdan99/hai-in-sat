---
id: TASK-13
title: Activează compresie Brotli pe asseturi statice
status: To Do
assignee: []
created_date: '2026-05-07 08:04'
updated_date: '2026-07-06'
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
> ⛔ **WONT-DO / AMÂNAT (decizie owner, 2026-07-06).** Motivul: în producție, bundle-urile JS/CSS sunt servite STATIC de App Engine prin handlerele din `app.yaml` (bypass Node, gzip automat de la Google Frontend) — deci soluția `express-static-gzip` din acest task NU s-ar aplica deloc în producție. Singura cale reală ar fi scoaterea handler-ului static din `app.yaml` și rutarea bundle-urilor prin Node (mai lent per request, consumă instanța F2, pierde servirea din edge-ul Google) — cost care nu se justifică pentru ~150–200 KB câștig pe main.js, câștig care se micșorează oricum după TASK-130 (lazy-loading) și TASK-131 (esbuild). **De redeschis doar dacă**, după livrarea TASK-130 + TASK-131, bundle-ul inițial gzip rămâne >400 KB și există motive de performanță măsurate — caz în care designul corect e varianta „prin Node" descrisă mai jos.

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
   Notă: App Engine static handlers nu pot citi `Accept-Encoding` direct — DAR site-ul rulează deja pe runtime Node (SSR/Express), deci calea curată e middleware **`express-static-gzip`** în `src/server.ts`, care servește `.br`/`.gz` cu content negotiation automat (pe baza `Accept-Encoding`). Nu mai e nevoie de handler-e `.br` în `app.yaml` și nici de migrare la Flexible/Cloud Run.

3. Verifică: `curl -H "Accept-Encoding: br" -I https://xn--hai-n-sat-t5a.ro/main.<hash>.js` → `Content-Encoding: br` + Content-Length redus față de gzip.

## Trade-off / dependențe

SSR-ul pe Node există deja → servirea brotli e simplă (`express-static-gzip` în `server.ts`). ⚠️ Partea de GENERARE a fișierelor `.br`/`.gz` depinde de builder: `compression-webpack-plugin` merge DOAR cu builder-ul webpack (`:browser`). Dacă se face TASK-131 (migrare la `:application`/esbuild), webpack dispare → generează `.br`/`.gz` cu un **post-build script** (Node + `zlib`/brotli pe `dist/.../browser/**`) în loc de plugin webpack. Coordonează cu TASK-131.

## Fișiere afectate

- `src/server.ts` — middleware `express-static-gzip` (servire .br/.gz cu content negotiation)
- Generarea `.br`/`.gz` la build: post-build script Node (dacă pe `:application`/esbuild — vezi TASK-131) SAU `compression-webpack-plugin` (doar dacă rămâi pe `:browser`)
- `package.json` (dependența `express-static-gzip` + scriptul de compresie)

## Efort

4 ore (SSR/Node există deja → express-static-gzip + script de compresie la build).
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
