---
id: TASK-110
title: 'REVIEW-11: Type cast unsafe pe prop.type în PropertyDetailsComponent'
status: Done
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-31'
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

### Phase 2 — DEJA REZOLVATA, nu o reface

Verificat 2026-07-06: `PropertyDTO.type` e **deja** tipat ca enum `PropertyType` (`src/app/dto/property.dto.ts:7`), iar enum-ul are exact valorile `'house'` / `'land'`. Nu schimba DTO-ul si nu adauga transformer la deserializare. Problema reala e ca tipul declarat MINTE — backend-ul poate trimite orice, iar cast-urile ascund asta. De aceea singurul lucru de facut e Phase 1 (type guard la granita).

### Phase 3 — Logging valori invalide

Cand `prop.type` nu potriveste, logheaza un avertisment cu id-ul proprietatii: `` logger.warn(`Tip de proprietate necunoscut: ${prop.type} (proprietatea ${prop.id})`) ``.

Daca TASK-109 (LoggerService) e deja livrat, foloseste `LoggerService.warn`. Daca nu, foloseste `console.warn` si lasa o nota — TASK-109 il va prelua odata cu restul.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Dupa deploy, deschide cateva anunturi de ambele tipuri si confirma ca eticheta („Teren" / „Casă") si slug-ul din URL raman corecte. Fallback-ul se manifesta doar daca backend-ul incepe sa trimita tipuri noi — pana atunci e invizibil, si asta e in regula.

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
- [ ] #1 `src/app/property-details/property-details.component.ts` nu mai contine niciun `as PropertyType` si niciun `as 'house' | 'land'` (azi la liniile ~107, ~119, ~141)
- [ ] #2 Comparatia stringly `prop.type === 'land'` (azi ~linia 110) e inlocuita cu o comparatie pe enum: `type === PropertyType.LAND`
- [ ] #3 `src/app/dto/property-type.enum.ts` exporta `isPropertyType(v: unknown): v is PropertyType` si `toPropertyType(v: unknown, fallback: PropertyType = PropertyType.LAND): PropertyType`
- [ ] #4 `property-details.component.ts` normalizeaza tipul O SINGURA data (`const type = toPropertyType(prop.type)`) si foloseste apoi `type` la toate cele trei locuri: `generateSlug`, eticheta afisata si `setRealEstateListing`
- [ ] #5 Cand valoarea nu e recunoscuta, se logheaza un avertisment care contine `prop.id`, iar componenta continua cu fallback-ul — nu arunca si nu randeaza gol
- [ ] #6 `src/app/dto/property.dto.ts` NU e modificat — `type` e deja tipat ca enum `PropertyType` (Phase 2 era deja rezolvata)
- [ ] #7 Exista spec pentru noile functii, cu exact aceste trei cazuri: `toPropertyType('land')` → `PropertyType.LAND`; `toPropertyType('farm', PropertyType.HOUSE)` → `PropertyType.HOUSE`; `toPropertyType(null)` → fallback-ul implicit `PropertyType.LAND`
- [ ] #8 `properties.component.ts` primeste acelasi tratament acolo unde deriva tipul din raspunsul API (`propertyType: PropertyTypeFilter`) — fara cast-uri nesigure
- [ ] #9 `npx ng test --watch=false --browsers=ChromeHeadless` trece, iar totalul de teste creste fata de 49 (baseline remasurat 2026-07-28)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. Cast-urile sunt acum la property-details.component.ts:104 (prop.type as PropertyType), :116 (generateSlug(prop.type as PropertyType)), :138 (as house|land); plus :107 prop.type==='land' (erau 82/91/105). NOTA: PropertyDTO.type e DEJA tipat ca enum PropertyType (property.dto.ts:7), iar enum-ul are valorile 'house'/'land' (property-type.enum.ts) - deci Phase 2 (aliniere DTO) e in mare parte facuta; ramane Phase 1 (type guard + fallback).
Verificare 2026-07-06: cast-urile sunt la property-details.component.ts:107 (prop.type as PropertyType), :119 (generateSlug(prop.type as PropertyType, ...)), :141 (as 'house' | 'land'); comparatia stringly la :110 (prop.type === 'land' ? 'Teren' : 'Casă'). PropertyDTO.type ramane tipat enum (dto/property.dto.ts:7). Ramane Phase 1 (type guard + fallback + warning — logat prin LoggerService din TASK-109 daca exista deja).
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Phase 2 cerea „verifica daca e string, schimba la enum" — dar DTO-ul e deja enum din 2026-06-08. Marcata explicit ca rezolvata, ca sa nu piarda agentul timp sau, mai rau, sa „repare" ceva corect.
2. AC-ul vechi #5 („slug consistent: casa-de-vanzare doar pentru house") repeta comportamentul deja garantat de `generateSlug` → inlocuit cu criteriul care conteaza: normalizarea tipului se face o singura data, la granita.
3. Sursa log-ului de avertisment era ambigua (`logger.warn` fara sa spuna de unde vine `logger`) → clarificat: LoggerService daca TASK-109 e livrat, altfel `console.warn`.

Rezultat pipeline 2026-07-31:
- Adăugate `isPropertyType` și `toPropertyType` în `property-type.enum.ts`, plus spec-ul cu exact cele trei cazuri cerute.
- `property-details.component.ts` normalizează tipul o singură dată, avertizează cu ID-ul proprietății pentru valori invalide și folosește fallback-ul la teren pentru slug, etichetă și SEO.
- `properties.component.ts` normalizează defensiv tipul primit din API pentru navigare și textul alternativ; `property.dto.ts`, utilitarele slug/SEO și backend-ul au rămas neatinse.
- Teste: `npx ng test --watch=false --browsers=ChromeHeadless` — **58/58 SUCCESS**; build frontend reușit.
- Review: 1 ciclu, verdict `{ "issues": [] }`; nit-uri amânate: niciunul.
- Verify: `allCriteriaMet: true`, toate cele 9 criterii îndeplinite.
<!-- SECTION:NOTES:END -->
