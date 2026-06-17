---
id: TASK-15
title: Reduce dimensiunea main.js (curent 2.23 MB / 684 KB gzip)
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-06-17 08:47'
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

`main.<hash>.js` este 2.23 MB necomprimat / 684 KB gzip. Pragul Angular budget-ul curent (`angular.json`) = 4 MB warn / 6 MB error, deci nu zgâlțâie build-ul, dar e prea mare pentru un site cu 8 pagini statice + ~14 listări. Cauze probabile:
- Toate componentele PrimeNG importate eager (nu doar cele folosite)
- Firebase Auth bundlat complet în main
- Componente de pagină (`property-details`, `add-property`, `login`) NU sunt în route-level lazy chunks

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
     Aplică pentru: `/properties` (listing), `/property/...`, `/add-property`, `/login`, `/under-the-mountain`, `/village-of-the-month`, `/see-the-area`, `/about-us`, `/contact-us`. Wildcard `NewLandingPageComponent` rămâne eager.

   - **PrimeNG per-component imports**: confirmă că toate import-urile sunt din `primeng/<modul>` nu din `primeng` index.

   - **Firebase tree-shaking**: în `AuthGuard` și auth services, importă doar funcțiile necesare (`getAuth`, `onAuthStateChanged`) nu obiectul complet.

   - **Verifică zone.js**: dacă deja folosești experimental zoneless change detection (Angular 19), elimină zone.js (~70KB).

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
- [ ] #2 Cel puțin 6 din cele 9 rute sunt lazy-loaded (chunks separate per rută)
- [ ] #3 Webpack bundle analyzer arată că PrimeNG e importat per-componentă, nu la barrel
- [ ] #4 Site-ul rămâne funcțional: navigare prin toate rutele, login, formulare — fără regresii
- [ ] #5 Lighthouse mobile pe `/` arată LCP, TBT și INP îmbunătățite vs baseline (raportează valori before/after în implementation notes)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. app.routes.ts importa toate componentele eager (niciun loadComponent / lazy chunk). Cifra '2.23MB' e din auditul vechi pre-SSR; build-ul curent difera - de re-masurat dupa un build. Niciun pas din plan (lazy routes, tree-shake PrimeNG/Firebase) nu e aplicat.
<!-- SECTION:NOTES:END -->
