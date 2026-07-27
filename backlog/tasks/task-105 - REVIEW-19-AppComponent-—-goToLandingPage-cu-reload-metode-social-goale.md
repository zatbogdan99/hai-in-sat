---
id: TASK-105
title: 'REVIEW-19: AppComponent — goToLandingPage cu reload + metode social goale'
status: To Do
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-07-27'
labels:
  - review
  - bug
  - ux
dependencies: [TASK-101]
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Inspecție `src/app/app.component.ts` evidențiază 3 probleme:

### 1. `goToLandingPage()` face full reload (linii 84-89)

```typescript
goToLandingPage() {
  this.router.navigateByUrl("/landing-page").then(() => {
    window.location.reload();
  });
}
```

- Defeats SPA: `window.location.reload()` re-fetch-uiește `index.html`, re-bootstrap-ează Angular, re-ia toate bundle-urile. Cost: ~1-2s în plus față de o simplă navigare.
- Plus: ruta `/landing-page` NU EXISTĂ în `app.routes.ts`. Navigarea va lovi wildcard `**` → `NewLandingPageComponent`. Deci ruta intenționată e probabil `/`. Logica e ruptă.
- Comentariul `// this.service.reload$.next(true);` sugerează că logica anterioară folosea un BehaviorSubject pentru reload — refactorizat parțial, lăsat în această stare ciudată.

### 2. Metode social media goale (linii 183-193)

```typescript
goToTikTokPage() { }
goToFacebookPage() { }
goToInstagramPage() { }
```

Trei butoane în footer (probabil) au handlers care nu fac nimic. Click-ul lor → nimic. UX broken: utilizatorii cred că sunt link-uri inactive.

`openLink(url)` la linia 195-197 face deschidere corectă în tab nou:

```typescript
openLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
```

Probabil ar trebui ca social buttons să apeleze `openLink('https://www.facebook.com/profile.php?id=61560478122728')` etc. (URL-uri din JSON-LD `sameAs`).

### 3. Subscribe-uri root-level fără cleanup

Linii 65-69, 166-180: subscribe la `router.events`, `service.openTerms$`, `service.openPrivacy$`. AppComponent este singleton (root), deci leak-ul nu se acumulează — nu e critical. Dar este un anti-pattern care va apărea și în alte locuri (acoperit de REVIEW-5).

## Cum se rezolvă

### Fix 1 — `goToLandingPage`

```typescript
goToLandingPage() {
  this.router.navigateByUrl('/');
}
```

Dacă scopul e să resetezi state-ul global la home, folosește serviciu (DataService) sau signal-uri pentru reset, nu reload.

### Fix 2 — Social buttons: se STERG, nu se populeaza (corectie 2026-07-06, confirmata de owner 2026-07-27)

Descrierea initiala presupunea ca butoanele sociale sunt legate la metodele goale. **Nu sunt.** `app.component.html` apeleaza DIRECT `openLink('https://...')` pe toate iconitele sociale, cu URL-urile corecte. Metodele `goToTikTokPage`, `goToFacebookPage`, `goToInstagramPage` (azi liniile ~190-200) sunt pur si simplu cod mort, nelegat de nimic.

Fix-ul corect e deci **stergerea** celor trei metode. NU le popula cu `socialUrls` si nu schimba template-ul.

### Fix 3 — Subscriptions

Acoperit de REVIEW-5. Aplică pattern-ul `takeUntilDestroyed` sau acceptă explicit că AppComponent este singleton root.

## Cleanup adițional în AppComponent

Inventar verificat prin grep la 2026-07-06. **Regula: verifica fiecare nume cu `git grep` inainte sa-l stergi.** Daca vreunul are totusi o referinta reala (template, spec, alt fisier), il PASTREZI si notezi in implementation notes — lista de mai jos e un punct de plecare, nu o comanda oarba.

Candidati confirmati ca nefolositi:
- cod comentat la liniile ~151-166;
- campul `items: MenuItem[]` si constructia lui din `ngOnInit` — meniul real e facut din `p-chip`-uri, `items` nu e randat nicaieri;
- `goToTerrainFormPage` — tinteste ruta inexistenta `/terrain-form-page` (dispare oricum odata cu TASK-101);
- `goToInfoPage`, `goToSeeTheArea`, `goToAddProperty` — neapelate din `app.component.html`;
- campul `visible`.

Campurile `contact`, `cookies`, `termenii`, `politica` si metoda `showCookies()` NU sunt in lista: dialogurile din footer chiar le folosesc. Verifica-le oricum cu grep inainte sa te atingi de ele.

**Fix 3 (subscriptions) e DEJA rezolvat** — `AppComponent` foloseste `takeUntilDestroyed` peste tot (liniile ~69, ~170, ~180). Nu-l reface.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Dupa deploy: clic pe logo (trebuie sa duca la homepage **fara** reincarcarea paginii), pe cele patru intrari de meniu, pe iconitele sociale din footer (se deschid profilurile in tab nou) si pe chips-urile legale (se deschid dialogurile Termeni / Politica).

## Fișiere afectate

- `src/app/app.component.ts`
- `src/app/app.component.html` (verifică binding-urile la metode goale)

## Efort

1-2 ore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `goToLandingPage()` face `this.router.navigateByUrl('/')` — fara `window.location.reload()`; string-ul `/landing-page` nu mai apare nicaieri in `src/app` (era o ruta inexistenta)
- [ ] #2 Metodele goale `goToTikTokPage`, `goToFacebookPage`, `goToInstagramPage` sunt STERSE din `app.component.ts` (nu populate) — `app.component.html` apeleaza deja direct `openLink(...)` cu URL-urile corecte
- [ ] #3 `app.component.html` NU e modificat in privinta iconitelor sociale — functioneaza deja corect
- [ ] #4 Codul comentat de la liniile ~151-166 e sters
- [ ] #5 Codul mort confirmat e sters: campul `items: MenuItem[]` + constructia lui din `ngOnInit`, `goToTerrainFormPage`, `goToInfoPage`, `goToSeeTheArea`, `goToAddProperty`, campul `visible`
- [ ] #6 Pentru FIECARE nume sters, implementatorul a lipit in `## Implementation Notes` rezultatul `git grep` care arata 0 referinte ramase in `src/`. Orice nume care avea inca o referinta a fost pastrat, cu motivul notat
- [ ] #7 `contact`, `cookies`, `termenii`, `politica` si `showCookies()` sunt PASTRATE — dialogurile din footer le folosesc
- [ ] #8 `takeUntilDestroyed` ramane pe cele trei subscribe-uri existente (Fix 3 era deja rezolvat, nu se atinge)
- [ ] #9 `npx ng test --watch=false --browsers=ChromeHeadless` trece
- [ ] #10 Implementatorul a rulat `npm run build:browser` si a lipit rezultatul in `## Implementation Notes`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial. Fix 3 (subscriptions) e DEJA facut - AppComponent foloseste takeUntilDestroyed peste tot (app.component.ts:69,170,180). RAMAN: Fix 1 - goToLandingPage() (:87-92) inca face navigateByUrl('/landing-page') + window.location.reload(), iar ruta /landing-page nici nu exista. Fix 2 - goToTikTokPage/Facebook/Instagram (:190-200) inca goale; openLink() exista (:202). Plus cod comentat (:151-166) si campuri boolean neutilizate.
Verificare 2026-07-06: goToLandingPage (app.component.ts:87-92) neschimbat — navigateByUrl('/landing-page') + window.location.reload(), iar ruta /landing-page NU exista (cade pe wildcard). CORECTIE la Fix 2: metodele sociale goale (goToTikTokPage/goToFacebookPage/goToInstagramPage, :190-200) NU sunt legate nicaieri in template — app.component.html foloseste DIRECT openLink(...) cu URL-urile corecte pe toate iconitele sociale. Fix-ul corect = STERGEREA metodelor goale, nu popularea lor. COD MORT suplimentar in AppComponent (coordoneaza cu TASK-101): campul items (MenuItem[], construit in ngOnInit dar nerandat nicaieri — meniul real e din p-chips), goToTerrainFormPage (tinteste ruta inexistenta /terrain-form-page), goToInfoPage/goToSeeTheArea/goToAddProperty neapelate din template, campul visible neutilizat, cod comentat la :151-166. Fix 3 (takeUntilDestroyed) ramane rezolvat.
Revizuire 2026-07-27 (pregatire pentru pipeline). Contradictia principala rezolvata: **descrierea** cerea popularea metodelor sociale cu URL-uri, iar **nota de verificare din 2026-07-06** spunea ca metodele nu sunt legate de nimic si trebuie sterse. Un agent care citeste de sus in jos ar fi implementat varianta gresita. Descrierea a fost rescrisa ca sa spuna acelasi lucru cu nota: se sterg.

Alte ambiguitati eliminate: intrebarile retorice din „Cleanup aditional" („sunt utilizate?", „exista vreun popup de cookies?") au devenit un inventar cu verdict per camp, plus regula explicita de a verifica fiecare cu `git grep` inainte de stergere.

AC-ul vechi #5 (test manual pe toate butoanele) → mutat in `## Verificare post-deploy (owner)`.
<!-- SECTION:NOTES:END -->
