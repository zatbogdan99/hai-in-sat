---
id: TASK-106
title: 'REVIEW-9: PropertyFormServiceService — dublu sufix Service și nume neclar'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-27'
labels:
  - review
  - refactor
  - naming
dependencies: [TASK-101]
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`src/app/service/property-form-service/property-form-service.service.ts` definește clasa `PropertyFormServiceService` — sufix `Service` dublat. Convenția Angular este o singură semantică `Service` la coadă. Mai mult, numele „PropertyFormService" sugerează că serviciul gestionează un formular de proprietate, dar în realitate este un client REST pentru CRUD-ul de proprietăți (`saveProperty`, `getPropertiesPage`, `getPropertyById`, `getPhotos`, `updateDescription`, `deleteProperty`).

Numele similare existente:
- `PropertyFormEmailServiceService` — și aici dublu sufix.
- `HomeFormServiceService` (probabil)
- `TerrainFormServiceService` (probabil)

Pattern-ul „FormService" sugerează formular HTML, dar serviciile fac multe altele — confuzie când cauți „de ce metodele de upload de poze sunt în FormService?".

## Cum se rezolvă

### Phase 1 — Rename (maparea e DECISA de owner 2026-07-27; nu propune alternative)

| Curent | Nume final | Folder final | Rol real |
|---|---|---|---|
| `PropertyFormServiceService` | `PropertyApiService` | `src/app/service/property-api/property-api.service.ts` | client REST pentru proprietati (CRUD) |
| `PropertyFormEmailServiceService` | `PropertyContactService` | `src/app/service/property-contact/property-contact.service.ts` | trimite formularul de interes spre admin |
| `HomeFormServiceService` | `HomeFormService` | `src/app/service/home-form-service/home-form-service.service.ts` (folder si fisier NESCHIMBATE) | chiar e doar formularul de acasa — se scoate doar sufixul dublat |

`TerrainFormServiceService` NU e in tabel: e cod mort, sters de TASK-101 (vezi `dependencies`). Daca rulezi acest task inaintea lui TASK-101, lasa-l neatins si noteaza in implementation notes.

### Phase 2 — Refactor

1. Rename în VS Code (Ctrl+T → search class name → F2 rename) sau via `sed -i`.
2. Mută fișierele:
   - `src/app/service/property-form-service/` → `src/app/service/property-api/`
   - `src/app/service/property-form-email-service/` → `src/app/service/property-contact/`
   - etc.
3. Update toate import-urile (TypeScript va indica).
4. Verifică spec-urile (`PropertyFormServiceService` referenced în `properties.component.spec.ts:7,16` și `property-details.component.spec.ts:7,15`).

## Risc

Mare numar de touch points. PR dedicat, fara alte schimbari amestecate. Refactor atomic; teste dupa.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Dupa deploy, clic prin: listarea `/properties`, o pagina de anunt, login, salvarea unei proprietati din admin, trimiterea formularului de contact. Un rename curat nu schimba nimic functional — verificarea e doar plasa de siguranta.

## Fișiere afectate

- `src/app/service/property-form-service/*` (folder rename + file rename + class rename)
- Toate `src/app/**/*.ts` care importă `PropertyFormServiceService`
- Toate `src/app/**/*.spec.ts` care folosesc `jasmine.createSpyObj<PropertyFormServiceService>`
- Similar pentru ceilalți „FormServiceService"

## Efort

3-4 ore (rename + verificare tests + verificare build).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git grep "ServiceService" src/` returneaza 0 rezultate
- [ ] #2 Clasa `PropertyApiService` traieste in `src/app/service/property-api/property-api.service.ts` (folder si fisier redenumite, nu doar clasa)
- [ ] #3 Clasa `PropertyContactService` traieste in `src/app/service/property-contact/property-contact.service.ts`
- [ ] #4 Clasa `HomeFormService` traieste in `src/app/service/home-form-service/home-form-service.service.ts` — folderul si numele fisierului raman NESCHIMBATE, se schimba doar numele clasei
- [ ] #5 `TerrainFormServiceService` nu apare in diff (cod mort, sters de TASK-101) — sau, daca TASK-101 inca nu e livrat, e lasat neatins si mentionat in implementation notes
- [ ] #6 Toate importurile sunt actualizate: `git grep -l "property-form-service\|property-form-email-service" src/` returneaza 0 rezultate
- [ ] #7 Spec-urile care mock-uiau vechile clase folosesc numele noi: `properties.component.spec.ts` (azi liniile 7, 16) si `property-details.component.spec.ts` (azi liniile 7, 15)
- [ ] #8 `npx ng test --watch=false --browsers=ChromeHeadless` trece
- [ ] #9 Implementatorul a rulat `npm run build:browser` si a lipit rezultatul in `## Implementation Notes` — un import ratat dupa rename se vede la build, nu neaparat la teste
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. 4 clase cu dublu sufix confirmate: PropertyFormServiceService, PropertyFormEmailServiceService, HomeFormServiceService, TerrainFormServiceService. PropertyFormServiceService inca importat in property-details.component.ts:4 si in spec-uri. Niciun rename facut.
Verificare 2026-07-06: neschimbat — 4 clase cu dublu sufix confirmate. NOTA IMPORTANTA: TerrainFormServiceService e cod MORT (folosit doar de terrain-form-page, componenta nerutata — vezi TASK-101); daca TASK-101 se livreaza intai, scoate-l din tabelul de rename (raman 3 clase de redenumit).
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Tabelul de rename avea „sau" pe doua randuri si „verifica ce face" pe al treilea — agentul ar fi trebuit sa decida singur numele publice ale claselor. FIXATE de owner, cu folderul si numele de fisier finale.
2. AC-ul vechi #2 („numele reflecta rolul real") era subiectiv → inlocuit cu criterii care numesc clasa si calea exacta.
3. AC-ul vechi #5 (test manual pe 5 fluxuri) → mutat in `## Verificare post-deploy (owner)`; a ramas dovada de build, care prinde importurile rupte.
<!-- SECTION:NOTES:END -->
