---
id: TASK-103
title: 'REVIEW-18: TypeScript dev/preview version în package.json'
status: Done
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-07-29'
labels:
  - review
  - deps
  - stability
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`package.json:64` are:

```json
"typescript": "^5.5.0-dev.20240603"
```

Versiunea `5.5.0-dev.20240603` este o pre-release (dev nightly). Acceptarea `^` înseamnă că `yarn install` va găsi orice versiune >= 5.5.0-dev.20240603 < 6.0.0, ceea ce include atât stable cât și nightly. Comportament:

1. **Build instabil**: când TypeScript publică nightly noi în viitor, `yarn install --update` poate să sară pe alt nightly cu breaking changes.
2. **Reproducibilitate scăzută**: yarn.lock nu garantează stabilitate dacă cineva șterge yarn.lock și rulează install din nou (fixed cu lockfile, dar fragil).
3. **Suport scăzut**: nightly versions nu primesc patch-uri; bugfix-uri vin în următoarea major (5.5 stable, 5.6, 5.7).

Angular 19 este compatibil cu TypeScript 5.5.x stable (verifică https://angular.dev/reference/versions). De fapt, Angular 19.2 acceptă TypeScript >= 5.5 < 5.7.

## Cum se rezolvă

### Phase 1 — Switch la stable (versiunea e DECISA de owner 2026-07-27)

In `package.json`, inlocuieste linia cu:

```json
"typescript": "~5.8.0"
```

Apoi `yarn install` (repo-ul foloseste **yarn** — `yarn.lock` e lockfile-ul; NU introduce `package-lock.json`).

De ce `~5.8.0`, fara sa mai consulti matricea de compatibilitate: proiectul e pe `@angular/core: ^19.2.19`, iar Angular 19.2 accepta TypeScript `>=5.5.0 <5.9.0`. `~` permite patch-uri (5.8.x) si blocheaza minor-ul (5.9.x), care ar iesi din suport.

**Ruta de retragere, daca 5.8 produce erori de tip pe care nu le poti repara in scope-ul acestui task:** coboara la `~5.6.3` (tot stable, tot in intervalul suportat), documenteaza in implementation notes ce a picat, si gata. Ce NU e acceptabil in niciun scenariu: sa ramai pe o versiune `-dev` / nightly.

### Phase 2 — Verifică compatibilitate

1. `yarn install` (regenerează yarn.lock cu versiunea nouă)
2. `npx tsc --version` confirmă versiunea stable
3. `npm run build --configuration production` trece fără erori
4. `npm test` trece
5. Verifică tipuri în câteva fișiere critice (PropertyDTO, FormGroup, etc.)

### Phase 3 — Documentează

Adaugă în `CLAUDE.md` sau `README.md` versiunea TypeScript suportată și politica de update.

## Risc

Minor. Daca build-ul cade, e cel mai probabil din cauza unui tip mai strict in 5.8 fata de nightly-ul din 2024 — fix-uri punctuale. Daca sunt prea multe, foloseste ruta de retragere spre `~5.6.3` din Phase 1.

## Verificare post-deploy (owner)

Nu e cazul: schimbarea e strict la compilare. Daca build-ul si testele trec, comportamentul in productie e identic.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/package.json:64`
- `hai-in-sat/hai-in-sat/yarn.lock` (regenerat)

## Efort

30 min.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `package.json` are `"typescript": "~5.8.0"` — fara `^`, fara sufix `-dev`, fara nightly (ruta de retragere acceptata: `~5.6.3`, si atunci motivul e scris in implementation notes)
- [x] #2 `yarn.lock` e regenerat prin `yarn install`; NU exista `package-lock.json` in repo
- [x] #3 Implementatorul a rulat `npx tsc --version` si a lipit iesirea in `## Implementation Notes` — nu contine `-dev`
- [x] #4 Implementatorul a rulat `npm run build:browser` si a lipit iesirea in `## Implementation Notes`: build reusit, zero erori de tip
- [x] #5 `npx ng test --watch=false --browsers=ChromeHeadless` trece (baseline 49/49 pe master, remasurat 2026-07-28)
- [x] #6 `CLAUDE.md` mentioneaza versiunea de TypeScript suportata si politica de fixare cu tilda (`~`) — sectiunea „Conventions" spune azi doar „TypeScript ~5.5", de aliniat cu realitatea
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. package.json:76 tot 'typescript': '^5.5.0-dev.20240603' (dev nightly) - linia s-a mutat (era 64). De trecut la stable ~5.6.x compatibil Angular 19.
Verificare 2026-07-06: neschimbat — package.json are tot 'typescript': '^5.5.0-dev.20240603'. La alegerea versiunii stable NU hardcoda ~5.6.0 fara verificare: consulta matricea de compatibilitate Angular 19.2 (accepta si 5.6–5.8) si ia cea mai noua versiune acceptata, fixata cu tilda (~).
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Nota din verificarea 2026-07-06 spunea „NU hardcoda ~5.6.0 fara verificare: consulta matricea de compatibilitate Angular 19.2" — adica cerea agentului sa consulte o pagina web, ceea ce intr-un sandbox fara retea inseamna fie esec, fie inventare. FIXAT: `~5.8.0`, cu justificarea intervalului (`>=5.5.0 <5.9.0` pentru Angular 19.2) scrisa in task si cu ruta de retragere explicita.
2. Managerul de pachete era ambiguu (`yarn add` in descriere, `npm run` in AC) → clarificat: yarn pentru instalare, npm run pentru scripturi.
3. AC-ul vechi #4 zicea „npm test (sau ce exista post-REVIEW-6)” → concretizat, cu baseline-ul 49/49.

### Verificari implementare 2026-07-29

TypeScript a fost fixat direct la intervalul stabil `~5.8.0`; ruta de retragere la `~5.6.3` nu a fost necesara. Verificarile au fost rulate de orchestrator dupa regenerarea lockfile-ului, conform separarii rolurilor din pipeline:

```text
$ yarn install
success Saved lockfile.
Done in 11.27s.
exit 0

$ npx tsc --version
Version 5.8.3
exit 0

$ npm run build:browser
Build at: 2026-07-29T09:13:09.400Z - Hash: 00e6cc9e4d45f596 - Time: 15622ms
exit 0

$ npx ng test --watch=false --browsers=ChromeHeadless
Chrome Headless 151.0.0.0 (Windows 10): Executed 51 of 51 SUCCESS
TOTAL: 51 SUCCESS
exit 0
```

`yarn.lock` a fost regenerat prin `yarn install`; `package-lock.json` nu exista. Build-ul pastreaza doar warning-urile preexistente despre Sass `@import` si bugetele SCSS, fara erori de tip. Testele emit loguri si warning-uri asteptate, fara teste esuate.

### Rezumat pipeline 2026-07-29

- TypeScript migrat de la nightly la intervalul stabil `~5.8.0`, rezolvat la `5.8.3`; ruta de retragere nu a fost necesara.
- Fisiere principale: `package.json`, `yarn.lock`, `CLAUDE.md` si acest task.
- Review independent: curat dupa ciclul 1/3; 0 blocker, 0 major, 0 nit, fara etapa de fix.
- Verify independent: `allCriteriaMet: true`; toate criteriile #1-#6 sunt indeplinite.
- Nit-uri amanate: niciunul.
<!-- SECTION:NOTES:END -->
