---
id: TASK-102
title: >-
  REVIEW-14: Șterge stub scripts goale (convert-to-avif.js,
  replace-image-refs.js)
status: Done
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-29'
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
| `extra-webpack.config.js` | **Șterge** — DECIS de owner 2026-07-27, neconditionat de TASK-131 |

### Phase 2 — Actualizare CLAUDE.md

Șterge mențiunea „empty stub files" din CLAUDE.md, deoarece file-urile nu mai există.

### Phase 3 — NU se face

Nu implementa niciun pipeline AVIF in acest task. Daca va fi nevoie, se deschide un task nou dedicat.

## Decizii owner (2026-07-27)

- **`extra-webpack.config.js` se sterge acum**, fara sa astepte TASK-131: e nereferentiat in `angular.json` (build-ul foloseste `@angular-devkit/build-angular:browser`, care nu citeste fisiere de config webpack custom), deci e mort indiferent de ce builder se foloseste maine.
- **Managerul de pachete e `yarn`** — repo-ul are `yarn.lock`, NU `package-lock.json`. Dupa editarea `package.json`, ruleaza `yarn install` ca sa regenerezi lockfile-ul. Nu introduce `package-lock.json`.
- **Fiecare dependenta se verifica inainte de stergere.** Daca `git grep` gaseste vreo referinta reala la una din ele, o pastrezi si notezi de ce in implementation notes — nu o stergi „ca era in lista".

## Verificare post-deploy (owner)

Nu e cazul: task-ul nu schimba nimic din comportamentul aplicatiei in productie. Daca build-ul si testele trec, e gata.

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
- [x] #1 `ls hai-in-sat/hai-in-sat/scripts/` returneaza DOAR `generate-sitemap.js` — `convert-to-avif.js` si `replace-image-refs.js` (stub-uri de 0 bytes) nu mai exista
- [x] #2 `hai-in-sat/hai-in-sat/extra-webpack.config.js` e sters (decizie owner, neconditionata de TASK-131)
- [x] #3 `hai-in-sat/hai-in-sat/CLAUDE.md` nu mai contine mentiunea despre „empty stub files” / `convert-to-avif.js` / `replace-image-refs.js`; daca acolo se descria si `extra-webpack.config.js` ca legacy, si acea mentiune dispare
- [x] #4 `package.json`: sterse din `dependencies` pachetele `yarn` si `schematics-scss-migrate`
- [x] #5 `package.json`: sterse din `devDependencies` pachetele `css-loader`, `style-loader`, `file-loader`, `sass-loader`, `browser-sync`
- [x] #6 Fiecare pachet sters a fost verificat inainte cu `git grep`: implementatorul a lipit in `## Implementation Notes` rezultatul cautarii pentru fiecare nume. Orice pachet care are inca o referinta reala e PASTRAT, cu motivul notat
- [x] #7 `yarn.lock` e regenerat prin `yarn install` (repo-ul foloseste yarn; NU se introduce `package-lock.json`)
- [x] #8 Implementatorul a rulat `npm run build:browser` DUPA stergerea dependentelor si a lipit rezultatul in `## Implementation Notes`
- [x] #9 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. scripts/ contine inca convert-to-avif.js si replace-image-refs.js (stub-uri 0 bytes) pe langa generate-sitemap.js. extra-webpack.config.js inca exista. De sters + actualizat CLAUDE.md (mentiunea 'empty stub files').
Verificare 2026-07-06: neschimbat (ambele stub-uri 0 bytes din 2026-02-28; extra-webpack.config.js prezent si nereferentiat in angular.json). EXTINDERE SCOPE (aceeasi igiena, acelasi PR): package.json contine dependente moarte/gresite, de sters dupa verificare cu git grep + build: in dependencies — 'yarn' (managerul de pachete nu se instaleaza ca dependenta a aplicatiei) si 'schematics-scss-migrate' (unealta one-shot de migrare); in devDependencies — toolchain webpack nefolosit de builderul Angular CLI (css-loader, style-loader, file-loader, sass-loader, browser-sync), folosit doar de extra-webpack.config.js inactiv. Verifica fiecare cu grep inainte; ruleaza build + test dupa.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. `extra-webpack.config.js` era conditionat de TASK-131 („sterge DACA REVIEW-13 livreaza") — un fork pe care agentul nu-l putea rezolva. DECIS: se sterge acum; e nereferentiat in `angular.json` oricum.
2. Phase 3 (script AVIF real, cu cod de exemplu) invita agentul sa implementeze ceva ce nu se cere → marcata explicit ca „NU se face".
3. AC-ul vechi #5 amesteca `yarn install` cu `npm run build:browser` fara sa spuna care e managerul de pachete → clarificat: yarn (`yarn.lock` e lockfile-ul repo-ului).
4. AC-ul vechi #2 permitea „sters SAU documentat ca ramane" — alt fork; acum e strict stergere.
### Verificari implementare 2026-07-29

Cautarile complete au fost rulate inaintea modificarilor. Mai jos este rezultatul brut relevant din starea pre-modificare (`HEAD`), cu `yarn.lock`, `backlog/**` si asset-urile AVIF excluse pentru a separa utilizarile operationale de lockfile, cerintele taskului si potrivirile binare.

```text
$ git grep -n -F -- 'yarn' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:.gcloudignore:9:#   - yarn.lock
HEAD:.gcloudignore:21:# Dependente — GAE reinstaleaza din yarn.lock
HEAD:.gcloudignore:24:.yarn/
HEAD:.gcloudignore:38:# Lockfile alternativ — yarn.lock e sursa de adevar (vezi CLAUDE.md)
HEAD:.gcloudignore:83:yarn-debug.log*
HEAD:.gcloudignore:84:yarn-error.log*
HEAD:.gitignore:12:yarn-error.log
HEAD:package.json:51:    "yarn": "^1.22.19",
exit 0

$ git grep -n -F -- 'schematics-scss-migrate' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:package.json:47:    "schematics-scss-migrate": "^2.3.17",
exit 0

$ git grep -n -F -- 'css-loader' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:extra-webpack.config.js:6:        use: ['css-loader', 'style-loader'],
HEAD:package.json:64:    "css-loader": "^6.9.1",
exit 0

$ git grep -n -F -- 'style-loader' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:extra-webpack.config.js:6:        use: ['css-loader', 'style-loader'],
HEAD:package.json:75:    "style-loader": "^3.3.4",
exit 0

$ git grep -n -F -- 'file-loader' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:extra-webpack.config.js:10:        use: ['file-loader'],
HEAD:package.json:65:    "file-loader": "^6.2.0",
exit 0

$ git grep -n -F -- 'sass-loader' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:package.json:73:    "sass-loader": "13",
exit 0

$ git grep -n -F -- 'browser-sync' HEAD -- ':!yarn.lock' ':!backlog/**' ':!*.avif'
HEAD:package.json:63:    "browser-sync": "^3.0.0",
exit 0
```

Interpretare: `yarn` apare operational numai ca manager/lockfile in fisierele ignore, nu ca biblioteca folosita de aplicatie; `schematics-scss-migrate`, `sass-loader` si `browser-sync` apar numai ca dependente directe. `css-loader`, `style-loader` si `file-loader` mai apar doar in `extra-webpack.config.js`, configuratie nereferentiata in `angular.json` si eliminata in acelasi task. Prin urmare, toate cele sapte dependente directe pot fi sterse.

Fisiere eliminate: `scripts/convert-to-avif.js`, `scripts/replace-image-refs.js`, `extra-webpack.config.js`. Fisiere modificate: `package.json`, `yarn.lock`, `CLAUDE.md` si acest task.

Verificari rulate de orchestrator dupa eliminarea dependentelor, conform separarii rolurilor din pipeline:

```text
$ yarn install
success Saved lockfile.
Done in 21.71s.
exit 0

$ npm run build:browser
Build at: 2026-07-29T08:13:56.874Z - Hash: 00e6cc9e4d45f596 - Time: 36555ms
exit 0

$ npx ng test --watch=false --browsers=ChromeHeadless
Chrome Headless 151.0.0.0 (Windows 10): Executed 51 of 51 SUCCESS
TOTAL: 51 SUCCESS
exit 0
```

Build-ul pastreaza doar warning-urile preexistente despre Sass `@import` si bugetele SCSS; testele emit loguri/warning-uri asteptate, fara teste esuate. Nu a fost creat `package-lock.json`.

### Rezumat pipeline 2026-07-29

- Implementare frontend finalizata conform planului; backend-ul nu a necesitat modificari.
- Review independent: curat dupa ciclul 1/3; 0 blocker, 0 major, 0 nit, fara etapa de fix.
- Verify independent: `allCriteriaMet: true`; toate criteriile #1-#9 sunt indeplinite.
- Nit-uri amanate: niciunul.
<!-- SECTION:NOTES:END -->
