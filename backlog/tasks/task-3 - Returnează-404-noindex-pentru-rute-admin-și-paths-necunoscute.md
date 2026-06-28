---
id: TASK-3
title: Returnează 404/noindex pentru rute admin și paths necunoscute
status: To Do
assignee: []
created_date: '2026-05-07 07:54'
updated_date: '2026-06-17 15:02'
labels:
  - seo
  - critical
  - technical
  - indexability
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Serverul (App Engine static) returnează HTTP 200 + `index.html` pentru ORICE path. Test:
- `/this-page-does-not-exist` → 200 cu shell + `<meta robots="index, follow">` (soft 404)
- `/login` → 200 cu `robots="index, follow"` (admin route indexabil)
- `/add-property` → 200 cu `robots="index, follow"`
- `/.well-known/ai-policy` → 200 cu shell

Google penalizează soft 404 (poate de-indexa URL-uri). Login UI și add-property fac leak prin link-uri externe. `robots.txt` blochează crawl, dar nu indexarea.

## Cum

1. În `app.yaml`, adaugă handler dedicat pentru `/login` și `/add-property` cu `http_headers`:
   ```yaml
   X-Robots-Tag: noindex, nofollow
   ```
2. Pentru rute necunoscute, decide:
   - **Variantă A**: route guard în SPA care detectează rute invalide și injectează `<meta name="robots" content="noindex">` dynamic + setează status 404 prin server-side când e SSR.
   - **Variantă B (mai bună)**: în middleware-ul SSR din `src/server.ts` (SSR-ul există deja, prin CommonEngine), validează path-ul împotriva listei: rutele statice cunoscute + verificare UUID pe `/property/`. Dacă nu match, returnează HTTP 404 cu pagină 404 reală (`NewLandingPageComponent` în prezent este wildcard — schimbă la `NotFoundComponent` dedicat).
3. Component nou: `src/app/components/not-found/not-found.component.ts` cu mesaj prietenos în română și link spre `/properties`.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/app.yaml` (handlers, http_headers pentru `/login`, `/add-property`)
- `hai-in-sat/hai-in-sat/src/app/app.routes.ts` (înlocuiește wildcard de la `NewLandingPageComponent` → `NotFoundComponent`; mută homepage pe `path: ''`)
- `hai-in-sat/hai-in-sat/src/app/components/not-found/not-found.component.ts` (de creat)
- `hai-in-sat/hai-in-sat/src/app/service/seo.service.ts` (adaugă `setNoindex()` helper dacă lipsește)
- `src/server.ts` (SSR existent): validează path-ul și răspunde 404 înainte de a servi index.html pentru paths necunoscute (același `server.ts` e atins și de TASK-47 și TASK-49 — coordonează modificările ca să nu se calce reciproc)

## Efort

4-6 ore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GET `/login` returnează response cu header `X-Robots-Tag: noindex` SAU HTML cu `<meta name="robots" content="noindex">`
- [ ] #2 GET `/add-property` returnează response cu noindex (header sau meta tag)
- [ ] #3 GET `/this-page-does-not-exist` returnează HTTP 404 (sau 410), NU 200
- [ ] #4 GET `/random-string-12345` returnează 404 și pagina afișează `NotFoundComponent` cu link spre `/properties`
- [ ] #5 GET pentru o proprietate validă (din sitemap) returnează 200
- [ ] #6 Sitemap-ul nu include `/login` sau `/add-property`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. app.routes.ts:30 are tot wildcard ** -> NewLandingPageComponent (nu exista NotFoundComponent). server.ts (CommonEngine) nu are middleware de 404/noindex inainte de render. app.yaml nu are http_headers cu X-Robots-Tag pentru /login sau /add-property. SeoService nu are setNoindex(). Tot planul ramane valabil.

Cross-ref: complementar cu noul TASK-47 (5xx/503 SSR) - TASK-47 trateaza erorile de server, TASK-3 ramane pentru 404-uri reale + noindex pe /login si /add-property; impart server.ts dar nu se suprapun.
<!-- SECTION:NOTES:END -->
