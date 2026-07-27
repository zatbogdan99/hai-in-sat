---
id: TASK-119
title: Corectează structura H1 pe toate paginile
status: To Do
assignee: []
created_date: '2026-06-12 16:11'
updated_date: '2026-07-27'
labels:
  - seo
  - on-page
  - content
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Inventarul auditului 2026-06-12 (`seo-audit-2026-06-12/crawl/inventory.csv`, coloana h1_count):

| Pagină | H1 | Problema |
|---|---|---|
| `/under-the-mountain` | **0** | fără heading principal |
| `/contact-us` | **0** | fără heading principal |
| `/village-of-the-month` | **3** | H1 multiplu |
| `/homes` | **2** | H1 multiplu |
| `/see-the-area` | **2** | H1 multiplu |
| `/about-us` | **2** | H1 multiplu |
| `/` | 1 | OK ca număr, dar „E timpul să te întorci la liniște" nu conține NICIUN termen de căutare |

Cauza CONFIRMATĂ în cod (2026-07-06): template-urile randează simultan varianta desktop (`.large-screen`) ȘI varianta mobilă (`.small-screen`) a aceluiași heading — două elemente în DOM, ascunse alternativ prin CSS. Googlebot le vede pe amândouă.

## Cum — cu locațiile exacte (verificate 2026-07-06)

1. **Paginile cu 0 H1**:
   - `/under-the-mountain` (`under-the-mountain.component.html`) — **DECIS de owner (2026-07-27):** headingul existent „De ce Oltenia de sub Munte?" (azi `<h2>`, linia ~25) devine `<h1>`, cu stilul vizual PASTRAT identic prin CSS (muta regulile de stil de pe `h2` pe noul `h1`, sau adauga o clasa). Zero schimbare vizuala pe pagina.

     In ACELASI timp: **sterge blocul de hero comentat de la liniile 1-7**, impreuna cu TODO-ul „mie mi se pare urat fara titlu" — owner-ul a confirmat ca nu mai e de actualitate. Nu-l reactiva.
   - `/contact-us` (`contact-us.component.html`): nu are NICIUN heading pe desktop (doar SVG + social); pe mobil are `<h2>Contactează-ne și hai în sat!</h2>` (linia ~72). Adaugă UN `<h1>` („Contactează Hai în Sat — agenție imobiliară în Horezu") vizibil în ambele layout-uri (element unic + CSS responsive).
2. **Paginile cu H1 multiplu** — păstrează UN singur `<h1>` per pagină, restul devin `<h2>`/`<h3>`; unde dublarea e doar desktop/mobil, folosește UN element cu clase CSS responsive:
   - `/village-of-the-month` (`village-of-the-month.component.html`): H1 „Satul {{title}}" (linia ~8) + H1 „Prezentarea satului" (linia ~22, id `card-info-title`) + dublurile din varianta small-screen. Păstrează „Satul {{title}}" ca H1; „Prezentarea satului" → `<h2>`.
   - `/homes` (`form-page.component.html`): H1 duplicat desktop/mobil la liniile 9 și 71 — iar varianta mobilă e FĂRĂ diacritice („cauti", „gasim"). Unifică într-un singur element (cu diacritice corecte).
   - `/see-the-area` (`see-the-area.component.html`): H1-uri la liniile ~6, 18, 37 (desktop) și ~64, 76, 93 (mobil) — „Haide să vezi zona" ×2 + „Cumpără"/„Închiriază" ×2. Păstrează „Haide să vezi zona" ca unic H1; „Cumpără"/„Închiriază" → `<h2>`.
   - `/about-us` (`about-us.component.html`): H1 „Despre noi" duplicat la liniile 16 (desktop) și 37 (mobil) → un singur element.
3. **Homepage — SCOS DIN SCOPE (decizie owner 2026-07-27).** `new-landing-page.component.html:4` NU se atinge. H1-ul ramane „E timpul să te întorci la liniște", desi nu contine termeni de cautare — owner-ul a decis ca sloganul ramane cum e. Nu-l rescrie, nu-l completa cu subtitlu, nu propune alternative.

   (Pagina are oricum EXACT un `<h1>`, deci nu incalca regula structurala urmarita de acest task.)
4. Verifică ierarhia: fără sărituri H1→H3 fără H2 pe paginile editate.
5. NU atinge: `/properties` (are deja exact 1 H1 „Case și terenuri") și `/property/:id/:slug` (H1 = numele proprietății). Componentele ne-rutate (`home-page`, `see-the-area-buy/rent`, `info-page`) NU intră în acest task — soarta lor e tratată separat (curățenie cod mort, faza de review).

## Fișiere afectate

- `src/app/under-the-mountain/under-the-mountain.component.html` (+ .scss), `src/app/contact-us/contact-us.component.html` (+ .scss), `src/app/village-of-the-month/village-of-the-month.component.html`, `src/app/home-form-page/form-page.component.html`, `src/app/see-the-area/see-the-area.component.html`, `src/app/about-us/about-us.component.html`, `src/app/new-landing-page/new-landing-page.component.html`

## Efort

M (jumătate de zi — e mai mult grijă la CSS responsive decât cod).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Deschide fiecare pagina modificata pe **390 px** (mobil) si **1366 px** (desktop) si confirma ca nimic nu s-a mutat vizual. Unificarea variantelor desktop/mobil intr-un singur element cu CSS responsive e singura parte a task-ului cu risc vizual real — acolo te uiti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `/under-the-mountain`: headingul „De ce Oltenia de sub Munte?" (azi `<h2>`, linia ~25) e acum `<h1>`, cu aceleasi reguli de stil aplicate (fara schimbare vizuala), iar blocul de hero comentat de la liniile 1-7 impreuna cu TODO-ul aferent sunt STERSE din fisier
- [ ] #2 `/contact-us` (`contact-us.component.html`): exista UN `<h1>` — „Contactează Hai în Sat — agenție imobiliară în Horezu" — vizibil in AMBELE layout-uri, ca UN SINGUR element cu CSS responsive (nu doua elemente ascunse alternativ). `<h2>Contactează-ne și hai în sat!</h2>` de la linia ~72 ramane `<h2>` (nu se sterge, nu se promoveaza)
- [ ] #3 `/village-of-the-month`: „Satul {{title}}" (linia ~8) ramane singurul `<h1>`; „Prezentarea satului" (linia ~22, id `card-info-title`) devine `<h2>`; dublurile din varianta small-screen sunt unificate in acelasi element
- [ ] #4 `/homes` (`form-page.component.html`): H1-ul duplicat de la liniile 9 si 71 devine UN singur element cu CSS responsive, iar textul foloseste diacritice corecte („cauți", „găsim") — varianta mobila le pierduse
- [ ] #5 `/see-the-area`: „Haide să vezi zona" ramane singurul `<h1>`; „Cumpără" si „Închiriază" (azi `<h1>` la liniile ~18, ~37, ~76, ~93) devin `<h2>`; dublurile desktop/mobil sunt unificate
- [ ] #6 `/about-us`: „Despre noi" e UN singur element (azi duplicat la liniile 16 si 37)
- [ ] #7 `new-landing-page.component.html` NU e modificat — homepage-ul e scos din scope prin decizie owner
- [ ] #8 `/properties` si `/property/:id/:slug` NU sunt modificate (au deja exact 1 H1)
- [ ] #9 Componentele nerutate NU sunt atinse: `home-page`, `see-the-area-buy`, `see-the-area-rent`. `/info-page` e tratata separat de TASK-122
- [ ] #10 Pe paginile editate nu exista salturi de nivel (H1 → H3 fara H2 intre ele)
- [ ] #11 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes` numaratoarea de H1 pentru fiecare ruta din sitemap: `curl -s http://localhost:4000/<ruta> | grep -o "<h1" | wc -l` — rezultatul trebuie sa fie **exact 1** pe fiecare
- [ ] #12 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZII owner:
1. **Homepage-ul e scos din scope.** H1-ul „E timpul să te întorci la liniște" ramane neschimbat, desi nu contine termeni de cautare. Punctul 3 din „Cum" si AC-ul vechi #3 au fost eliminate. Nu redeschide subiectul fara o cerere explicita.
2. **`/under-the-mountain`**: se promoveaza H2-ul existent in H1, cu stil pastrat — NU se reactiveaza hero-ul comentat. In plus, blocul comentat de la liniile 1-7 si TODO-ul lui se sterg (owner: „nu mai e de actualitate").

Ambiguitati eliminate: textele de H1 pentru `/contact-us` erau date ca exemplu („ex. ...") → fixate literal. AC-ul vechi #1 cerea re-rularea crawler-ului de audit pe productie → inlocuit cu numaratoarea de `<h1>` prin protocolul SSR local. AC-ul vechi #5 (regresie vizuala pe 390 px si 1366 px) → mutat in `## Verificare post-deploy (owner)`.
<!-- SECTION:NOTES:END -->
