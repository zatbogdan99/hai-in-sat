---
id: TASK-122
updated_date: '2026-07-27'
title: 'Repară SEO pe /info-page (rută live fără meta) sau consolideaz-o'
status: To Do
assignee: []
created_date: '2026-07-06'
labels:
  - seo
  - technical
  - content
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce — pagină „fantomă" descoperită la review-ul din 2026-07-06

`/info-page` (InfoPageComponent) este o rută REALĂ (`app.routes.ts:20`) și e navigată efectiv din `/under-the-mountain` (under-the-mountain.component.ts:144 și :149 — butoanele către detaliile de sate/obiective). Dar, spre deosebire de TOATE celelalte pagini publice, nu are NIMIC din igiena SEO:

- nu apelează `SeoService.updatePageMeta` → titlul/description/canonical rămân cele ale paginii anterioare sau ale index.html (canonical GREȘIT — riscă să canonicalizeze conținutul spre homepage);
- nu apelează `setBreadcrumbs` (singura pagină publică fără — vezi TASK-121);
- nu e în sitemap (`generate-sitemap.js` STATIC_PAGES);
- are H1-uri multiple în template (info-page.component.html — `{{ data[villageId].title }}` apare în mai multe variante + H1-uri secundare la :136/:150);
- conținutul depinde de starea internă `villageId` — la acces direct pe URL (crawler sau refresh), pagina poate afișa altceva decât a văzut utilizatorul care a navigat.

Conținutul (texte despre sate: Bărbătești, ceramica de Horezu etc.) e valoros — exact genul de conținut pe care TASK-32 (paginile de sat) vrea să-l construiască.

## Cum — VARIANTA A cu ruta parametrizata (DECIS de owner 2026-07-27)

> Varianta B (consolidare in paginile de sat din TASK-32) e RESPINSA pentru acum: TASK-32 a fost mutat in `backlog/manual/`, deci nu exista destinatie de consolidare. Nu o mai evalua.

1. **Parametrizeaza ruta.** In `app.routes.ts`, `/info-page` (azi linia 20) devine `/info-page/:village`. `InfoPageComponent` citeste `villageId` din `ActivatedRoute.paramMap`, nu din stare interna — asa incat accesul DIRECT pe URL (crawler sau refresh) afiseaza acelasi continut ca navigarea din aplicatie.

   Pastreaza si ruta veche `/info-page` (fara parametru) ca redirect spre `/under-the-mountain`, ca sa nu ramana 404 daca a fost indexata.

2. **Actualizeaza apelantii.** `under-the-mountain.component.ts` (liniile ~144 si ~149) navigheaza azi spre `/info-page` pasand starea separat → trebuie sa navigheze spre `/info-page/<village>`. Identificatorul din URL e slug-ul satului/obiectivului: litere mici, fara diacritice, cu cratime — refoloseste `generateSlug`/`removeDiacritics` din `src/app/utils/slug.util.ts`, nu scrie alt slugifier.

3. **Igiena SEO in `ngOnInit`:** `seo.updatePageMeta(...)` cu title `„{Nume} — Oltenia de sub Munte | Hai în Sat"`, description derivata din continutul satului, canonical `/info-page/<village>`; plus `seo.setBreadcrumbs([...])` cu `Acasă › Oltenia de sub Munte › {Nume}`.

4. **UN singur H1** in `info-page.component.html`: numele obiectivului/satului curent. Headingurile secundare de la liniile ~136 si ~150 devin `<h2>`.

5. **Sitemap:** adauga in `STATIC_PAGES` din `scripts/generate-sitemap.js` cate o intrare pentru fiecare `villageId` existent in datele componentei — acum sunt adresabile prin URL, deci sunt indexabile.

## Fișiere afectate

- `src/app/info-page/info-page.component.ts` (+ .html) — citirea parametrului din ruta, meta, breadcrumbs, un singur H1
- `src/app/app.routes.ts` — ruta `/info-page/:village` + redirect de pe `/info-page`
- `src/app/under-the-mountain/under-the-mountain.component.ts` — navigarea de la liniile ~144 si ~149
- `scripts/generate-sitemap.js` — intrarile `/info-page/<slug>` in `STATIC_PAGES`

## Efort

M (3-5 ore — parametrizarea rutei e partea cu munca).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. Deschide direct, intr-o fereastra noua, `https://hai-în-sat.ro/info-page/<slug>` pentru fiecare sat — continutul trebuie sa fie cel corect, fara sa fi navigat inainte prin `/under-the-mountain`.
2. `curl -sI https://hai-în-sat.ro/info-page` → redirect spre `/under-the-mountain`.
3. Resubmite `sitemap.xml` in Search Console.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/app.routes.ts` are ruta `/info-page/:village` spre `InfoPageComponent`, iar `/info-page` (fara parametru) redirectioneaza spre `/under-the-mountain`
- [ ] #2 `InfoPageComponent` citeste identificatorul satului din `ActivatedRoute` (`paramMap`), NU din stare interna setata de pagina precedenta — accesul direct pe URL produce acelasi continut ca navigarea din aplicatie
- [ ] #3 `under-the-mountain.component.ts` (azi liniile ~144 si ~149) navigheaza spre `/info-page/<slug>`; slug-ul e produs cu utilitarele existente din `src/app/utils/slug.util.ts` (`removeDiacritics`), nu cu un slugifier nou
- [ ] #4 `InfoPageComponent.ngOnInit` apeleaza `seo.updatePageMeta(...)` cu title, description si canonical `/info-page/<village>` proprii paginii curente
- [ ] #5 `InfoPageComponent.ngOnInit` apeleaza `seo.setBreadcrumbs(...)` cu lantul `Acasă › Oltenia de sub Munte › {Nume}`
- [ ] #6 `info-page.component.html` are EXACT un `<h1>` (numele obiectivului/satului curent); headingurile de la liniile ~136 si ~150 sunt `<h2>`
- [ ] #7 `scripts/generate-sitemap.js`: `STATIC_PAGES` contine cate o intrare `/info-page/<slug>` pentru fiecare sat/obiectiv existent in datele componentei
- [ ] #8 Implementatorul a rulat protocolul SSR local si a lipit in `## Implementation Notes`, pentru cel putin doua slug-uri diferite: `curl -s http://localhost:4000/info-page/<slug> | grep -o "<h1" | wc -l` → **1**; iar `curl -s ... | grep -o '<link rel="canonical"[^>]*>'` → canonical care contine acelasi slug (deci difera intre cele doua pagini)
- [ ] #9 Implementatorul a confirmat cu protocolul SSR local ca `curl -sI http://localhost:4000/info-page` redirectioneaza spre `/under-the-mountain`
- [ ] #10 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZIE owner: **Varianta A, cu ruta parametrizata** `/info-page/:village`. Varianta B (consolidare in `/sate/:slug`) e respinsa — TASK-32 a fost mutat in `backlog/manual/`, deci nu exista destinatie.

De ce parametrizarea si nu varianta minimala: pasul 3 din descrierea veche lasa alegerea intre „canonical spre /under-the-mountain" si „ruta parametrizata", ceea ce e un fork de arhitectura. Parametrizarea rezolva si problema de fond semnalata in „De ce" — continutul depinde azi de stare interna, deci un crawler (sau un refresh) vede altceva decat utilizatorul.

AC-urile vechi #1 („decizia A vs B e luata de owner") si #3/#4 (conditionate de varianta aleasa) au disparut — un criteriu care cere o decizie ar fi oprit pipeline-ul. AC-ul vechi #5 („nicio pagina publica fara updatePageMeta") era o verificare sitewide care depaseste scope-ul acestui task; acoperirea celorlalte pagini e deja confirmata prin grep (2026-07-06).
<!-- SECTION:NOTES:END -->
