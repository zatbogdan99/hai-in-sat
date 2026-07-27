---
id: TASK-121
title: Adaugă BreadcrumbList schema și breadcrumbs vizibile
status: To Do
assignee: []
created_date: '2026-05-07 07:59'
updated_date: '2026-07-27'
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
2. Foloseste-o pe TOATE paginile publice non-homepage, cu EXACT aceste etichete (nu improviza altele — trebuie sa fie identice cu ce trimite fiecare pagina deja catre `setBreadcrumbs`, ca JSON-LD-ul si breadcrumb-ul vizibil sa spuna acelasi lucru):
   - `/properties`: Acasă › Proprietăți
   - `/property/:id/:slug`: Acasă › Proprietăți › {numele anuntului}
   - `/under-the-mountain`: Acasă › Oltenia de sub Munte
   - `/village-of-the-month`: Acasă › Satul lunii
   - `/see-the-area`: Acasă › Vezi zona
   - `/homes`: Acasă › Găsește-mi locul
   - `/about-us`: Acasă › Despre noi
   - `/contact-us`: Acasă › Contact

   Sursa de adevar e apelul existent `setBreadcrumbs` din fiecare componenta: **citeste-l si refoloseste exact acele valori**. Daca vreuna difera de lista de mai sus, valoarea din cod castiga si notezi diferenta.

   Homepage-ul (`/`) NU primeste breadcrumb. `/info-page` e tratata de TASK-122, nu aici. `/login` si `/add-property` nu sunt pagini publice.
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
- Sinergie cu TASK-120: link-urile din breadcrumb să fie `<a routerLink>` (crawlabile) — breadcrumb-ul vizibil devine automat sursă de link-uri interne

## Efort

4 ore.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Google Rich Results Test pe minimum 3 pagini distincte (o pagina statica, `/properties`, o pagina de anunt) — breadcrumbs valide. In SERP, afisarea ierarhiei in locul URL-ului plain poate dura saptamani si nu e garantata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exista `src/app/breadcrumbs/breadcrumbs.component.ts` (+ `.html`, `.scss`), componenta standalone, plasata direct in `src/app/<nume>/` conform conventiei repo-ului (NU in `src/app/components/`)
- [ ] #2 Componenta primeste un `@Input()` de tip `BreadcrumbItem[]` — interfata EXISTENTA, exportata din `seo.service.ts:7-10` (`{ name, path }`). NU se defineste o interfata noua
- [ ] #3 Link-urile din breadcrumb sunt `<a routerLink>` reale (crawlabile, sinergie cu TASK-120); ultimul element e text simplu, fara link — e pagina curenta
- [ ] #4 Componenta e folosita in template-urile celor 8 pagini publice non-homepage listate in descriere, in partea de sus a continutului
- [ ] #5 Etichetele afisate coincid cu valorile trimise de fiecare componenta catre `setBreadcrumbs` — implementatorul a verificat fiecare apel si a notat in `## Implementation Notes` orice diferenta fata de lista din descriere
- [ ] #6 `src/app/service/seo.service.ts` NU se modifica: `setBreadcrumbs` (liniile 74-85) functioneaza deja si e apelat de toate paginile publice rutate (confirmat prin grep 2026-07-06). Se verifica doar ca ultimul `ListItem` are `item` = canonical-ul paginii curente; daca nu, ACEA parte se corecteaza
- [ ] #7 Homepage-ul NU primeste breadcrumb vizibil; `/info-page` nu e atinsa (e scope-ul TASK-122)
- [ ] #8 Implementatorul a rulat protocolul SSR local si a lipit in `## Implementation Notes`, pentru cele 8 rute: `curl -s http://localhost:4000/<ruta> | grep -c "BreadcrumbList"` ≥ 1 (JSON-LD) SI prezenta markup-ului vizibil al componentei in acelasi HTML brut
- [ ] #9 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial. JSON-LD BreadcrumbList implementat (seo.service.ts:74-85 setBreadcrumbs) si apelat (ex. property-details.component.ts:141-145), randat SSR. RAMANE AC#1: breadcrumb VIZIBIL - niciun template nu are markup vizibil, doar JSON-LD; de creat componenta app-breadcrumbs. AC#3 = validare Google post-deploy. Nota: nu am confirmat ca TOATE paginile non-homepage cheama setBreadcrumbs (AC#2).

Cross-ref: noul TASK-50 rezolva breadcrumb-ul JSON-LD lipsa specific pe /see-the-area. TASK-121 ramane pentru breadcrumb-urile VIZIBILE sitewide (componenta app-breadcrumbs) - partea inca neimplementata (AC#1).
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Lista de pagini se termina cu „etc." — un agent nu poate implementa „etc.". Inlocuita cu cele 8 rute publice non-homepage, cu eticheta exacta pentru fiecare, plus regula ca sursa de adevar ramane apelul `setBreadcrumbs` deja existent in cod.
2. „Stil PrimeNG sau custom — match design Lara" ramane o alegere de implementare acceptabila (ambele variante trec), dar interfata de date e fixata: se refoloseste `BreadcrumbItem` din `seo.service.ts`, nu se inventeaza alta.
3. AC-ul vechi #3 (Google Rich Results Test pe 3 pagini) → mutat in `## Verificare post-deploy (owner)`.

Stare reala (confirmata prin grep 2026-07-06): JSON-LD-ul `BreadcrumbList` e DEJA implementat si apelat de toate paginile publice rutate. Partea neimplementata e DOAR breadcrumb-ul VIZIBIL — de aceea AC-urile se concentreaza pe componenta noua, nu pe schema.
<!-- SECTION:NOTES:END -->
