---
id: TASK-10
title: Adaugă schema RealEstateListing pe pagini de proprietate
status: To Do
assignee: []
created_date: '2026-05-07 07:58'
updated_date: '2026-06-17 15:04'
labels:
  - seo
  - schema
  - structured-data
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Schema curentă din `src/index.html`: `RealEstateAgent` + `WebSite` (la nivel de site). Lipsește schema per proprietate. `SeoService.setRealEstateListing()` există (per CLAUDE.md), dar JSON-LD-ul este injectat client-side — Google rendering pickup este inconsistent pentru JSON-LD adăugat după mount.

Avantaje schema `RealEstateListing`:
- Eligibilitate rich results (preț, locație, suprafață în SERP — chiar dacă deocamdată Google nu afișează snippet specific pentru real estate, structura este pregătită).
- LLM citation: AI poate cita proprietăți specifice cu preț și locație.
- Aggregator scraping (idealista.com, OLX, etc.) preia mai ușor datele.

## Cum

SSR-ul există deja, iar schema de BAZĂ se randează deja în HTML brut (per notes: `setRealEstateListing` e apelat în `property-details` și redat SSR). Munca rămasă = completarea câmpurilor care lipsesc (vezi mai jos) + URL real de imagine (TASK-48) + description fără telefon (TASK-52).

Structură per `/property/:id/:slug`:

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Teren de vânzare în Cerna - 1500 mp",
  "url": "https://hai-în-sat.ro/property/<uuid>/teren-de-vanzare-teren-cerna",
  "description": "<from property.description>",
  "image": ["<photo1>", "<photo2>", "..."],
  "datePosted": "<ISO 8601>",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Cerna",
    "addressRegion": "Vâlcea",
    "addressCountry": "RO",
    "postalCode": "<dacă există>"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "<num>",
    "longitude": "<num>"
  },
  "offers": {
    "@type": "Offer",
    "price": "<number>",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock"
  },
  "floorSize": {
    "@type": "QuantitativeValue",
    "value": "<m²>",
    "unitCode": "MTK"
  }
}
```

Pentru terenuri vs case, folosește `@type: RealEstateListing` (recomandat) sau `Product` cu `category="Real Estate"` ca fallback.

## Verificare

Google Rich Results Test (https://search.google.com/test/rich-results) pe URL de proprietate — schema validă.

## Fișiere afectate

- `src/app/service/seo.service.ts` — verifică `setRealEstateListing()`, extinde dacă lipsesc câmpuri
- `src/app/components/property-details/property-details.component.ts` (sau echivalent — apel în `ngOnInit`)
- Backend Java (`PropertyDTO`/endpoint): expune câmpurile lipsă pentru schema completă — `datePosted`, `geo` (lat/lng), `price`/currency, `floorSize`/area (azi DTO-ul nu le are; necesită extindere DTO + formular). Schema se randează deja SSR din componentă — nu e nevoie de injectare separată în `server.ts`.

## Efort

4 ore frontend (extindere `setRealEstateListing`) + extindere DTO/backend pentru câmpurile lipsă; image real depinde de TASK-48.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pe pagina `/property/<uuid>/<slug>`, există un `<script type="application/ld+json">` cu `@type RealEstateListing` în HTML brut
- [ ] #2 Schema include: name, url, description, image (array), datePosted, address (cu addressLocality), geo (cu lat/lng), offers (cu price și priceCurrency EUR), floorSize
- [ ] #3 Google Rich Results Test pe URL-ul de proprietate raportează schema validă, fără erori critice (warnings acceptabile)
- [ ] #4 Schema validator (validator.schema.org) confirmă tipul `RealEstateListing` și sub-tipuri `PostalAddress`/`GeoCoordinates`/`Offer`/`QuantitativeValue` corecte
- [ ] #5 image din schema RealEstateListing = URL public real al pozei (nu data:URI) - dupa TASK-48
- [ ] #6 description din schema nu contine numere de telefon (sincron cu TASK-52 NAP)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial. seo.service.ts:87-116 setRealEstateListing exista si e apelat in property-details.component.ts:133-139, randat SSR (schema apare in HTML brut). LIPSESC inca campurile din AC#2: datePosted, geo (lat/lng), offers.price + priceCurrency EUR, floorSize - PropertyDTO (property.dto.ts) nu are price/geo/area, deci e nevoie de extindere DTO + backend + formular. AC#3/#4 = validare Google post-deploy.

Cross-ref: AC-uri noi reconciliaza referintele din TASK-48 (image real URL) si TASK-52 (description fara telefon). Schema de baza e deja randata SSR; raman datePosted/geo/price/floorSize (AC#2) + image URL real.
<!-- SECTION:NOTES:END -->
