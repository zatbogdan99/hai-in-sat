---
id: TASK-27
title: Adaugă potentialAction SearchAction la WebSite schema
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-07-06'
labels:
  - seo
  - schema
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`WebSite` schema curentă din `src/index.html` este minimală — doar `@type`, `name`, `url`, `description`, `inLanguage`, `publisher`. Adăugarea unui `potentialAction` `SearchAction` face site-ul ELIGIBIL pentru „sitelinks search box" în Google SERP (un input de search dedicat sub rezultatul brand-ului).

Precondiție: trebuie să existe o rută reală de căutare care primește un query string (ex: `/properties?q=horezu`).

## Cum

1. **Implementează filtrul `?q=` pe `/properties` — plan concret (stare verificată 2026-07-06):** componenta citește deja `page`/`size`/`type` din queryParams (`properties.component.ts:159-176`), iar backend-ul filtrează după `type` — dar NU există căutare text (nici în backend). La ~14 anunțuri, NU are rost un endpoint nou: când `q` e prezent, adu TOATE proprietățile (endpoint public existent `GET /get-all-properties`, folosit deja de generate-sitemap) și filtrează client-side, case-insensitive și fără diacritice, pe `name` + `description` (refolosește `removeDiacritics` din `src/app/utils/slug.util.ts`); combină cu filtrul `type` existent și afișează fără paginare (sau paginare client-side). Fără `q`, comportamentul actual rămâne neschimbat.
2. În `src/index.html`, blocul `WebSite` JSON-LD (liniile 84–98), adaugă:

```json
"potentialAction": {
  "@type": "SearchAction",
  "target": {
    "@type": "EntryPoint",
    "urlTemplate": "https://hai-în-sat.ro/properties?q={search_term_string}"
  },
  "query-input": "required name=search_term_string"
}
```

3. (Opțional, UX) Un input mic de căutare pe `/properties` care setează `?q=` — utile și vizitatorilor, nu doar schemei.

## Verificare

Google Rich Results Test pe homepage — confirmă `SearchAction` valid. Sitelinks search box apare doar dacă brandul este destul de bine cunoscut (nu garantat imediat).

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/index.html` (JSON-LD `WebSite`, liniile 84–98)
- `src/app/properties/properties.component.ts` (calea REALĂ — nu există folder `components/`; citește `queryParams.q`, filtrare client-side)
- `src/app/service/property-form-service/property-form-service.service.ts` (metodă de fetch-all dacă lipsește în frontend)

## Efort

1 oră (doar JSON-LD); 2-4 ore dacă filtrul nu există încă.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 JSON-LD `WebSite` din HTML brut conține `potentialAction` cu `@type SearchAction` și `urlTemplate`
- [ ] #2 `https://hai-în-sat.ro/properties?q=horezu` efectiv afișează doar proprietăți care match (sau link-uri cu cuvântul în descriere)
- [ ] #3 Google Rich Results Test confirmă schema validă fără erori
- [ ] #4 Componenta `/properties` citește `queryParams.q` și aplică filter (poate fi simplu — substring în nume sau locație)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. index.html:84-98 WebSite schema nu are potentialAction/SearchAction. /properties suporta acum filtrare pe ?type=house|land (backend, implementat recent), dar NU pe ?q= text liber (necesar pt SearchAction). De adaugat schema + citirea queryParams.q in properties.component.ts.
<!-- SECTION:NOTES:END -->
