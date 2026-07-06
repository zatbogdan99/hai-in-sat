---
id: TASK-49
title: >-
  REVIEW-14: Șterge stub scripts goale (convert-to-avif.js,
  replace-image-refs.js)
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-06'
labels:
  - review
  - cleanup
  - quick-win
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`scripts/convert-to-avif.js` și `scripts/replace-image-refs.js` sunt fișiere de **0 bytes** (goale). CLAUDE.md le confirmă:

> `scripts/convert-to-avif.js` and `scripts/replace-image-refs.js` are **empty stub files** (0 bytes). Don't try to run them; only `scripts/generate-sitemap.js` is real.

Probleme:
- **Confuzie pentru contributor nou** — vede script-uri în folder, presupune că sunt funcționale, încearcă să le ruleze, eșuează tăcut sau cu eroare cryptică.
- **Risc real**: dacă cineva adaugă `npm run convert-to-avif` în package.json fără să verifice fișierul — failure silent.
- **Dead code** — alocă spațiu mental și de repo fără valoare.

În plus, în `hai-in-sat/hai-in-sat/extra-webpack.config.js` (care există dar nu e referit în `angular.json` — confirmat de CLAUDE.md ca legacy/inactive). Dacă REVIEW-13 livrează migrare la `:application` builder, oricum nu mai are sens.

## Cum se rezolvă

### Phase 1 — Decide pentru fiecare fișier

| Fișier | Acțiune |
|---|---|
| `scripts/convert-to-avif.js` | **Șterge** (sau implementează dacă există nevoie reală pentru pipeline AVIF) |
| `scripts/replace-image-refs.js` | **Șterge** (idem) |
| `extra-webpack.config.js` | **Șterge** dacă REVIEW-13 livrează migrarea la `:application`; păstrează doar dacă rămâne pe webpack și planuiezi să-l activezi |

### Phase 2 — Actualizare CLAUDE.md

Șterge mențiunea „empty stub files" din CLAUDE.md, deoarece file-urile nu mai există.

### Phase 3 — Dacă chiar ai nevoie de pipeline AVIF

`sharp` e deja în `devDependencies` (^0.34.5). Un script real `scripts/convert-to-avif.js` ar putea:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = 'src/assets-source';
const DEST = 'src/assets';

async function convertAll() {
  const files = fs.readdirSync(SRC).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  for (const file of files) {
    const out = path.join(DEST, file.replace(/\.[^.]+$/, '.avif'));
    await sharp(path.join(SRC, file))
      .avif({ quality: 60, effort: 7 })
      .toFile(out);
    console.log(`✓ ${file} → ${out}`);
  }
}

convertAll().catch(err => { console.error(err); process.exit(1); });
```

Plus în package.json: `"convert-images": "node scripts/convert-to-avif.js"`. Util ales pentru TASK-7 (re-encodare hero image).

## Recomandare

Șterge totul (Phase 1 + Phase 2). Dacă Phase 3 va fi nevoie, deschide o task nouă cu specificare clară.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/scripts/convert-to-avif.js` (șterge)
- `hai-in-sat/hai-in-sat/scripts/replace-image-refs.js` (șterge)
- `hai-in-sat/hai-in-sat/extra-webpack.config.js` (șterge dacă REVIEW-13 livrat)
- `hai-in-sat/hai-in-sat/CLAUDE.md` (update „empty stub files" mențiune)

## Efort

15-30 min.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `ls hai-in-sat/hai-in-sat/scripts/` returnează doar `generate-sitemap.js` (sau altele active)
- [ ] #2 `extra-webpack.config.js` șters SAU clar documentat că rămâne intenționat (cu motiv)
- [ ] #3 CLAUDE.md actualizat fără mențiunea fișierelor stub
- [ ] #4 `npm run build` continuă să funcționeze
- [ ] #5 Dependentele moarte din package.json (yarn, schematics-scss-migrate, css-loader, style-loader, file-loader, sass-loader, browser-sync) sunt sterse dupa verificare cu grep; `yarn install` + `npm run build:browser` + `npm test` trec
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. scripts/ contine inca convert-to-avif.js si replace-image-refs.js (stub-uri 0 bytes) pe langa generate-sitemap.js. extra-webpack.config.js inca exista. De sters + actualizat CLAUDE.md (mentiunea 'empty stub files').
Verificare 2026-07-06: neschimbat (ambele stub-uri 0 bytes din 2026-02-28; extra-webpack.config.js prezent si nereferentiat in angular.json). EXTINDERE SCOPE (aceeasi igiena, acelasi PR): package.json contine dependente moarte/gresite, de sters dupa verificare cu git grep + build: in dependencies — 'yarn' (managerul de pachete nu se instaleaza ca dependenta a aplicatiei) si 'schematics-scss-migrate' (unealta one-shot de migrare); in devDependencies — toolchain webpack nefolosit de builderul Angular CLI (css-loader, style-loader, file-loader, sass-loader, browser-sync), folosit doar de extra-webpack.config.js inactiv. Verifica fiecare cu grep inainte; ruleaza build + test dupa.
<!-- SECTION:NOTES:END -->
