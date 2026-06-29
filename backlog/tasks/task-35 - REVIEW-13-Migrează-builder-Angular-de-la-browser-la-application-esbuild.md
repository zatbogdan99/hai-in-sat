---
id: TASK-35
title: 'REVIEW-13: Migrează builder Angular de la :browser la :application (esbuild)'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:24'
labels:
  - review
  - build
  - ssr-migration
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`hai-in-sat/hai-in-sat/angular.json:18` folosește builder-ul vechi:

```json
"builder": "@angular-devkit/build-angular:browser"
```

Angular 17+ a introdus builder-ul nou `:application` bazat pe esbuild care:
- Builduri **5-10x mai rapide** (cold ~25s → ~3s pentru proiectul ăsta probabil).
- Folosește noul API SSR (`@angular/ssr` / `AngularNodeAppEngine`). ⚠️ Dar SSR-ul EXISTĂ deja aici, pe API-ul vechi (CommonEngine + builder `:server`) — deci migrarea înseamnă **rescrierea `src/server.ts`** la noul API, NU adăugarea SSR-ului de la zero.
- Mai bun tree-shaking → bundle mai mic (parțial address TASK-15).
- Suport mai bun pentru modul Standalone (deja folosit aici).
- Default în Angular 19 pentru proiecte noi (`ng new`).

Builder-ul `:browser` (webpack-based) este în maintenance mode și va fi deprecated.

## Cum se rezolvă

### Pași

1. **Backup**: commit-uiește orice work în progress.

2. **Migrate prin schematic Angular oficial**:
   ```powershell
   ng update @angular/cli --name=use-application-builder
   ```
   Schematic-ul:
   - Schimbă builder în `angular.json` la `@angular-devkit/build-angular:application`
   - Mută `main`, `polyfills`, `outputPath`, `tsConfig`, `assets`, `styles`, `scripts` (rămân la fel)
   - `index` rămâne la fel
   - Nu mai există `vendorChunk`, `namedChunks`, `extractLicenses` (esbuild gestionează altfel)

3. **Manual review după migrate**:
   - `output.path` se schimbă din `dist/hai-in-sat/` la `dist/hai-in-sat/browser/` (subfolder). Update `app.yaml` static_files paths SAU păstrează vechiul path forțat în `outputPath: { base: "dist/hai-in-sat", browser: "" }`.
   - Update `package.json` `start` script dacă necesar.
   - Update `.gitignore` dacă pattern-ul de output e diferit.

4. **Migrarea SSR-ului EXISTENT (nu adăugare de la zero):** SSR-ul rulează acum pe `CommonEngine` + builder `:server`. După `use-application-builder`, trebuie rescris `src/server.ts` de la `CommonEngine` la `AngularNodeAppEngine` (`@angular/ssr`). ⚠️ `ng add @angular/ssr` / schematic-ul **îți poate SUPRASCRIE `server.ts`** — fă backup și RE-APLICĂ manual middleware-ul custom existent (vezi avertismentul din „Risc / efecte").

5. **Test**:
   - `ng build` — verifică output structure
   - `ng serve` — verifică dev mode
   - `ng test` — verifică karma config compatibil
   - Deploy la o rută staging și verifică funcționalitatea completă

## Risc / efecte

- **⚠️ CONFLICT pe `src/server.ts` — ordinea contează.** Migrarea rescrie `server.ts` (CommonEngine → AngularNodeAppEngine), dar `server.ts` e atins și de TASK-47 (timeout/error handler), TASK-49 (redirect 301), TASK-3 (404/noindex) și TASK-51 (cache SSR). Dacă acelea se fac ÎNTÂI (pe CommonEngine), migrarea le va clobber-a → middleware-ul lor trebuie RE-APLICAT manual pe noul `server.ts`. Decizie de secvențiere: ori faci TASK-35 ÎNAINTEA lor (foundation curată), ori accepți re-aplicarea după. Cum TASK-47 (5xx) e urgent, calea pragmatică: 47/3/49/51 acum pe CommonEngine, iar la migrare re-aplici middleware-ul (e portabil conceptual).
- **Lara theme PrimeNG + esbuild**: a fost raportat un edge case unde anumite teme PrimeNG cu CSS variables nu erau procesate corect — verifică Lara după migrate.
- **Custom webpack config (`extra-webpack.config.js`)**: nu mai funcționează cu `:application`. Bun pentru ștergere (vezi REVIEW-14).
- **Plugin-uri webpack (compression-webpack-plugin etc.)** dacă sunt — necesită alt path (esbuild plugin sau post-build script).

## Beneficii imediate

- Build rapid în CI.
- Aliniază SSR-ul la API-ul modern, suportat (`CommonEngine` e legacy / maintenance).
- Bundle mai mic (parțial atinge TASK-15).
- Path către brotli precompresie (TASK-18).

## Fișiere afectate

- `angular.json` (configuration block changes)
- `package.json` (potential script tweaks)
- `app.yaml` sau `firebase.json` (output path change)
- `extra-webpack.config.js` (devine obsolete — vezi REVIEW-14)
- `tsconfig.app.json` (verifică `target` și `module`)

## Efort

3-5 ore (migrare + verificare + fix rough edges).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `angular.json` folosește `@angular-devkit/build-angular:application`
- [ ] #2 `ng build` produce output funcțional în `dist/hai-in-sat/` (sau `dist/hai-in-sat/browser/` ajustat în deployment)
- [ ] #3 Site-ul deployat funcționează identic post-migrate (test manual: toate rutele, login, formulare)
- [ ] #4 Timpul de build (cold) este vizibil mai mic (>50% reducere)
- [ ] #5 PrimeNG Lara theme se randează corect post-migrate
- [ ] #6 SSR-ul existent migrat la noul API: `src/server.ts` rescris de la `CommonEngine` la `AngularNodeAppEngine`, iar `prerender`/`ssr` funcționează cu builder-ul `:application` (build + serve SSR OK); middleware-ul custom (timeout/redirect/404/cache, dacă era deja adăugat) e re-aplicat și funcțional
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. angular.json:18 tot @angular-devkit/build-angular:browser, :122 :server (legacy webpack). server.ts foloseste CommonEngine. Update-ul din 2026-05-09 ramane corect: migrarea la :application implica rescrierea server.ts la AngularNodeAppEngine. Recomandare: dupa intarirea testelor (task-28).
<!-- SECTION:NOTES:END -->
