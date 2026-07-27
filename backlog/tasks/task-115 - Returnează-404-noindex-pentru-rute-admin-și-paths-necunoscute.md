---
id: TASK-115
title: Returnează 404/noindex pentru rute admin și paths necunoscute
status: To Do
assignee: []
created_date: '2026-05-07 07:54'
updated_date: '2026-07-27'
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
- `src/server.ts` (status 404 după render + `X-Robots-Tag` pe `/login`, `/add-property`; NU atinge logica de timeout/503 din TASK-47; coordonare cu TASK-113/6/11 — vezi ordinea middleware în TASK-113)
- `src/app/app.routes.ts` (homepage explicit pe `path: ''`; wildcard `**` → `NotFoundComponent`)
- `src/app/not-found/not-found.component.ts` (+ .html/.scss — de creat)
- `src/app/service/seo.service.ts` (metoda `setNoindex()`)
- `src/app/property-details/property-details.component.ts` (cazul proprietate negăsită → 404 pe SSR, pct. 5)
- `src/app/login/login.component.ts`, `src/app/add-property/add-property.component.ts` (apel `setNoindex()`)

## Efort

4-6 ore.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Dupa merge si deploy:

```bash
curl -sI https://xn--hai-n-sat-t5a.ro/this-page-does-not-exist   # 404
curl -sI https://xn--hai-n-sat-t5a.ro/login                      # X-Robots-Tag: noindex
curl -sI https://xn--hai-n-sat-t5a.ro/add-property               # X-Robots-Tag: noindex
curl -sI https://xn--hai-n-sat-t5a.ro/                           # 200, fara noindex
```

In Google Search Console, dupa 2-4 saptamani: raportul **Pages** trebuie sa arate scaderea „Soft 404" si aparitia URL-urilor `/login` si `/add-property` la „Excluded by noindex" (in loc de indexate).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/ssr-render-state.ts`: interfata `SsrRenderState` are campul `notFound: boolean`, cu valoarea implicita `false` acolo unde se construieste starea
- [ ] #2 Exista `src/app/not-found/not-found.component.ts` (+ `.html`, `.scss`), componenta standalone, plasata direct in `src/app/<nume>/` conform conventiei repo-ului (NU in `src/app/components/`)
- [ ] #3 `NotFoundComponent.ngOnInit` face trei lucruri: (a) `seo.updatePageMeta(...)` cu titlul „Pagina nu a fost găsită", (b) `seo.setNoindex()`, (c) injecteaza `SSR_RENDER_STATE` ca optional si seteaza `notFound = true` doar cand ruleaza pe server (`isPlatformServer(platformId)`)
- [ ] #4 Template-ul `not-found.component.html` contine mesaj in romana si un link real `<a routerLink="/properties">`
- [ ] #5 `src/app/service/seo.service.ts` are metoda publica noua `setNoindex()` care apeleaza `meta.updateTag({ name: 'robots', content: 'noindex, nofollow' })`
- [ ] #6 `src/app/app.routes.ts` contine ruta explicita `{ path: '', component: NewLandingPageComponent }`, iar wildcard-ul `{ path: '**', ... }` pointeaza acum spre `NotFoundComponent` (azi spre `NewLandingPageComponent`)
- [ ] #7 `src/server.ts`: dupa render, cand `ssrRenderState.notFound` e `true` → `res.status(404)`; verificarea `serviceUnavailable`/503 din TASK-47 ramane in cod, neatinsa
- [ ] #8 `src/server.ts` contine un middleware care seteaza `X-Robots-Tag: noindex, nofollow` pentru path-urile `/login` si `/add-property`
- [ ] #9 `login.component.ts` si `add-property.component.ts` apeleaza `seo.setNoindex()` in `ngOnInit`
- [ ] #10 `property-details.component.ts`: pe ramura „proprietate negasita / eroare non-tranzitorie", cand ruleaza pe server seteaza `notFound = true` in loc sa apeleze `router.navigate(['/properties'])`; in browser redirectul actual poate ramane
- [ ] #11 `scripts/generate-sitemap.js`: lista `STATIC_PAGES` nu contine `/login` si nici `/add-property` (verificare prin lectura)
- [ ] #12 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit iesirile in `## Implementation Notes`: `curl -sI http://localhost:4000/this-page-does-not-exist` → **404**; `curl -sI http://localhost:4000/login` → contine `X-Robots-Tag`; `curl -sI http://localhost:4000/` → **200**, fara `X-Robots-Tag`; `curl -s http://localhost:4000/random-string-12345` → HTML-ul contine `href="/properties"`; `curl -sI http://localhost:4000/property/00000000-0000-0000-0000-000000000000/orice-slug` → **404**
- [ ] #13 `npx ng test --watch=false --browsers=ChromeHeadless` trece (suita e verde azi: 52/52 — orice esec nou e regresie introdusa de acest task)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. app.routes.ts:30 are tot wildcard ** -> NewLandingPageComponent (nu exista NotFoundComponent). server.ts (CommonEngine) nu are middleware de 404/noindex inainte de render. app.yaml nu are http_headers cu X-Robots-Tag pentru /login sau /add-property. SeoService nu are setNoindex(). Tot planul ramane valabil.

Cross-ref: complementar cu noul TASK-47 (5xx/503 SSR) - TASK-47 trateaza erorile de server, TASK-115 ramane pentru 404-uri reale + noindex pe /login si /add-property; impart server.ts dar nu se suprapun.
Revizuire 2026-07-27 (pregatire pentru pipeline): AC-urile cereau `GET` pe rutele de productie. Rescrise ca verificari statice pe fisierele exacte + protocolul SSR local pe `http://localhost:4000`, care randeaza identic. Verificarile de productie si urmarirea in Search Console au trecut in `## Verificare post-deploy (owner)`.

Planul din descriere era deja precis (mecanism ales, fisiere si linii exacte) — nu a fost nevoie de nicio decizie noua de la owner.
<!-- SECTION:NOTES:END -->
