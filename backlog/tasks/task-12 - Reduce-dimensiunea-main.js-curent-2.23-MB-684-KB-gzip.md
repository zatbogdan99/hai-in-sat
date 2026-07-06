---
id: TASK-12
title: Reduce dimensiunea main.js (curent 2.23 MB / 684 KB gzip)
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-07-06'
labels:
  - seo
  - performance
  - bundle-size
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`main.<hash>.js` este 2.23 MB necomprimat / 684 KB gzip (cifră din auditul pre-SSR — RE-MĂSOARĂ întâi cu un build curent, ca baseline). Pragul Angular budget-ul curent (`angular.json`) = 4 MB warn / 6 MB error, deci nu zgâlțâie build-ul, dar e prea mare pentru un site cu 8 pagini statice + ~14 listări.

Cauze VERIFICATE în cod (2026-07-06):
- **Toate rutele sunt eager** — `src/app/app.routes.ts` importă direct toate cele ~10 componente de pagină; zero `loadComponent`/lazy chunks. Asta e cauza principală adresabilă.
- **Dependențe grele bundlate în main**: `firebase`/`@angular/fire` (auth), `gsap`, `swiper`, `@videogular/ngx-videogular` (+ CSS-ul lui în styles!), 4 pachete `@fortawesome`, PrimeNG + primeflex + primeicons.
- PrimeNG e importat CORECT per-componentă (`primeng/<modul>` — verificat, ex. app.component.ts) — deci NU căuta probleme la barrel imports; câștigul vine din lazy routes care izolează modulele PrimeNG folosite doar de admin (add-property e cel mai greu).

Impact: LCP/TBT/INP pe mobile, mai ales pe rețele 3G/4G slabe (zonele rurale, vizat-ul tău).

## Cum

1. Build cu stats: `ng build --configuration production --stats-json`
2. Analizează cu webpack-bundle-analyzer: `npx webpack-bundle-analyzer dist/hai-in-sat/stats.json`
3. Acțiuni concrete (în ordine):

   - **Lazy-load route-level**: în `src/app/app.routes.ts`, schimbă fiecare component direct importat în `loadComponent` dynamic:
     ```ts
     {
       path: "property/:id/:slug",
       loadComponent: () => import("./components/property-details/property-details.component")
         .then(m => m.PropertyDetailsComponent)
     }
     ```
     Aplică pentru toate rutele din `app.routes.ts` (căile REALE ale componentelor sunt `./<nume>/<nume>.component`, ex. `./property-details/property-details.component` — NU `./components/...`): `/properties`, `/property/:id/:slug` + `/property/:id`, `/add-property`, `/login`, `/under-the-mountain`, `/village-of-the-month`, `/see-the-area`, `/about-us`, `/contact-us`, `/homes` (FormPageComponent), `/info-page`. `NewLandingPageComponent` (homepage/wildcard) rămâne eager.

   - **Firebase**: cel mai mare câștig e că `@angular/fire`/auth ajunge doar în chunk-urile lazy de login/add-property, nu în main — verifică în analyzer după lazy-loading. Atenție: `authInterceptor` (înregistrat global în app.config) injectează `Auth` — poate ține Firebase în main; dacă da, fă inject-ul lazy (`Injector.get` la nevoie) sau acceptă costul și documentează.

   - **Nu pierde timp pe**: PrimeNG barrel imports (deja per-componentă) și zoneless (proiectul folosește zone.js standard; nu e scope-ul acestui task).

## Verificare

După optimizare: `ls -lh dist/hai-in-sat/main.*.js` — `main.js` sub 1 MB necomprimat (target 600 KB), bundle inițial total sub 1.5 MB.

## Fișiere afectate

- `src/app/app.routes.ts` (loadComponent peste tot)
- `src/main.ts` (import providers, verifică tree-shaking PrimeNG)
- `src/app/guards/auth.guard.ts` (Firebase imports)
- (eventual) `angular.json` budgets (strânge pragul după optimizare ca să prinzi regresii)

## Efort

1 zi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `main.<hash>.js` sub 1 MB necomprimat (sub ~350 KB gzip)
- [ ] #2 Cel puțin 9 din cele ~11 rute non-wildcard sunt lazy-loaded (chunks separate per rută); obligatoriu lazy: `add-property`, `login`, `property-details`
- [ ] #3 Webpack bundle analyzer confirmă că Firebase/@angular/fire NU mai e în bundle-ul inițial (doar în chunk-urile de login/add-property) — sau devierea e documentată în implementation notes
- [ ] #4 Site-ul rămâne funcțional: navigare prin toate rutele, login, formulare — fără regresii
- [ ] #5 Lighthouse mobile pe `/` arată LCP, TBT și INP îmbunătățite vs baseline (raportează valori before/after în implementation notes)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. app.routes.ts importa toate componentele eager (niciun loadComponent / lazy chunk). Cifra '2.23MB' e din auditul vechi pre-SSR; build-ul curent difera - de re-masurat dupa un build. Niciun pas din plan (lazy routes, tree-shake PrimeNG/Firebase) nu e aplicat.
<!-- SECTION:NOTES:END -->
