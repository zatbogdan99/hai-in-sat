---
id: TASK-27
title: Adaugă potentialAction SearchAction la WebSite schema
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-06-17 08:47'
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

1. Verifică/implementează că `/properties` poate filtra după query param (ex: `?q=horezu`, sau `?location=horezu&type=teren`). Backend Java are deja logica de filtrare? Dacă nu, e o muncă separată mai mare. Începe cu un filter simplu pe nume/locație.
2. În `src/index.html`, blocul `WebSite` JSON-LD, adaugă:

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

3. Pe componenta `/properties`, citește `activatedRoute.queryParams` și aplică filtru pe `propertiesStateService`.

## Verificare

Google Rich Results Test pe homepage — confirmă `SearchAction` valid. Sitelinks search box apare doar dacă brandul este destul de bine cunoscut (nu garantat imediat).

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/index.html` (JSON-LD `WebSite`)
- `src/app/components/properties/properties.component.ts` (read query params, filter)
- `src/app/service/properties-state-service/*` (eventual extinde `fetchPage` cu filter)

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
