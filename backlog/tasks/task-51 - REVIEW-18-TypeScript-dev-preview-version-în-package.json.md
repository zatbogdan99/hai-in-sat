---
id: TASK-51
title: 'REVIEW-18: TypeScript dev/preview version în package.json'
status: To Do
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-07-06'
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

### Phase 1 — Switch la stable

```powershell
yarn add --dev typescript@~5.6.0
```

Sau manual în `package.json`:

```json
"typescript": "~5.6.0"
```

`~5.6.0` permite patch updates (5.6.x) dar nu minor (5.7.x). Mai stabil decât `^5.6.0`.

### Phase 2 — Verifică compatibilitate

1. `yarn install` (regenerează yarn.lock cu versiunea nouă)
2. `npx tsc --version` confirmă versiunea stable
3. `npm run build --configuration production` trece fără erori
4. `npm test` trece
5. Verifică tipuri în câteva fișiere critice (PropertyDTO, FormGroup, etc.)

### Phase 3 — Documentează

Adaugă în `CLAUDE.md` sau `README.md` versiunea TypeScript suportată și politica de update.

## Risc

Minor — Angular CI/CD ține TypeScript compatibility tight. Dacă build-ul cade, e cel mai probabil din cauza unui type mai strict în 5.6 vs nightly. Fix-uri rapide.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/package.json:64`
- `hai-in-sat/hai-in-sat/yarn.lock` (regenerat)

## Efort

30 min.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `package.json` folosește o versiune TypeScript stable (`~5.6.0` sau ultima minor stable suportată de Angular 19)
- [ ] #2 `yarn install` și `yarn.lock` regenerate
- [ ] #3 `npm run build --configuration production` trece fără erori de tip
- [ ] #4 `npm test` (sau ce există post-REVIEW-6) trece
- [ ] #5 `npx tsc --version` confirmă versiunea stable (no `-dev` în output)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. package.json:76 tot 'typescript': '^5.5.0-dev.20240603' (dev nightly) - linia s-a mutat (era 64). De trecut la stable ~5.6.x compatibil Angular 19.
Verificare 2026-07-06: neschimbat — package.json are tot 'typescript': '^5.5.0-dev.20240603'. La alegerea versiunii stable NU hardcoda ~5.6.0 fara verificare: consulta matricea de compatibilitate Angular 19.2 (accepta si 5.6–5.8) si ia cea mai noua versiune acceptata, fixata cu tilda (~).
<!-- SECTION:NOTES:END -->
