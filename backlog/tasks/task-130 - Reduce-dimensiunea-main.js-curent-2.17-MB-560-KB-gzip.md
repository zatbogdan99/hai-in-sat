---
id: TASK-130
title: 'Reduce dimensiunea main.js (curent 2.17 MB / 560 KB gzip)'
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-11-01'
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

`main.<hash>.js` are **2.172.460 bytes necomprimat / 560.408 bytes gzip** (măsurat 2026-11-01 pe build-ul de producție de pe `master`, după TASK-143; cifra veche, 2.23 MB / 684 KB, era din auditul pre-SSR). `styles.<hash>.css` are 370 KB. Pragul din `angular.json` (4 MB warn / 6 MB error) nu e atins, dar bundle-ul e prea mare pentru un site cu câteva pagini publice + ~14 anunțuri. Re-măsoară oricum la început: baseline-ul din notes e cel care contează.

Cauze VERIFICATE în cod (re-verificat 2026-11-01):
- **Toate rutele sunt eager** — `src/app/app.routes.ts` importă direct toate cele 10 componente de pagină; zero `loadComponent`/lazy chunks. Asta e cauza principală adresabilă.
- **Dependențe grele bundlate în main**: `firebase`/`@angular/fire` (auth), `gsap`, `swiper` (bundle-ul complet, `swiper/element/bundle`), 4 pachete `@fortawesome`, PrimeNG + primeflex + primeicons.
- **Dependențe moarte:**
  - `@videogular/ngx-videogular`: niciun template nu mai folosește `<vg-...>`, dar `VillageOfTheMonthComponent` importă `VgCoreModule`, `VgControlsModule`, `VgBufferingModule`, `VgOverlayPlayModule` și `VgApiService`, iar `InfoPageComponent` importă `VgApiService`, cu câmpul `api` și metodele `onPlayerReady` / `autoplay`, nefolosite nicăieri. CSS-ul lui e inclus global (`angular.json:37`, `videogular.css`).
  - `split-type`: importat doar în `info-page.component.ts:6`, fără nicio folosire.
- PrimeNG e importat CORECT per-componentă (`primeng/<modul>` — verificat, ex. app.component.ts) — deci NU căuta probleme la barrel imports; câștigul vine din lazy routes care izolează modulele PrimeNG folosite doar de admin (add-property e cel mai greu).

Impact: LCP/TBT/INP pe mobile, mai ales pe rețele 3G/4G slabe (zonele rurale, vizat-ul tău).

## Cum

1. Build cu stats: `ng build --configuration production --stats-json`
2. Analizează cu webpack-bundle-analyzer: `npx webpack-bundle-analyzer dist/hai-in-sat/stats.json`
3. Acțiuni concrete (în ordine):

   - **Lazy-load route-level**: în `src/app/app.routes.ts`, schimbă fiecare component direct importat în `loadComponent` dynamic:
     ```ts
     {
       path: 'proprietati/:id/:slug',
       loadComponent: () => import('./property-details/property-details.component')
         .then(m => m.PropertyDetailsComponent)
     }
     ```
     Aplică pentru toate cele 9 rute cu componentă din `app.routes.ts`, în afară de `''` și `**` (căile REALE sunt `./<folder>/<nume>.component`, NU `./components/...`): `/proprietati`, `/proprietati/:id/:slug` + `/proprietati/:id`, `/oltenia-de-sub-munte`, `/satul-lunii`, `/sate/:slug` (InfoPageComponent), `/gaseste-mi-locul` (FormPageComponent, `./home-form-page/form-page.component`), `/login`, `/add-property`. `NewLandingPageComponent` (`''`) și `NotFoundComponent` (`**`, care setează statusul 404 pe SSR) rămân eager. Rutele `redirectTo` (căile vechi, în engleză, din TASK-143) nu se ating.

   - **Scoate dependențele moarte:** șterge importurile videogular din `village-of-the-month.component.ts` și `info-page.component.ts` (cu câmpul `api` și metodele `onPlayerReady` / `autoplay` din `InfoPageComponent`), linia `videogular.css` din `angular.json` și importul `split-type`. Apoi scoate ambele pachete din `package.json`, cu `package-lock.json` și `yarn.lock` sincron (vezi CLAUDE.md).

   - **Firebase**: cel mai mare câștig e că `@angular/fire`/auth ajunge doar în chunk-urile lazy de login/add-property, nu în main — verifică în analyzer după lazy-loading. Atenție: `authInterceptor` (înregistrat global în app.config) injectează `Auth` — poate ține Firebase în main; dacă da, fă inject-ul lazy (`Injector.get` la nevoie) sau acceptă costul și documentează.

   - **Nu pierde timp pe**: PrimeNG barrel imports (deja per-componentă) și zoneless (proiectul folosește zone.js standard; nu e scope-ul acestui task).

## Verificare (locala, fara deploy)

Calea reala a bundle-urilor e `dist/hai-in-sat/browser/`:

```bash
npm run build:browser
ls -la dist/hai-in-sat/browser/*.js dist/hai-in-sat/browser/*.css
gzip -c dist/hai-in-sat/browser/main.*.js | wc -c
```

Masoara ÎNAINTE de orice modificare (baseline) si DUPA. Cifra din titlu e din 2026-11-01; baseline-ul real e cel pe care il masori tu la inceput si il lipesti in implementation notes.

## Ce NU intra in scope (decizii 2026-07-27)

- **Strangerea pragurilor din `angular.json`** (`budgets`). Singura modificare permisă în `angular.json` e scoaterea liniei `videogular.css`. Pragurile raman cum sunt (4 MB warn / 6 MB error). Un prag strans gresit rupe build-uri viitoare; daca vrei sa prinzi regresii, e un task separat, dupa ce cifrele noi sunt stabile.
- **Zoneless / schimbarea strategiei de change detection.** Proiectul foloseste zone.js standard.
- **Tree-shaking PrimeNG.** E deja corect (importuri per-componenta, `primeng/<modul>`) — verificat 2026-07-06. Nu cauta probleme acolo.

## Fișiere afectate

- `src/app/app.routes.ts` (`loadComponent` pe rutele lazy)
- `src/app/guards/auth.guard.ts` (doar daca lazy-loading-ul cere ajustari de import Firebase)
- `src/app/village-of-the-month/village-of-the-month.component.ts`, `src/app/info-page/info-page.component.ts` (importuri moarte)
- `package.json`, `package-lock.json`, `yarn.lock` (scoaterea `@videogular/ngx-videogular` și `split-type`)
- `angular.json` — DOAR linia `videogular.css`; pragurile nu se ating
- `src/app/app.routes.spec.ts` — testele de rută trebuie să treacă și cu `loadComponent`

## Efort

1 zi.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Metricile de performanta cer productie si o masuratoare comparabila cu baseline-ul din audit:

Ruleaza PageSpeed Insights (mobil) pe `https://hai-în-sat.ro/` si compara **LCP**, **TBT** si **INP** cu valorile din `seo-audit-2026-06-12/crawl/playwright-metrics.json`. Verifica in DevTools → Network ca la incarcarea homepage-ului NU se descarca chunk-urile de `add-property` / `login`. Deschide `/satul-lunii` și verifică videoclipul „Pastilă pentru suflet” (după scoaterea videogular).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/app.routes.ts`: toate cele 9 rute cu componentă, în afară de `''` și `**`, folosesc `loadComponent: () => import('./<folder>/<nume>.component').then(m => m.XComponent)`. Rutele `redirectTo` rămân neschimbate
- [ ] #2 Caile de import sunt cele REALE din repo — `./property-details/property-details.component`, `./home-form-page/form-page.component` etc. NU exista folder `src/app/components/`; orice import spre `./components/...` e gresit
- [ ] #3 `NewLandingPageComponent` (`''`) și `NotFoundComponent` (`**`) raman importate EAGER
- [ ] #4 În `angular.json` s-a schimbat doar linia `videogular.css` (scoasă); pragurile `budgets` raman cum sunt (decizie 2026-07-27)
- [ ] #5 Implementatorul a lipit in `## Implementation Notes` iesirea `ls -la dist/hai-in-sat/browser/*.js` de la un build ÎNAINTE de modificari (baseline real, nu cifra din titlu) si de la unul DUPA
- [ ] #6 Dupa optimizare, `main.<hash>.js` e sub **1 MB** necomprimat — dovada e listarea de fisiere din criteriul precedent
- [ ] #7 Build-ul produce chunk-uri lazy separate: numarul de fisiere `.js` din `dist/hai-in-sat/browser/` creste fata de baseline
- [ ] #8 Situatia Firebase e documentata explicit in `## Implementation Notes`: daca `authInterceptor` (inregistrat global in `app.config`) tine `@angular/fire` in bundle-ul initial, se scrie asta ca deviere acceptata; daca a fost mutat in chunk-uri lazy, se scrie cum. NU se lasa nedocumentat
- [ ] #9 `@videogular/ngx-videogular` și `split-type` nu mai apar în `package.json`, `package-lock.json`, `yarn.lock` sau în `src/` (`git grep -n "videogular\|split-type"` returnează doar eventuale mențiuni în `backlog/`). `yarn install --frozen-lockfile --production=true` trece curat
- [ ] #10 `npm run test:ci` (baseline 139 de teste pe master, 2026-11-01), `npm run test:ssr` și `npm run test:ssr:http` trec. Ultimul acoperă redirecturile și link-urile interne pe toate rutele
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
Actualizare 2026-11-01 (analiza backlog-ului față de cod): încă neimplementat (zero `loadComponent`). Am pus cifrele noi în titlu și în descriere (2.17 MB / 560 KB gzip, măsurat pe build-ul curent) și am rescris lista de rute cu căile în română (TASK-143). Am adăugat scoaterea dependențelor moarte `@videogular/ngx-videogular` (fără niciun `<vg-...>` în template-uri, dar cu CSS global și module importate) și `split-type` (import nefolosit). Excepția din `angular.json` e doar pentru linia `videogular.css`.
<!-- SECTION:NOTES:END -->
