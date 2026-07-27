---
id: TASK-101
updated_date: '2026-07-27'
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
5. Metodele moarte din `AppComponent` — acoperite de TASK-105 (items, goToInfoPage, goToSeeTheArea, goToAddProperty, metodele sociale goale); aici doar NU le re-introduce.

**DECIS de owner (2026-07-27) — se sterge si acesta:**
6. `src/app/terrain-form-page/*` + `src/app/service/terrain-form-service/*` + `src/app/dto/terrain-form.dto.ts` + spec-urile lor — **STERGERE COMPLETA din frontend**. Formularul de teren nu e rutat (`/terrain-form-page` nu exista in `app.routes.ts`), iar singurul apelant (`AppComponent.goToTerrainFormPage`) navigheaza spre ruta inexistenta. Fluxul „Găsește-mi locul" (`/homes`, `FormPageComponent`) a absorbit cazul de utilizare.

   Varianta „reactivare" (rutare + legare in meniu) e RESPINSA — nu o mai evalua.

   **Backend-ul NU se atinge:** endpoint-ul `/terrain-form` ramane, inofensiv, chiar daca frontend-ul dispare. Acest task e frontend-only.

**Ce NU e mort (verificat — nu șterge):**
- `see-the-area-buy` / `see-the-area-rent` — embedded în `/see-the-area` (`<app-see-the-area-buy>` etc., see-the-area.component.html:52-54/110-112).
- `youtube-player` — folosit de see-the-area-buy și under-the-mountain.
- `dto/buy.enum` (folosit de see-the-area-buy), `dto/data.dto` (info-page/under-the-mountain/village), `dto/text-data.model` (info-page).
- `info-page` — rutată ȘI navigată din under-the-mountain (:144/:149); are task separat pentru SEO (TASK-122).

## Cum

1. Sterge fisierele de la punctele 1-4 si 6 + spec-urile lor + orice import ramas. Dupa fiecare nume de clasa sters, `git grep` trebuie sa dea 0 rezultate.
2. Scoate `BUCKET_NAME` din `app.yaml` (azi liniile 17-18). Blocul `env_variables:` ramane gol dupa stergere — **sterge si cheia `env_variables:`**, altfel YAML-ul are o cheie fara valoare.
3. Build + test.

**Regula generala:** verifica fiecare fisier cu `git grep` INAINTE sa-l stergi. Inventarul de mai jos a fost verificat la 2026-07-06, dar codul s-a putut schimba intre timp. Daca ceva are inca referinte, il pastrezi si notezi in implementation notes.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Dupa deploy, navigheaza prin toate rutele publice: `/`, `/properties`, o pagina de anunt, `/about-us`, `/contact-us`, `/under-the-mountain`, `/village-of-the-month`, `/see-the-area`, `/homes`, `/login`. Nimic nu trebuie sa se schimbe vizual — codul sters nu era accesibil nici inainte.

## Fișiere afectate

- `src/app/home-page/*`, `src/app/service/productservice.ts`, `src/app/dto/product.ts`, `src/app/dto/area.dto.ts` (ștergere)
- `src/app/terrain-form-page/*`, `src/app/service/terrain-form-service/*`, `src/app/dto/terrain-form.dto.ts` (după decizie)
- `app.yaml` (env_variables), `src/app/app.component.ts` (doar sinergie TASK-105)

## Efort

S (1-2 ore + decizia owner-ului pe terrain).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/home-page/` nu mai exista (componenta nerutata, cu H1-ul de test „Alte minciuni pe care o sa le scrie Guci"), impreuna cu spec-ul ei
- [ ] #2 `src/app/service/productservice.ts` si `src/app/dto/product.ts` (resturi de demo PrimeNG) nu mai exista
- [ ] #3 `src/app/dto/area.dto.ts` nu mai exista
- [ ] #4 `src/app/terrain-form-page/`, `src/app/service/terrain-form-service/` si `src/app/dto/terrain-form.dto.ts` nu mai exista — DECIZIE owner 2026-07-27: stergere completa, nu reactivare
- [ ] #5 `git grep -l "HomePageComponent\|productservice\|dto/product\|area.dto\|TerrainFormPageComponent\|TerrainFormServiceService\|terrain-form.dto" src/` returneaza 0 rezultate
- [ ] #6 `app.yaml` nu mai contine `BUCKET_NAME`; cheia `env_variables:` e stearsa si ea (ar ramane fara valoare), iar fisierul ramane YAML valid
- [ ] #7 Repo-ul backend NU e atins: endpoint-ul `/terrain-form` ramane in `HaiInSatController`
- [ ] #8 Componentele care NU sunt moarte raman neatinse: `see-the-area-buy`, `see-the-area-rent` (embedate in `/see-the-area`), `youtube-player`, `dto/buy.enum`, `dto/data.dto`, `dto/text-data.model`, `info-page` (rutata si navigata din `under-the-mountain`)
- [ ] #9 Niciun spec orfan: nu exista `*.spec.ts` care importa fisiere sterse
- [ ] #10 `npx ng test --watch=false --browsers=ChromeHeadless` trece; totalul de teste SCADE fata de 52 (baseline 2026-07-27), fiindca spec-urile componentelor sterse dispar — asta e asteptat
- [ ] #11 Implementatorul a rulat `npm run build:browser` si a lipit rezultatul in `## Implementation Notes`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZIE owner pe punctul 6: **stergere completa** a formularului de teren din frontend (componenta + serviciu + DTO + spec-uri). Reactivarea e respinsa. Asta era singurul blocaj real al task-ului — AC-ul vechi #2 cerea explicit „decizia e luata de owner", ceea ce ar fi oprit pipeline-ul.

Alte precizari adaugate: stergerea cheii `env_variables:` odata cu `BUCKET_NAME` (altfel ramane cheie fara valoare), regula de verificare cu `git grep` inainte de fiecare stergere, si asteptarea explicita ca numarul de teste sa SCADA (altfel un verificator ar putea semnala asta ca regresie).

Acest task simplifica TASK-107 (nu mai refactorizezi `terrain-form-service`), TASK-109 (doua fisiere mai putin de curatat de `console.*`), TASK-106 (raman 3 clase de redenumit, nu 4) si TASK-105 (`goToTerrainFormPage` dispare). De rulat inaintea lor.
<!-- SECTION:NOTES:END -->
