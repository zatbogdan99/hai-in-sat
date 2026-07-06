---
id: TASK-10
title: Returnează 404/noindex pentru rute admin și paths necunoscute
status: To Do
assignee: []
created_date: '2026-05-07 07:54'
updated_date: '2026-07-06'
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

## Cum (mecanism ales — refolosește pattern-ul SSR_RENDER_STATE existent; verificat 2026-07-06)

**Context:** TASK-47 (livrat) a introdus deja `src/app/ssr-render-state.ts` — un `InjectionToken` per-request prin care componentele semnalează serverului starea randării (`serviceUnavailable` → 503). Extindem EXACT același pattern pentru 404, în loc să duplicăm o listă de rute în `server.ts`:

1. **`ssr-render-state.ts`**: adaugă câmpul `notFound: boolean` (default `false`) în `SsrRenderState`.
2. **Componentă nouă `src/app/not-found/not-found.component.ts`** (convenția repo-ului: componentele stau direct în `src/app/<nume>/`, NU în `src/app/components/`): mesaj prietenos în română + link `<a routerLink="/properties">`; în `ngOnInit` — (a) `seo.updatePageMeta` cu titlu „Pagina nu a fost găsită", (b) injectează `SSR_RENDER_STATE` (optional) și setează `notFound = true` când rulează pe server, (c) `seo.setNoindex()`.
3. **`app.routes.ts`**: adaugă explicit `{ path: '', component: NewLandingPageComponent }` (azi homepage-ul e prins doar de wildcard!) și schimbă wildcard-ul `**` la `NotFoundComponent`.
4. **`server.ts`**: după render, dacă `ssrRenderState.notFound` → `res.status(404).send(html)` (analog cu verificarea `serviceUnavailable` existentă). HTML-ul e chiar pagina NotFound randată, cu meta noindex.
5. **Proprietăți inexistente (gaură descoperită la verificare):** azi, `property-details.component.ts` la proprietate negăsită sau eroare non-tranzitorie face `router.navigate(['/properties'])` → pe SSR asta randează conținutul `/properties` pe URL-ul `/property/xxx` cu **200 + canonical greșit** (soft-404). Schimbă: pe server, seteaza `notFound = true` (404); în browser, poate rămâne redirectul actual.
6. **Noindex pe `/login` și `/add-property`**: `app.yaml` NU poate seta `X-Robots-Tag` pe rute SSR (`script: auto` nu suportă `http_headers`) — deci: middleware mic în `server.ts` care setează `X-Robots-Tag: noindex, nofollow` pentru cele două path-uri + `SeoService.setNoindex()` (metodă nouă: `meta.updateTag({name:'robots', content:'noindex, nofollow'})`) apelată din `LoginComponent` și `AddPropertyComponent`.

## Fișiere afectate

- `src/app/ssr-render-state.ts` (câmp `notFound`)
- `src/server.ts` (status 404 după render + `X-Robots-Tag` pe `/login`, `/add-property`; NU atinge logica de timeout/503 din TASK-47; coordonare cu TASK-4/6/11 — vezi ordinea middleware în TASK-4)
- `src/app/app.routes.ts` (homepage explicit pe `path: ''`; wildcard `**` → `NotFoundComponent`)
- `src/app/not-found/not-found.component.ts` (+ .html/.scss — de creat)
- `src/app/service/seo.service.ts` (metoda `setNoindex()`)
- `src/app/property-details/property-details.component.ts` (cazul proprietate negăsită → 404 pe SSR, pct. 5)
- `src/app/login/login.component.ts`, `src/app/add-property/add-property.component.ts` (apel `setNoindex()`)

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
- [ ] #7 GET `/property/<uuid-valid-dar-inexistent>/orice-slug` returnează HTTP 404 pe SSR (azi: 200 cu conținutul /properties — soft 404)
- [ ] #8 Homepage-ul răspunde identic ca înainte pe `/` (ruta explicită `path: ''` nu schimbă comportamentul), iar `/` NU e afectat de noindex/404
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. app.routes.ts:30 are tot wildcard ** -> NewLandingPageComponent (nu exista NotFoundComponent). server.ts (CommonEngine) nu are middleware de 404/noindex inainte de render. app.yaml nu are http_headers cu X-Robots-Tag pentru /login sau /add-property. SeoService nu are setNoindex(). Tot planul ramane valabil.

Cross-ref: complementar cu noul TASK-47 (5xx/503 SSR) - TASK-47 trateaza erorile de server, TASK-10 ramane pentru 404-uri reale + noindex pe /login si /add-property; impart server.ts dar nu se suprapun.
<!-- SECTION:NOTES:END -->
