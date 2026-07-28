---
id: TASK-130
title: Reduce dimensiunea main.js (curent 2.23 MB / 684 KB gzip)
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-07-27'
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

## Verificare (locala, fara deploy)

Calea reala a bundle-urilor e `dist/hai-in-sat/browser/`:

```bash
npm run build:browser
ls -la dist/hai-in-sat/browser/*.js
```

Masoara ÎNAINTE de orice modificare (baseline) si DUPA. Cifra „2.23 MB" din titlu e din auditul pre-SSR si e depasita — baseline-ul real e cel pe care il masori tu la inceput si il lipesti in implementation notes.

## Ce NU intra in scope (decizii 2026-07-27)

- **Strangerea pragurilor din `angular.json`** (`budgets`). Raman cum sunt (4 MB warn / 6 MB error). Un prag strans gresit rupe build-uri viitoare; daca vrei sa prinzi regresii, e un task separat, dupa ce cifrele noi sunt stabile.
- **Zoneless / schimbarea strategiei de change detection.** Proiectul foloseste zone.js standard.
- **Tree-shaking PrimeNG.** E deja corect (importuri per-componenta, `primeng/<modul>`) — verificat 2026-07-06. Nu cauta probleme acolo.

## Fișiere afectate

- `src/app/app.routes.ts` (`loadComponent` pe rutele lazy)
- `src/app/guards/auth.guard.ts` (doar daca lazy-loading-ul cere ajustari de import Firebase)
- `angular.json` — **NU se modifica**

## Efort

1 zi.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Metricile de performanta cer productie si o masuratoare comparabila cu baseline-ul din audit:

Ruleaza PageSpeed Insights (mobil) pe `https://hai-în-sat.ro/` si compara **LCP**, **TBT** si **INP** cu valorile din `seo-audit-2026-06-12/crawl/playwright-metrics.json`. Verifica in DevTools → Network ca la incarcarea homepage-ului NU se descarca chunk-urile de `add-property` / `login`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/app.routes.ts`: cel putin 9 din cele ~11 rute non-wildcard folosesc `loadComponent: () => import('./<nume>/<nume>.component').then(m => m.XComponent)`. Obligatoriu lazy: `/add-property`, `/login`, `/property/:id/:slug` si `/property/:id`
- [ ] #2 Caile de import sunt cele REALE din repo — `./property-details/property-details.component`, `./home-form-page/form-page.component` etc. NU exista folder `src/app/components/`; orice import spre `./components/...` e gresit
- [ ] #3 `NewLandingPageComponent` (homepage si wildcard) ramane importat EAGER — nu se lazy-loadeaza
- [ ] #4 `angular.json` NU e modificat (pragurile `budgets` raman cum sunt — decizie 2026-07-27)
- [ ] #5 Implementatorul a lipit in `## Implementation Notes` iesirea `ls -la dist/hai-in-sat/browser/*.js` de la un build ÎNAINTE de modificari (baseline real, nu cifra din titlu) si de la unul DUPA
- [ ] #6 Dupa optimizare, `main.<hash>.js` e sub **1 MB** necomprimat — dovada e listarea de fisiere din criteriul precedent
- [ ] #7 Build-ul produce chunk-uri lazy separate: numarul de fisiere `.js` din `dist/hai-in-sat/browser/` creste fata de baseline
- [ ] #8 Situatia Firebase e documentata explicit in `## Implementation Notes`: daca `authInterceptor` (inregistrat global in `app.config`) tine `@angular/fire` in bundle-ul initial, se scrie asta ca deviere acceptata; daca a fost mutat in chunk-uri lazy, se scrie cum. NU se lasa nedocumentat
- [ ] #9 `npx ng test --watch=false --browsers=ChromeHeadless` trece (baseline 49/49 pe master, remasurat 2026-07-28)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. app.routes.ts importa toate componentele eager (niciun loadComponent / lazy chunk). Cifra '2.23MB' e din auditul vechi pre-SSR; build-ul curent difera - de re-masurat dupa un build. Niciun pas din plan (lazy routes, tree-shake PrimeNG/Firebase) nu e aplicat.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Calea din „Verificare" era `dist/hai-in-sat/main.*.js`, dar output-ul real e `dist/hai-in-sat/browser/` — corectata.
2. „(eventual) angular.json budgets (strange pragul)" era o invitatie la o decizie proprie, cu risc de a rupe build-uri → scos explicit din scope.
3. AC-ul vechi #3 cerea confirmare prin webpack-bundle-analyzer (unealta interactiva, imposibil de citit de un agent) → inlocuit cu cerinta de a DOCUMENTA situatia Firebase, oricare ar fi ea.
4. AC-ul vechi #5 (Lighthouse LCP/TBT/INP vs baseline) cere productie → mutat in `## Verificare post-deploy (owner)`.
5. AC-ul vechi #4 („site-ul ramane functional, navigare prin toate rutele") era test manual → acoperit de suita de teste + build; restul e in post-deploy.
<!-- SECTION:NOTES:END -->
