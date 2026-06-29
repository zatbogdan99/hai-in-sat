---
id: TASK-30
title: Adaugă BreadcrumbList schema și breadcrumbs vizibile
status: To Do
assignee: []
created_date: '2026-05-07 07:59'
updated_date: '2026-06-17 15:03'
labels:
  - seo
  - schema
  - ux
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

- Google poate folosi `BreadcrumbList` pentru a afișa breadcrumb-uri în SERP în loc de URL plain (ex: `hai-în-sat.ro › proprietăți › cerna`).
- UX win pentru deep links — utilizatori care intră direct pe o proprietate înțeleg ierarhia și pot naviga înapoi.
- `SeoService.setBreadcrumbs()` există și e deja apelat + redat în HTML brut SSR (per notes). JSON-LD-ul e gata; ce LIPSEȘTE e breadcrumb-ul VIZIBIL (componenta `app-breadcrumbs`, AC#1) + confirmarea că TOATE paginile non-homepage cheamă `setBreadcrumbs` (AC#2).

## Cum

1. Component vizual: `src/app/components/breadcrumbs/breadcrumbs.component.ts` cu input array `{label, url}`. Stil PrimeNG sau custom — match design Lara.
2. Folosește în:
   - `/properties`: Acasă > Proprietăți
   - `/property/:id/:slug`: Acasă > Proprietăți > <Tip> în <Localitate>
   - `/under-the-mountain`: Acasă > Sub munte
   - `/village-of-the-month`: Acasă > Satul lunii
   - `/about-us`: Acasă > Despre noi
   - etc.
3. `SeoService.setBreadcrumbs()` să injecteze JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Acasă","item":"https://hai-în-sat.ro/"},
    {"@type":"ListItem","position":2,"name":"Proprietăți","item":"https://hai-în-sat.ro/properties"},
    {"@type":"ListItem","position":3,"name":"Teren în Cerna","item":"<canonical curent>"}
  ]
}
```
4. Asigură că `item`-ul ultimei `ListItem` == canonical-ul paginii curente.

## Fișiere afectate

- `src/app/components/breadcrumbs/breadcrumbs.component.ts` (de creat dacă nu există)
- `src/app/service/seo.service.ts` (verifică `setBreadcrumbs`)
- `src/app/components/properties/properties.component.ts`
- `src/app/components/property-details/property-details.component.ts` (sau echivalent)
- Toate componentele pentru pagini statice

## Efort

4 ore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pe fiecare pagină din sitemap (homepage exclus), apare un breadcrumb vizibil în top-of-content
- [ ] #2 JSON-LD `BreadcrumbList` este prezent în HTML brut pe toate paginile non-homepage
- [ ] #3 Google Rich Results Test confirmă breadcrumbs valid pe minim 3 pagini distincte (statică, /properties, detalii proprietate)
- [ ] #4 Ultimul item din `BreadcrumbList` are URL-ul = canonical-ul paginii curente
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial. JSON-LD BreadcrumbList implementat (seo.service.ts:74-85 setBreadcrumbs) si apelat (ex. property-details.component.ts:141-145), randat SSR. RAMANE AC#1: breadcrumb VIZIBIL - niciun template nu are markup vizibil, doar JSON-LD; de creat componenta app-breadcrumbs. AC#3 = validare Google post-deploy. Nota: nu am confirmat ca TOATE paginile non-homepage cheama setBreadcrumbs (AC#2).

Cross-ref: noul TASK-50 rezolva breadcrumb-ul JSON-LD lipsa specific pe /see-the-area. TASK-30 ramane pentru breadcrumb-urile VIZIBILE sitewide (componenta app-breadcrumbs) - partea inca neimplementata (AC#1).
<!-- SECTION:NOTES:END -->
