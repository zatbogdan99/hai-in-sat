---
id: TASK-57
title: Optimizează imaginile — alt obligatoriu, dimensiuni, lazy, srcset
status: To Do
assignee: []
created_date: '2026-06-12 16:15'
updated_date: '2026-06-12 16:15'
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
## De ce

Datele auditului 2026-06-12 (findings/visual.md + crawl/jsonld-summary.json, per pagină):
- **~40% din imaginile anunțurilor fără alt text** (ex. Teren Cerna: 6/10 cu alt; Polovragi: 12/16) — paginile statice stau bine (100% au alt);
- **ZERO atribute `width`/`height`** pe `<img>` în tot site-ul — CLS-ul e azi OK (0–0,09) doar datorită CSS-ului; fragil la orice schimbare;
- **fără `loading="lazy"` pe galeriile anunțurilor** (apare doar pe 6 imagini din /properties) — toate pozele unei galerii se descarcă imediat;
- fără `srcset`/`sizes` — mobilul descarcă imaginile de desktop.

Părți care NU se ating (sunt deja bune): AVIF + `preload` pe hero-urile statice.

## Cum

1. **Alt text obligatoriu la upload**: în formularul `/add-property` (și `replace-photos`), câmp de alt text per fotografie, obligatoriu, cu placeholder-model: „teren intravilan 9.600 mp Cerna, Vâlcea — vedere spre stradă". Pentru pozele existente: completare retroactivă (14 anunțuri × ~10 poze — fezabil manual).
2. **Componenta de galerie** (`property-details` + carduri `/properties`): adaugă `width`/`height` intrinseci (sau `aspect-ratio` CSS) pe toate `<img>`; `loading="lazy"` pe tot ce e sub fold (toate pozele galeriei except prima; prima poză = `fetchpriority="high"`).
3. **`srcset`/`sizes`** — depinde de variantele din TASK-48 (thumbnail/medium): `srcset="thumb 400w, medium 1200w"` cu `sizes` corespunzător layoutului. Dacă TASK-48 nu e încă livrat, implementează restul punctelor acum și lasă srcset-ul ca sub-punct dependent.
4. **Re-verificare**: re-rulează crawler-ul de audit și compară coloanele img_missing_alt / img_lazy / wh.

## Fișiere afectate

- `src/app/property-details/*` (galerie), componenta de card din `/properties`
- `src/app/add-property/*` (câmp alt obligatoriu)
- Backend: persistă alt text per fotografie (câmp nou în model) — repo java

## Efort

M (1–2 zile cu backend pentru alt per poză; srcset după TASK-48).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Formularul de adăugare/înlocuire poze NU permite submit fără alt text per fotografie; alt-ul se afișează în `<img alt="">`
- [ ] #2 Toate pozele celor 14 anunțuri existente au alt text descriptiv completat retroactiv (re-crawl: img_missing_alt = 0 pe toate paginile)
- [ ] #3 Toate `<img>` din galerii și carduri au `width`+`height` SAU `aspect-ratio` definit; CLS rămâne <0,1 pe paginile de anunț (măsurat lab)
- [ ] #4 Pozele galeriei sub fold au `loading="lazy"`; prima poză are `fetchpriority="high"` și NU e lazy
- [ ] #5 (după TASK-48) `srcset`+`sizes` pe galerii și carduri; pe viewport 390px se descarcă varianta mică, nu cea full (verificabil în DevTools Network)
- [ ] #6 Alt-urile urmează formatul descriptiv „{tip} {suprafață} {sat}, {județ} — {detaliu}", nu „poza1"/„image"
<!-- AC:END -->
