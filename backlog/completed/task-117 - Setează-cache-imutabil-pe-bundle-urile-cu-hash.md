---
id: TASK-117
title: Setează cache imutabil pe bundle-urile cu hash
status: Done
assignee:
  - '@codex'
created_date: '2026-05-07 07:54'
updated_date: '2026-09-29 08:16'
labels:
  - seo
  - performance
  - infra
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Bundle-urile Angular JS/CSS au hash de continut in nume. Cand continutul se schimba, se schimba si URL-ul, deci pot fi pastrate un an in cache cu immutable. Asseturile cu nume stabile necesita o politica separata.

## Implementare

- In app.yaml, handlerul /(.+\.[0-9a-f]{16}\.(?:js|css))$ apare inainte de /assets si de handlerul generic. Foloseste static_files dist/hai-in-sat/browser/\1 si upload dist/hai-in-sat/browser/.+\.[0-9a-f]{16}\.(?:js|css)$, secure: always, expiration: 365d si Cache-Control: public, max-age=31536000, immutable.
- Handlerul /assets are expiration: 30d si Cache-Control: public, max-age=2592000, fara immutable.
- In src/server.ts, aceeasi ordine si delimitare: JS/CSS cu hash de 16 hex -> un an immutable; /assets -> 30 zile; restul fisierelor statice eligibile -> 10 minute fara immutable (implicitul App Engine). HTML nu este servit prin regula de fisiere statice, conform app.yaml; rutele sale raman la SSR.
- expiration si Cache-Control au durate concordante pentru a pastra Expires coerent in App Engine.
- Politica HTML din TASK-116 (5 minute cu Date/Age pentru rute publice eligibile; no-store pentru restul) ramane neschimbata. Handlerul final script: auto nu primeste http_headers.
- Nu se modifica backend-ul, dependentele sau configuratia de deploy. Se livreaza branch ticket/... si PR.

## Corectie acceptata de owner

Cererea de implementare urmeaza explicatiei ca immutable global pe express.static ar afecta robots.txt, sitemap.xml, imagini cu nume stabile si index.html. Decizia veche de immutable global este inlocuita cu aplicare exclusiv pe JS/CSS cu hash, inclusiv local.

## Verificare

Validare YAML, build browser + SSR si verificarea numelor JS/CSS reale. Extinderea protocolului HTTP local existent pentru headerele bundle-urilor, /assets, robots/sitemap/favicon, HTML, fisiere inexistente si pastrarea comportamentului SSR din TASK-116.

## Verificare post-deploy (owner)

Dupa merge si deploy manual, verifica headerele in productie: bundle JS/CSS cu hash -> public, max-age=31536000, immutable; /assets/poza_landing1.avif -> public, max-age=2592000, fara immutable; homepage GET -> politica scurta din TASK-116. Node local nu executa handlerele GAE; efectul infrastructurii se confirma abia dupa deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 app.yaml are handlerul /(.+\.[0-9a-f]{16}\.(?:js|css))$ cu caile browser corecte, secure: always, expiration: 365d si Cache-Control: public, max-age=31536000, immutable.
- [x] #2 Handlerul JS/CSS cu hash apare inainte de /assets si de handlerul static generic.
- [x] #3 /assets are expiration: 30d si Cache-Control: public, max-age=2592000, fara immutable.
- [x] #4 Handlerul SSR final script: auto ramane neschimbat, fara http_headers; politica HTML TASK-116 este pastrata.
- [x] #5 Node local aplica immutable si un an exclusiv JS/CSS cu hash; assets au 30 zile si restul fisierelor statice eligibile 600 secunde; HTML este tratat de SSR.
- [x] #6 app.yaml este YAML valid si nu introduce service; iesirea validarii este salvata in Implementation Notes.
- [x] #7 Build browser si SSR trecute; numele JS/CSS generate potrivesc hash-ul de 16 hex, cu dovada in Implementation Notes.
- [x] #8 Verificarile HTTP locale confirma headerele bundle/asset/static, absenta immutable pe HTML si erori, si regresiile SSR (HIT/MISS,304,admin,404/503).
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Actualizeaza specificatia cu delimitarea immutable acceptata. 2. Adauga politici statice selective si concordante in app.yaml si server.ts. 3. Extinde testul HTTP existent, valideaza YAML si fisierele build; ruleaza build si testele relevante. 4. Subagent de review dupa implementare, rezolva blocantele si reverifica. 5. Dovezi in backlog, commit si PR; fara pipeline, merge sau deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. server.ts:26-28 serveste static cu express.static(maxAge 1y) -> seteaza max-age=31536000 dar FARA flag-ul immutable; HTML-ul SSR (res.send) nu are Cache-Control explicit. app.yaml nu are http_headers de cache pe handlere. De adaugat immutable pe assets cu hash si no-store pe HTML SSR.

Cross-ref: NU e duplicat cu TASK-116/TASK-13 - sunt 3 straturi distincte de caching: TASK-117 = assets cu hash (JS/CSS) immutable; TASK-116 = HTML-ul SSR (TTL scurt); TASK-13 = Brotli pe assets. Se completeaza, se pot implementa impreuna in server.ts.
Revizuire 2026-07-27 (pregatire pentru pipeline): AC-urile erau `curl` pe productie. Rescrise ca verificari de lectura pe `app.yaml` (ordinea handlerelor conteaza si e verificabila prin numarul liniei) + o validare de build ca regexul de 16 hex chiar potriveste numele generate de Angular. Headerele GAE NU se pot verifica local — `curl`-urile de productie au fost mutate in `## Verificare post-deploy (owner)`.

DECIZIE owner 2026-07-27: `immutable: true` se adauga si la `express.static` din `server.ts`, nu doar in `app.yaml` — nu mai e optional.

2026-09-29: implementare directa autorizata, cu immutable limitat la bundle-uri cu hash. Expiration explicit aliniat cu Cache-Control pe GAE. Regula locala generica este limitata la aceleasi extensii statice ca app.yaml, astfel incat HTML sa ajunga la SSR.

Validare finala 2026-09-29:
- npm run build: PASS browser + SSR. Browser hash 23c08c0b4a5bad98; SSR hash c50165fedcdac6b7. Avertismentele existente despre Sass @import si bugetele SCSS raman, fara erori de build.
- Bundle-uri generate: main.7de39a3ff164e450.js, styles.2286c2804fb6a4bf.css, polyfills.24b942ea274d948b.js, runtime.56ac8f824c932b24.js, chunk lazy 76.61a0c91c454f3090.js. Toate corespund regexului de 16 caractere hex.
- npm run test:ci: PASS, 73 teste Angular. npm run test:ssr: PASS, 26 teste Node.
- YAML validat cu js-yaml disponibil deja in dependente (PyYAML nu este instalat). Iesire: PASS app.yaml: valid YAML; handler order and exact policies correct; SSR/runtime/entrypoint unchanged; no service field. PASS hashed pattern: main, styles and lazy chunks match; unversioned files, wrong-length hashes, images and HTML excluded.
- npm run test:ssr:http: PASS, 65 raspunsuri HTTP reale prin SSR local, cu API fixture. Dovezi locale: C:\Users\Bogd\AppData\Local\Temp\hai-in-sat-ssr-cache-xUgkmY (responses.json, server.log).
- Toate cele 5 bundle-uri, cu si fara query string: 200 / public, max-age=31536000, immutable; fara X-Cache, cu nosniff. /assets/poza_landing1.avif: 200 / public, max-age=2592000. robots.txt, sitemap.xml, favicon.ico, llms.txt: 200 / public, max-age=600.
- /index.html este normalizat de Angular la homepage: 200 / X-Cache MISS / public, max-age=300, cu continut SSR (ng-state). Testul initial presupunea gresit 404; corectat dupa verificarea Location.normalize/_stripIndexHtml din Angular. /index.original.html si fisierele statice inexistente: 404 / MISS / no-store.
- Regresiile SSR trecute: GET MISS/HIT, Date/Age, 304, HEAD fara cache, query string, admin/noindex, 404, 503 + Retry-After, API degradat/recuperat, redirect canonic.
- Review independent dupa implementare: fara probleme blocante sau regresii concrete. Nu au fost necesare corecturi de implementare.
- git diff --check: PASS. Backend-ul si dependentele nu au fost modificate. Headerele App Engine se verifica de owner dupa merge si deploy manual; agentul nu face deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
TASK-117 implementat direct: bundle-urile JS/CSS cu hash primesc cache de un an si immutable; /assets are 30 de zile fara immutable, iar restul fisierelor statice eligibile au 10 minute. Politicile sunt aliniate intre app.yaml si Express; HTML ramane pe SSR cu politica TASK-116. Build, validare YAML, 73 teste Angular, 26 teste Node si 65 verificari HTTP trecute; review independent fara blocante. Livrare pe ticket/task-117-static-cache prin PR, fara deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
