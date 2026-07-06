---
id: TASK-64
title: 'REVIEW-20: Curăță codul mort din frontend (componente nerutate, servicii, config)'
status: To Do
assignee: []
created_date: '2026-07-06'
labels:
  - review
  - cleanup
  - dead-code
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Review-ul din 2026-07-06 (verificat cu grep pe referințe: rute, importuri, template-uri) a găsit cod care nu e atins de nicio rută sau referință. Codul mort derutează contributorii și pipeline-ul de agenți (ex. taskul de H1 a trebuit să EXCLUDĂ explicit aceste componente), umflă bundle-ul dacă e importat accidental și conține chiar text jenant care nu trebuie să ajungă vreodată live.

## Inventar CONFIRMAT (fiecare verificat prin grep, 2026-07-06)

**De șters fără decizie (zero referințe):**
1. `src/app/home-page/*` — componentă NErutată, referențiată doar de propriul spec. Conține H1-ul de test „Alte minciuni pe care o sa le scrie Guci" (home-page.component.html:5) — motiv în plus să dispară.
2. `src/app/service/productservice.ts` + `src/app/dto/product.ts` — rest de demo PrimeNG, importate de NIMENI.
3. `src/app/dto/area.dto.ts` — importat de nimeni.
4. `env_variables.BUCKET_NAME` din `app.yaml` (frontend) — nefolosit nicăieri în `src/` (detecția video e în backend; variabila e rest de config).
5. Metodele moarte din `AppComponent` — acoperite de TASK-52 (items, goToInfoPage, goToSeeTheArea, goToAddProperty, metodele sociale goale); aici doar NU le re-introduce.

**De șters DUPĂ decizia owner-ului (funcționalitate abandonată sau de reactivat?):**
6. `src/app/terrain-form-page/*` + `src/app/service/terrain-form-service/*` + `src/app/dto/terrain-form.dto.ts` — formularul de teren NU e rutat (ruta `/terrain-form-page` nu există în `app.routes.ts`), iar singurul apelant (`AppComponent.goToTerrainFormPage`) navighează spre ruta inexistentă → cade pe wildcard (homepage). Alternativa la ștergere: rutarea paginii și legarea ei în meniu — dar fluxul „Găsește-mi locul" (`/homes`, `FormPageComponent`) pare să fi absorbit cazul de utilizare. Backend-ul are endpoint `/terrain-form` funcțional — rămâne inofensiv chiar dacă frontend-ul dispare.

**Ce NU e mort (verificat — nu șterge):**
- `see-the-area-buy` / `see-the-area-rent` — embedded în `/see-the-area` (`<app-see-the-area-buy>` etc., see-the-area.component.html:52-54/110-112).
- `youtube-player` — folosit de see-the-area-buy și under-the-mountain.
- `dto/buy.enum` (folosit de see-the-area-buy), `dto/data.dto` (info-page/under-the-mountain/village), `dto/text-data.model` (info-page).
- `info-page` — rutată ȘI navigată din under-the-mountain (:144/:149); are task separat pentru SEO (TASK-65).

## Cum

1. Confirmă cu owner-ul punctul 6 (terrain: ștergere sau reactivare).
2. Șterge fișierele + spec-urile lor + orice import rămas; `git grep` după fiecare nume de clasă șters = 0 rezultate.
3. Scoate `BUCKET_NAME` din `app.yaml` frontend.
4. Build + test + navigare manuală prin toate rutele publice.

## Fișiere afectate

- `src/app/home-page/*`, `src/app/service/productservice.ts`, `src/app/dto/product.ts`, `src/app/dto/area.dto.ts` (ștergere)
- `src/app/terrain-form-page/*`, `src/app/service/terrain-form-service/*`, `src/app/dto/terrain-form.dto.ts` (după decizie)
- `app.yaml` (env_variables), `src/app/app.component.ts` (doar sinergie TASK-52)

## Efort

S (1-2 ore + decizia owner-ului pe terrain).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git grep -l "HomePageComponent\|productservice\|dto/product\|dto/area.dto" src/` returnează 0 rezultate; folderele/fișierele aferente nu mai există
- [ ] #2 Decizia pe terrain-form (ștergere vs reactivare) e luată de owner și documentată în implementation notes; codul reflectă decizia (șters complet SAU rutat + legat în meniu)
- [ ] #3 `app.yaml` (frontend) nu mai conține `BUCKET_NAME`
- [ ] #4 `npm run build:browser` trece; navigare manuală OK pe toate rutele publice (homepage, properties, property details, about, contact, under-the-mountain, village, see-the-area, homes, login)
- [ ] #5 Niciun spec orfan rămas pentru codul șters (`npm test` nu încearcă să compileze fișiere lipsă)
<!-- AC:END -->
