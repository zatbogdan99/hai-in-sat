---
id: TASK-65
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
- nu apelează `setBreadcrumbs` (singura pagină publică fără — vezi TASK-30);
- nu e în sitemap (`generate-sitemap.js` STATIC_PAGES);
- are H1-uri multiple în template (info-page.component.html — `{{ data[villageId].title }}` apare în mai multe variante + H1-uri secundare la :136/:150);
- conținutul depinde de starea internă `villageId` — la acces direct pe URL (crawler sau refresh), pagina poate afișa altceva decât a văzut utilizatorul care a navigat.

Conținutul (texte despre sate: Bărbătești, ceramica de Horezu etc.) e valoros — exact genul de conținut pe care TASK-32 (paginile de sat) vrea să-l construiască.

## Cum — două variante, alege una

**Varianta A — igienă minimă ACUM (efort S, nu blochează nimic):**
1. Adaugă `updatePageMeta` (title „{Satul/Obiectivul} — Oltenia de sub Munte | Hai în Sat", description, canonical `/info-page`) + `setBreadcrumbs` în `ngOnInit`.
2. UN singur H1 (numele obiectivului/satului curent).
3. Decide indexabilitatea: dacă conținutul per `villageId` nu e adresabil prin URL (nu există `/info-page/:id`), pagina e practic ne-crawlabilă distinct → pune canonical spre `/under-the-mountain` SAU fă ruta parametrizată `/info-page/:village` și abia atunci adaug-o în sitemap.

**Varianta B — consolidare (recomandată pe termen mediu):** conținutul din info-page devine sursă pentru paginile de sat din TASK-32 (`/sate/:slug`), iar `/info-page` se retrage (redirect 301 spre pagina de sat corespunzătoare sau spre `/under-the-mountain`). Dacă TASK-32 e aproape, sări peste Varianta A și fă direct B.

## Fișiere afectate

- `src/app/info-page/info-page.component.ts` (+ .html) — meta/breadcrumbs/H1 (Varianta A)
- `src/app/app.routes.ts` (dacă se parametrizează sau se retrage ruta)
- `scripts/generate-sitemap.js` (doar dacă devine adresabilă prin URL)
- (Varianta B) TASK-32 preia conținutul

## Efort

S (2-3 ore Varianta A) / inclus în TASK-32 (Varianta B).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Decizia A vs B e luată (owner) și documentată în implementation notes
- [ ] #2 (dacă A) `/info-page` are title/description/canonical proprii setate prin SeoService, breadcrumbs JSON-LD și EXACT un H1 în DOM
- [ ] #3 (dacă A) accesul DIRECT pe URL afișează conținut coerent (nu depinde de navigarea anterioară) SAU canonical-ul pointează explicit spre `/under-the-mountain`
- [ ] #4 (dacă B) `/info-page` redirecționează 301 spre destinația de consolidare și conținutul trăiește în paginile de sat
- [ ] #5 Nicio pagină publică nu mai rămâne fără `updatePageMeta` (grep pe componente rutate)
<!-- AC:END -->
