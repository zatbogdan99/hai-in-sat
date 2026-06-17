---
id: TASK-31
title: 'REVIEW-9: PropertyFormServiceService — dublu sufix Service și nume neclar'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:24'
labels:
  - review
  - refactor
  - naming
dependencies: []
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

### Phase 1 — Rename

| Curent | Propus | Rol real |
|---|---|---|
| `PropertyFormServiceService` | `PropertyApiService` | client REST pentru proprietăți (CRUD) |
| `PropertyFormEmailServiceService` | `PropertyContactService` (sau `PropertyEnquiryService`) | trimite formular interes spre admin |
| `HomeFormServiceService` | `HomeFormService` (păstrează dacă e doar formular) sau `HomeApiService` | verifică ce face |
| `TerrainFormServiceService` | `TerrainFormService` sau `TerrainApiService` | idem |

### Phase 2 — Refactor

1. Rename în VS Code (Ctrl+T → search class name → F2 rename) sau via `sed -i`.
2. Mută fișierele:
   - `src/app/service/property-form-service/` → `src/app/service/property-api/`
   - `src/app/service/property-form-email-service/` → `src/app/service/property-contact/`
   - etc.
3. Update toate import-urile (TypeScript va indica).
4. Verifică spec-urile (`PropertyFormServiceService` referenced în `properties.component.spec.ts:7,16` și `property-details.component.spec.ts:7,15`).

## Risc

Mare număr de touch points. Fă într-un PR separat dedicat (nu mixa cu alte schimbări). Atomic refactor; testează după.

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
- [ ] #1 Niciun fișier nu mai conține string-ul `ServiceService` ca nume de clasă
- [ ] #2 Numele claselor reflectă rolul real (Api, Contact, Form, etc.)
- [ ] #3 `npm run build --configuration production` trece fără erori după rename
- [ ] #4 `npm test` (sau ce coverage există post-REVIEW-6) trece
- [ ] #5 Aplicația funcționează identic post-rename: properties listing, property details, login, save-property, contact form
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. 4 clase cu dublu sufix confirmate: PropertyFormServiceService, PropertyFormEmailServiceService, HomeFormServiceService, TerrainFormServiceService. PropertyFormServiceService inca importat in property-details.component.ts:4 si in spec-uri. Niciun rename facut.
<!-- SECTION:NOTES:END -->
