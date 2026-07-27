---
id: TASK-24
title: Optimizează imaginile — alt obligatoriu, dimensiuni, lazy, srcset
status: To Do
assignee: []
created_date: '2026-06-12 16:15'
updated_date: '2026-07-06'
labels:
  - seo
  - images
  - a11y
  - performance
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/visual.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

## De ce e MANUAL (decizie owner, 2026-07-27)

NU se ruleaza prin pipeline. Doua motive:
1. **`srcset` (pct. 3) e imposibil azi** — cere variantele `thumb`/`medium` produse de TASK-3, care e la randul lui manual.
2. **AC#2 (alt retroactiv) e data entry pur** — 14 anunturi × ~10 poze completate de mana prin UI-ul de admin, dupa ce backend-ul capata camp de alt per fotografie.

**Daca vrei sa recuperezi partea de cod pentru pipeline:** taie un task frontend-only cu pct. 2 si 4 (width/height sau aspect-ratio pe toate `<img>`, `loading="lazy"` sub fold, `fetchpriority="high"` pe prima poza, alt descriptiv pe thumbnail-urile stripului din `property-details.component.html` liniile ~38/~80/~121) — acelea sunt complet verificabile static, fara backend si fara TASK-3.

## De ce

Datele auditului 2026-06-12 (findings/visual.md + crawl/jsonld-summary.json, per pagină), RE-VERIFICATE în cod la 2026-07-06:
- **~40% din imaginile anunțurilor fără alt text** — sursa exactă, confirmată: în `property-details.component.html`, slide-urile principale AU alt generat (`{tip}: {nume} - Imagine N`, vine din componentă), dar **thumbnail-urile stripului de navigare au `alt=""` gol** (liniile ~38, ~80, ~121). Paginile statice stau bine (100% au alt).
- **ZERO atribute `width`/`height`** pe `<img>` în galerii/carduri (confirmat — niciun width/height/aspect-ratio în template) — CLS-ul e azi OK (0–0,09) doar datorită CSS-ului; fragil la orice schimbare;
- **fără `loading="lazy"`/`fetchpriority` în galeria anunțului** (confirmat pe template; cardurile din `/properties` AU deja `loading="lazy"` + alt din `getImageAlt()` — properties.component.html:180-182/195-197) — toate pozele unei galerii se descarcă imediat;
- fără `srcset`/`sizes` — mobilul descarcă imaginile de desktop.

Părți care NU se ating (sunt deja bune): AVIF + `preload` pe hero-urile statice; alt-ul + lazy pe cardurile din `/properties`.

## Cum

1. **Alt text obligatoriu la upload**: în formularul `/add-property` (și `replace-photos`), câmp de alt text per fotografie, obligatoriu, cu placeholder-model: „teren intravilan 9.600 mp Cerna, Vâlcea — vedere spre stradă". Pentru pozele existente: completare retroactivă (14 anunțuri × ~10 poze — fezabil manual).
2. **Componenta de galerie** (`property-details` + carduri `/properties`): adaugă `width`/`height` intrinseci (sau `aspect-ratio` CSS) pe toate `<img>`; `loading="lazy"` pe tot ce e sub fold (toate pozele galeriei except prima; prima poză = `fetchpriority="high"`).
3. **`srcset`/`sizes`** — depinde de variantele din TASK-3 (DECIS: endpoint de streaming din Mongo cu variante `thumb`/`medium`): `srcset` cu URL-urile celor două variante (`.../thumb/... 400w, .../medium/... 1200w`) și `sizes` corespunzător layoutului. Dacă TASK-3 nu e încă livrat, implementează restul punctelor acum și lasă srcset-ul ca sub-punct dependent.
4. **Thumbnail-urile stripului din galerie** (alt="" azi): alt scurt derivat („{nume} — miniatura N") sau, dacă le consideri pur decorative (imaginea mare e alături), documentează alegerea `alt=""` intenționat — dar consecvent, nu implicit.
5. **Re-verificare**: re-rulează crawler-ul de audit și compară coloanele img_missing_alt / img_lazy / wh.

## Fișiere afectate

- `src/app/property-details/property-details.component.html` (+ .ts — galeria: alt thumbnails liniile ~38/~80/~121, width/height, lazy, fetchpriority)
- `src/app/properties/properties.component.html` (doar width/height + srcset; alt și lazy există)
- `src/app/add-property/*` (câmp alt obligatoriu per poză)
- Backend (branch `master`!): persistă alt text per fotografie — câmp nou în modelul de poze (`PhotoDTO`/colecția photos) + expunere în `/get-photos`

## Efort

M (1–2 zile cu backend pentru alt per poză; srcset după TASK-3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Formularul de adăugare/înlocuire poze NU permite submit fără alt text per fotografie; alt-ul se afișează în `<img alt="">`
- [ ] #2 Toate pozele celor 14 anunțuri existente au alt text descriptiv completat retroactiv (re-crawl: img_missing_alt = 0 pe toate paginile)
- [ ] #3 Toate `<img>` din galerii și carduri au `width`+`height` SAU `aspect-ratio` definit; CLS rămâne <0,1 pe paginile de anunț (măsurat lab)
- [ ] #4 Pozele galeriei sub fold au `loading="lazy"`; prima poză are `fetchpriority="high"` și NU e lazy
- [ ] #5 (după TASK-3) `srcset`+`sizes` pe galerii și carduri; pe viewport 390px se descarcă varianta mică, nu cea full (verificabil în DevTools Network)
- [ ] #6 Alt-urile urmează formatul descriptiv „{tip} {suprafață} {sat}, {județ} — {detaliu}", nu „poza1"/„image"
<!-- AC:END -->
