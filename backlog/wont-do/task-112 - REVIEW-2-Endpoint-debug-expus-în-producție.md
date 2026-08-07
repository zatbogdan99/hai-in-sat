---
id: TASK-112
title: 'REVIEW-2: Endpoint debug expus în producție'
status: To Do
assignee: []
created_date: '2026-05-07 08:45'
updated_date: '2026-07-27'
labels:
  - review
  - security
  - critical
  - backend
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce — CRITIC

`PhotoAdminService.getAllPhotosMetadata()` (`src/app/service/photo-admin.service.ts:47-51`) apelează:

```
GET https://hai-in-sat-api.lm.r.appspot.com/debug/all-photos-metadata
```

Endpoint-ul:
1. Are nume `/debug/...` — sugerează că e instrument de development.
2. Răspunsul include `{ photoId, propertyId, hasData }` pentru TOATE pozele din DB — deci permite enumerare completă.
3. Este apelat din frontend, deci este public-routable. Combinat cu REVIEW-1 (lipsă auth), oricine poate descărca lista completă de IDs din DB.

Risk: information disclosure, prep pentru atac scripted (după ce ai toate ID-urile, poți DELETE-ui sau update-ui pe rând cu REVIEW-1 problem).

## Cum se rezolvă

> **DECIS de owner (2026-07-27): Opțiunea A — eliminare completă.** Riscul critic e deja stins (endpoint-ul a fost protejat ADMIN de un task livrat anterior), deci ce ramane e curatenie: se sterge din ambele repo-uri. Optiunea B (auth gate + audit trail) e RESPINSA — nu o mai evalua.

### Opțiunea A — Eliminare completă (DECISA)

1. Șterge din backend Java endpoint-ul `/debug/all-photos-metadata` (sau ascunde în spatele unui flag `app.debug.enabled` care e `false` în profilul `prod`).
2. Șterge din frontend metoda `PhotoAdminService.getAllPhotosMetadata()` (`photo-admin.service.ts:47-51`) și apelurile ei.
3. Verifică cu git grep `debug/all-photos-metadata` și `getAllPhotosMetadata` ca să nu rămână referințe.

### Opțiunea B — RESPINSA

Nu se pastreaza endpoint-ul sub auth gate. Nu construi controller `/admin/debug/...` si nici audit trail.

## Atentie la repo-ul backend

Sursele backend traiesc pe branch-ul **`master`** (`main` e o linie goala). Locatiile exacte, verificate 2026-07-06:
- `HaiInSatController.java:124` — `@GetMapping("/debug/all-photos-metadata")`
- `SecurityConfig.java:54` — regula `hasRole(ADMIN)` pe `/debug/**`
- frontend: `photo-admin.service.ts:47-51` (`getAllPhotosMetadata`), apelat din `add-property.component.ts:900`

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Dupa deploy-ul backend-ului:

```bash
curl -si https://hai-in-sat-api.lm.r.appspot.com/debug/all-photos-metadata
```

Astepti **404** (endpoint inexistent). Verifica apoi ca fluxul de admin din `/add-property` functioneaza normal fara acest apel.

## Surse afectate

- `hai-in-sat/hai-in-sat/src/app/service/photo-admin.service.ts:47-51` — metoda frontend
- (probabil) `java.hai-in-sat/hai-in-sat/src/main/java/.../<Controller>.java` — endpoint backend; verifică

## Efort

1-2 ore (Opțiunea A — recomandat).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backend (branch `master`): metoda cu `@GetMapping` pe `/debug/all-photos-metadata` e stearsa din `HaiInSatController.java` (azi ~linia 124), impreuna cu metoda de service pe care o apela, daca ramane nefolosita
- [ ] #2 Backend: regula pentru `/debug/**` din `SecurityConfig.java` (azi linia 54) e stearsa — nu are ce proteja dupa stergerea endpoint-ului
- [ ] #3 Backend: `git grep -in "/debug" --include="*.java"` returneaza 0 rezultate
- [ ] #4 Frontend: metoda `getAllPhotosMetadata` e stearsa din `../../src/app/service/photo-admin.service.ts` (azi liniile 47-51)
- [ ] #5 Frontend: apelul din `add-property.component.ts` (azi linia ~900) e sters, impreuna cu elementul de UI care il declansa si cu campurile de componenta ramase nefolosite din cauza lui
- [ ] #6 `git grep "getAllPhotosMetadata\|all-photos-metadata"` returneaza 0 rezultate in AMBELE repo-uri
- [ ] #7 `.\mvnw.cmd -q test` (backend) si `npx ng test --watch=false --browsers=ChromeHeadless` (frontend) trec — ambele rulate automat de runner, fiindca acest task atinge ambele repo-uri
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Expunerea publica NU mai exista - dupa un task livrat anterior (numerotare VECHE), SecurityConfig.java:54 protejeaza /debug/** cu hasRole(ADMIN), deci fara token admin -> 401 (efectiv Optiunea B e deja in vigoare; riscul critic de enumerare publica e rezolvat). Ramane doar curatenie optionala (Optiunea A): endpoint-ul exista la HaiInSatController.java:124, apelat din PhotoAdminService.getAllPhotosMetadata() (photo-admin.service.ts:47) folosit in add-property.component.ts:900. Prioritate redusa high->low.
Verificare 2026-07-06: neschimbat. ATENTIE branch: sursele backend traiesc pe MASTER (main e o linie goala — vezi project.md). Endpoint: HaiInSatController.java:124 (@GetMapping /debug/all-photos-metadata), protejat de SecurityConfig.java:54 (hasRole ADMIN pe /debug/**). Frontend: photo-admin.service.ts:47-51, apelat din add-property.component.ts:900. Prioritatea low ramane corecta — doar curatenie (Optiunea A).
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZIE owner: Optiunea A (eliminare completa din ambele repo-uri); B respinsa si marcata ca atare.

AC-ul vechi #1 cerea `curl` pe API-ul de productie → mutat in `## Verificare post-deploy (owner)`. AC-ul vechi #4 („daca optiunea B: doar admin vede date") a fost sters — optiunea B nu mai exista.

Atentie: acesta e unul dintre putinele task-uri MULTI-REPO ramase in `tasks/`. Pipeline-ul creeaza branch `ticket/...` in ambele repo-uri si ruleaza ambele suite de teste.
<!-- SECTION:NOTES:END -->
