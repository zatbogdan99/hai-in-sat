---
id: TASK-30
title: Adaugă BreadcrumbList schema și breadcrumbs vizibile
status: To Do
assignee: []
created_date: '2026-05-07 07:59'
updated_date: '2026-07-06'
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
- `SeoService.setBreadcrumbs()` există și e deja apelat + redat în HTML brut SSR. **CONFIRMAT prin grep (2026-07-06): TOATE paginile publice rutate cheamă `setBreadcrumbs`** — about-us, contact-us, homes (form-page), new-landing-page, properties, property-details, see-the-area, under-the-mountain, village-of-the-month → **AC#2 e practic îndeplinit deja**; verifică doar la final că randează în HTML brut. Singura excepție: `/info-page` (rută legacy fără SEO — tratată separat la review, nu aici). JSON-LD-ul e gata; ce LIPSEȘTE e DOAR breadcrumb-ul VIZIBIL (componenta `app-breadcrumbs`, AC#1).

## Cum

1. Component vizual: `src/app/breadcrumbs/breadcrumbs.component.ts` (convenția repo-ului — componentele stau direct în `src/app/<nume>/`) cu input array de tip `BreadcrumbItem` (interfața EXISTĂ deja exportată din `seo.service.ts:7-10` — `{name, path}`; refoloseste-o, nu inventa alta). Stil PrimeNG sau custom — match design Lara.
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

- `src/app/breadcrumbs/breadcrumbs.component.ts` (+ .html/.scss — de creat)
- `src/app/service/seo.service.ts` (`setBreadcrumbs` există la :74-85 — de verificat doar; refolosește `BreadcrumbItem`)
- Template-urile paginilor care afișează breadcrumb-ul vizibil: `src/app/properties/`, `src/app/property-details/`, `src/app/about-us/`, `src/app/contact-us/`, `src/app/under-the-mountain/`, `src/app/village-of-the-month/`, `src/app/see-the-area/`, `src/app/home-form-page/` (căile REALE — nu există folder `components/`)
- Sinergie cu TASK-23: link-urile din breadcrumb să fie `<a routerLink>` (crawlabile) — breadcrumb-ul vizibil devine automat sursă de link-uri interne

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
