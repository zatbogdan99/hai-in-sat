---
id: TASK-48
title: 'REVIEW-11: Type cast unsafe pe prop.type în PropertyDetailsComponent'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:24'
labels:
  - review
  - types
  - bug
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

În `src/app/property-details/property-details.component.ts`:

- Linia 82: `const slug = generateSlug(prop.type as PropertyType, prop.name);`
- Linia 91: `const propertyTypeLabel = prop.type === 'land' ? 'Teren' : 'Casă';`
- Linia 105: `propertyType: prop.type as 'house' | 'land'`

`prop.type` este tipat în `PropertyDTO` (verifică `src/app/dto/property.dto.ts`). Cast-urile `as PropertyType`, `as 'house' | 'land'` ascund presupunerea că backend-ul returnează doar aceste valori. Dacă backend-ul:
- Returnează `null` sau `undefined`
- Returnează altă valoare (`'farm'`, `'commercial'`, `'apartment'`)
- Schimbă enum-ul în viitor

Codul va executa cu o valoare invalidă fără TypeScript error și va produce comportament greșit:
- `slug = generateSlug(undefined, name)` → în `generateSlug`, comparația `type === PropertyType.HOUSE` e false, default la `teren-de-vanzare-...` → URL incorect.
- `propertyTypeLabel = prop.type === 'land' ? 'Teren' : 'Casă'` → orice altceva diferit de `'land'` devine „Casă", chiar dacă e `null` sau `'farm'`.
- `setRealEstateListing` primește un type cast incorect, generează schema cu `category` greșit.

În plus, codul are dual semantics: `'land' | 'house'` (în component) vs `PropertyType.LAND | PropertyType.HOUSE` (în enum). Trebuie aliniate.

## Cum se rezolvă

### Phase 1 — Type guard real

1. Adaugă o funcție de type guard în `src/app/dto/property-type.enum.ts` (sau utility):

```typescript
export function isPropertyType(v: unknown): v is PropertyType {
  return v === PropertyType.HOUSE || v === PropertyType.LAND;
}

export function toPropertyType(v: unknown, fallback: PropertyType = PropertyType.LAND): PropertyType {
  return isPropertyType(v) ? v : fallback;
}
```

2. În `property-details.component.ts`:

```typescript
import { PropertyType, toPropertyType } from '../dto/property-type.enum';
// ...
const type = toPropertyType(prop.type);
const slug = generateSlug(type, prop.name);
const propertyTypeLabel = type === PropertyType.LAND ? 'Teren' : 'Casă';
this.seo.setRealEstateListing({
  // ...
  propertyType: type === PropertyType.HOUSE ? 'house' : 'land'
});
```

### Phase 2 — Aliniere DTO ↔ enum

Verifică `PropertyDTO.type` în `src/app/dto/property.dto.ts`:
- Dacă e `string`, schimbă la `PropertyType` (enum) sau `'house' | 'land'`.
- Dacă API-ul Java returnează un alt format, mapează la deserializare cu un transformer.

### Phase 3 — Logging valori invalide

Dacă `prop.type` nu match: `logger.warn(\`Unknown property type: ${prop.type} for property ${prop.id}\`)`. Util pentru debug când API se schimbă.

## Fișiere afectate

- `src/app/dto/property-type.enum.ts` (adaugă type guards)
- `src/app/dto/property.dto.ts` (verifică tipul `type`)
- `src/app/property-details/property-details.component.ts` (înlocuiește cast-urile)
- `src/app/utils/slug.util.ts` (verifică semnătura `generateSlug` și use-case-ul cu PropertyType)
- `src/app/properties/properties.component.ts` (similar — `propertyType: PropertyTypeFilter`)

## Efort

1-2 ore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 În `property-details.component.ts`, niciun `as PropertyType` sau `as 'house' | 'land'`
- [ ] #2 Există funcție `isPropertyType` și/sau `toPropertyType` cu fallback definit
- [ ] #3 Dacă `prop.type` este `null` / undefined / valoare neștiută: componenta nu se sparge, log-uiește warning, folosește fallback consistent
- [ ] #4 Test unit: `toPropertyType('land')` → `PropertyType.LAND`; `toPropertyType('farm', PropertyType.HOUSE)` → `PropertyType.HOUSE`; `toPropertyType(null)` → fallback
- [ ] #5 Slug generat este consistent: `casa-de-vanzare-*` doar pentru house, `teren-de-vanzare-*` doar pentru land
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. Cast-urile sunt acum la property-details.component.ts:104 (prop.type as PropertyType), :116 (generateSlug(prop.type as PropertyType)), :138 (as house|land); plus :107 prop.type==='land' (erau 82/91/105). NOTA: PropertyDTO.type e DEJA tipat ca enum PropertyType (property.dto.ts:7), iar enum-ul are valorile 'house'/'land' (property-type.enum.ts) - deci Phase 2 (aliniere DTO) e in mare parte facuta; ramane Phase 1 (type guard + fallback).
<!-- SECTION:NOTES:END -->
