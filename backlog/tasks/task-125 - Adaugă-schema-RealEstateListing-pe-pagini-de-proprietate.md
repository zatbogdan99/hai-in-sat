---
id: TASK-125
title: Adaugă schema RealEstateListing pe pagini de proprietate
status: To Do
assignee: []
created_date: '2026-05-07 07:58'
updated_date: '2026-07-27'
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

SSR-ul există deja, iar schema de BAZĂ se randează deja în HTML brut (re-verificat 2026-07-06: `seo.service.ts:87-116` `setRealEstateListing`, apelat din `property-details.component.ts:136-142`). Munca ramasa in ACEST task = un singur camp, `datePosted`. `image` cu URL real depinde de TASK-3, iar `description` fara telefon e livrata de TASK-118 — niciuna nu se face aici.

**SCOPE-UL ACESTUI TASK = DOAR FAZA A (decizie 2026-07-27).**

- **Faza A — se face acum, frontend-only:** `datePosted`. Backend-ul expune DEJA `createdAt` (`Instant`) in `PropertyDTO`; frontend-ul doar nu-l are tipat in `src/app/dto/property.dto.ts` → adauga campul si foloseste-l ca `datePosted` in schema. Restul campurilor din faza A exista deja in schema generata (`url`, `name`, `description`, `address` cu `addressRegion`/`addressCountry`).

- **Faza B — SCOASA DIN SCOPE.** `offers.price` + `priceCurrency`, `geo` (lat/lng), `floorSize`, `addressLocality` depind de campuri de model care sunt PROPRIETATEA lui **TASK-31**, iar TASK-31 a fost mutat in `backlog/manual/` (cere date reale de produs). Nu inventa aceste campuri aici si nu le adauga in backend — ar duplica un model pe care TASK-31 il defineste altfel.

  Cand TASK-31 va fi livrat, se deschide un task nou care doar MAPEAZA campurile lui in schema. Structura JSON de mai jos ramane in task ca referinta pentru atunci.

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

Pentru terenuri si case se foloseste `@type: RealEstateListing` — DECIS. Varianta `Product` cu `category="Real Estate"` NU se foloseste; schema de baza randata azi e deja `RealEstateListing` si ramane asa.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. Google Rich Results Test (https://search.google.com/test/rich-results) pe un URL de proprietate — schema `RealEstateListing` valida, fara erori critice (warning-urile pentru campurile absente din faza B sunt asteptate).
2. https://validator.schema.org/ pe acelasi URL.

## Fișiere afectate

- `src/app/dto/property.dto.ts` — campul `createdAt`
- `src/app/service/seo.service.ts` — `setRealEstateListing()` (liniile 87-116) accepta si emite `datePosted`
- `src/app/property-details/property-details.component.ts` — apelul exista la :136-142, i se paseaza `createdAt`
- Backend Java — **NU se atinge**. Campurile din faza B sunt proprietatea TASK-31, care e in `backlog/manual/`
- `src/server.ts` — **NU se atinge**. Schema se randeaza deja SSR din componenta, nu e nevoie de injectare separata

## Efort

S (2 ore, frontend-only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/dto/property.dto.ts` are campul `createdAt` tipat (backend-ul il serializeaza deja in `PropertyDTO`, doar frontend-ul nu-l cunoaste)
- [ ] #2 `src/app/service/seo.service.ts`, `setRealEstateListing()` (azi liniile 87-116), accepta si emite `datePosted` in JSON-LD, in format ISO 8601
- [ ] #3 `src/app/property-details/property-details.component.ts` (apelul de la ~liniile 136-142) transmite `createdAt` ca `datePosted`
- [ ] #4 Campurile care lipsesc din date se OMIT complet din JSON-LD — nu se emit chei cu valori goale, `null` sau `""`. Verificabil prin lectura: constructia obiectului adauga conditionat, nu neconditionat
- [ ] #5 `@type` ramane `RealEstateListing` (nu `Product`)
- [ ] #6 Campurile din faza B (`offers`, `geo`, `floorSize`, `addressLocality`) NU sunt adaugate — nici in frontend, nici in backend. Repo-ul Java nu e atins de acest task
- [ ] #7 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes` blocul JSON-LD extras dintr-o pagina de anunt: `curl -s http://localhost:4000/property/<id>/<slug>` → blocul contine `"@type": "RealEstateListing"` si o cheie `datePosted` cu data reala
- [ ] #8 JSON-ul emis parseaza fara eroare (implementatorul l-a trecut printr-un parser si a lipit rezultatul)
- [ ] #9 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial. seo.service.ts:87-116 setRealEstateListing exista si e apelat in property-details.component.ts:133-139, randat SSR (schema apare in HTML brut). LIPSESC inca campurile din AC#2: datePosted, geo (lat/lng), offers.price + priceCurrency EUR, floorSize - PropertyDTO (property.dto.ts) nu are price/geo/area, deci e nevoie de extindere DTO + backend + formular. AC#3/#4 = validare Google post-deploy.

Cross-ref: AC-uri noi reconciliaza referintele din TASK-3 (image real URL) si TASK-118 (description fara telefon). Schema de baza e deja randata SSR; raman datePosted/geo/price/floorSize (AC#2) + image URL real.
Revizuire 2026-07-27 (pregatire pentru pipeline). Scope REDUS la Faza A. Motivul: campurile din Faza B (`price`, `geo`, `floorSize`, `village`) sunt definite de TASK-31, care a fost mutat in `backlog/manual/` fiindca cere date reale de produs. Un agent care ar fi urmat AC-ul vechi #2 (formulat ca „Faza A ... ; Faza B, dupa campurile din TASK-31 ...") ar fi trebuit sa decida singur daca inventeaza campurile — exact riscul pe care il evitam.

Alte ambiguitati eliminate:
1. „`@type: RealEstateListing` (recomandat) sau `Product` ca fallback" → fixat pe `RealEstateListing`.
2. AC-urile #3 si #4 (Google Rich Results Test, validator.schema.org) cer unelte externe → mutate in `## Verificare post-deploy (owner)`; in AC a ramas verificarea automatizabila: JSON-ul parseaza si contine cheile asteptate in HTML-ul SSR.
3. AC-ul vechi #5 (`image` = URL public real) depindea de TASK-3, acum in manual → eliminat.
4. AC-ul vechi #6 (description fara telefoane) e acoperit de TASK-118, care detine helperul `stripPhones` → nu se dubleaza aici.

AC-ul vechi #1 era deja bifat (schema de baza se randeaza SSR din 2026-06-08) — inlocuit cu criterii pentru munca ramasa.
<!-- SECTION:NOTES:END -->
