---
id: TASK-40
title: 'REVIEW-2: Endpoint debug expus în producție'
status: To Do
assignee: []
created_date: '2026-05-07 08:45'
updated_date: '2026-07-06'
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

### Opțiunea A — Eliminare completă (recomandată)

1. Șterge din backend Java endpoint-ul `/debug/all-photos-metadata` (sau ascunde în spatele unui flag `app.debug.enabled` care e `false` în profilul `prod`).
2. Șterge din frontend metoda `PhotoAdminService.getAllPhotosMetadata()` (`photo-admin.service.ts:47-51`) și apelurile ei.
3. Verifică cu git grep `debug/all-photos-metadata` și `getAllPhotosMetadata` ca să nu rămână referințe.

### Opțiunea B — Auth gate (dacă chiar e nevoie pentru admin debugging)

1. În backend, mută endpoint-ul sub un controller dedicat `/admin/debug/...` și protejează cu role admin (depinde de REVIEW-1).
2. În frontend, mută apelul în AddPropertyComponent doar dacă utilizatorul e logat ca admin.
3. Logează fiecare apel server-side cu `userId` din token pentru audit trail.

## Verificare

- `curl https://hai-in-sat-api.lm.r.appspot.com/debug/all-photos-metadata` → HTTP 404 sau 401 după fix.
- Caută în backend Java: `git grep -i "debug" --include="*.java"` — confirmă că nu mai există alte endpoint-uri `/debug/...` similar expuse.

## Surse afectate

- `hai-in-sat/hai-in-sat/src/app/service/photo-admin.service.ts:47-51` — metoda frontend
- (probabil) `java.hai-in-sat/hai-in-sat/src/main/java/.../<Controller>.java` — endpoint backend; verifică

## Efort

1-2 ore (Opțiunea A — recomandat).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `curl https://hai-in-sat-api.lm.r.appspot.com/debug/all-photos-metadata` returnează 404 SAU 401 (în funcție de opțiunea aleasă)
- [ ] #2 Frontend nu mai conține metoda `getAllPhotosMetadata` și niciun caller
- [ ] #3 Audit complet în backend Java: nu există alte endpoint-uri sub `/debug/*` accesibile public
- [x] #4 Dacă opțiunea B: doar utilizatori cu role admin văd date prin endpoint
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Expunerea publica NU mai exista - dupa task-23, SecurityConfig.java:54 protejeaza /debug/** cu hasRole(ADMIN), deci fara token admin -> 401 (efectiv Optiunea B e deja in vigoare; riscul critic de enumerare publica e rezolvat). Ramane doar curatenie optionala (Optiunea A): endpoint-ul exista la HaiInSatController.java:124, apelat din PhotoAdminService.getAllPhotosMetadata() (photo-admin.service.ts:47) folosit in add-property.component.ts:900. Prioritate redusa high->low.
Verificare 2026-07-06: neschimbat. ATENTIE branch: sursele backend traiesc pe MASTER (main e o linie goala — vezi project.md). Endpoint: HaiInSatController.java:124 (@GetMapping /debug/all-photos-metadata), protejat de SecurityConfig.java:54 (hasRole ADMIN pe /debug/**). Frontend: photo-admin.service.ts:47-51, apelat din add-property.component.ts:900. Prioritatea low ramane corecta — doar curatenie (Optiunea A).
<!-- SECTION:NOTES:END -->
