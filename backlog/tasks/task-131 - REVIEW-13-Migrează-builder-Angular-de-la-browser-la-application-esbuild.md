---
id: TASK-131
title: 'REVIEW-13: Migrează builder Angular de la :browser la :application (esbuild)'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-11-01'
labels:
  - review
  - build
  - ssr-migration
dependencies: [TASK-113, TASK-114, TASK-115, TASK-116, TASK-102]
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`angular.json:18` folosește builder-ul vechi (re-verificat 2026-11-01; target-ul `server` e la linia 122, iar `src/server.ts` folosește `CommonEngine`):

```json
"builder": "@angular-devkit/build-angular:browser"
```

Angular 17+ a introdus builder-ul nou `:application` bazat pe esbuild care:
- Builduri **5-10x mai rapide** (cold ~25s → ~3s pentru proiectul ăsta probabil).
- Folosește noul API SSR (`@angular/ssr` / `AngularNodeAppEngine`). ⚠️ Dar SSR-ul EXISTĂ deja aici, pe API-ul vechi (CommonEngine + builder `:server`) — deci migrarea înseamnă **rescrierea `src/server.ts`** la noul API, NU adăugarea SSR-ului de la zero.
- Mai bun tree-shaking → bundle mai mic (parțial address TASK-130).
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
   - Protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`): `npm run build` + `npm run serve:ssr`, apoi `curl` pe rutele principale. **Deploy-ul NU face parte din task** (vezi `AGENTS.md`).

## Risc / efecte

- **⚠️ CONFLICT pe `src/server.ts` — SECVENTIEREA E DECISA (2026-07-27). Actualizare 2026-11-01: toate dependențele (TASK-102, 113, 114, 115, 116) sunt livrate, deci task-ul poate porni oricând.** Migrarea rescrie `server.ts` (CommonEngine → AngularNodeAppEngine), iar `server.ts` e atins si de TASK-113 (redirect 301), TASK-114 (security headers), TASK-115 (404/noindex) si TASK-116 (cache SSR).

  **Acest task se ruleaza ULTIMUL dintre ele** — vezi `dependencies` in front matter. Motivul: TASK-47 (livrat) a demonstrat ca middleware-ul e portabil conceptual, iar celelalte patru task-uri sunt mici, urgente si independente; a le tine in loc pentru o migrare de builder ar bloca tot lantul de SEO tehnic.

  Consecinta directa: **re-aplicarea manuala a middleware-ului pe noul `server.ts` face parte din scope-ul acestui task**, nu e un efect secundar de tratat ad-hoc. Vezi checklist-ul din criteriile de acceptare.
- **Lara theme PrimeNG + esbuild**: a fost raportat un edge case unde anumite teme PrimeNG cu CSS variables nu erau procesate corect — verifică Lara după migrate.
- **Custom webpack config (`extra-webpack.config.js`)**: sters de TASK-102 (livrat; verificat 2026-11-01 că fișierul nu mai există).
- **Plugin-uri webpack (compression-webpack-plugin etc.)** dacă sunt — necesită alt path (esbuild plugin sau post-build script).

## Beneficii imediate

- Build rapid în CI.
- Aliniază SSR-ul la API-ul modern, suportat (`CommonEngine` e legacy / maintenance).
- Bundle mai mic (parțial atinge TASK-130).
- Path către brotli precompresie (TASK-13).

## Fișiere afectate

- `angular.json` (configuration block changes)
- `package.json` (potential script tweaks)
- `app.yaml` sau `firebase.json` (output path change)
- `src/server.ts` (rescris pe `AngularNodeAppEngine`, cu tot middleware-ul din checklist-ul AC #3)
- `scripts/test-ssr-cache.cjs` (doar dacă se schimbă calea bundle-ului de server)
- `tsconfig.app.json` (verifică `target` și `module`)

## Efort

3-5 ore (migrare + verificare + fix rough edges).
## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Migrarea de builder schimba TOT lantul de build si SSR, deci merita un tur complet dupa deploy:

1. Navigheaza prin fiecare ruta publica: `/`, `/proprietati`, o pagina de anunt (`/proprietati/:id/:slug`), `/oltenia-de-sub-munte`, o pagină de sat (`/sate/horezu`), `/satul-lunii`, `/gaseste-mi-locul`.
2. Logheaza-te si intra pe `/add-property`; salveaza o modificare de test.
3. Verifica vizual tema PrimeNG **Lara** — culori, butoane, dialoguri.
4. Confirma ca middleware-ul re-aplicat functioneaza in productie: `curl -sI https://www.xn--hai-n-sat-t5a.ro/` → 301; `curl -sI https://xn--hai-n-sat-t5a.ro/` → headerele de securitate + `X-Cache`; `curl -sI https://xn--hai-n-sat-t5a.ro/pagina-inexistenta` → 404; `curl -sI https://xn--hai-n-sat-t5a.ro/properties` → 301 spre `/proprietati`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `angular.json` foloseste `@angular-devkit/build-angular:application` pentru target-ul `build`; target-ul separat `:server` (azi linia ~122) nu mai exista — builder-ul `:application` produce si bundle-ul de server
- [ ] #2 `src/server.ts` e rescris de la `CommonEngine` la `AngularNodeAppEngine` din `@angular/ssr`; `CommonEngine` nu mai apare in cod
- [ ] #3 **Checklist de re-aplicare a middleware-ului custom** — fiecare element de mai jos exista si e functional pe noul `server.ts`: (a) mecanismul `SSR_RENDER_STATE` cu timeout de render 25 s si raspuns 503 (TASK-47) — atentie, providerul per-request se paseaza ALTFEL la `AngularNodeAppEngine` decat la `commonEngine.render()`, verifica API-ul; (b) redirectul host/proto 301 (TASK-113); (c) cele 5 headere + CSP-Report-Only (TASK-114); (d) statusul 404 + `X-Robots-Tag` (TASK-115); (e) cache-ul LRU cu `X-Cache`, `Date` original și `Age` (TASK-116); (f) redirecturile 301 într-un singur pas de la căile vechi, în engleză, la cele în română (`/properties`, `/property/:id[/:slug]`, `/under-the-mountain`, `/village-of-the-month`, `/homes`, cu și fără slash final, query string păstrat, doar GET/HEAD; TASK-143); (g) redirecturile `/about-us`, `/contact-us` → `/`, `/see-the-area` → `/proprietati`, `/info-page` → `/oltenia-de-sub-munte`; (h) `POST /csp-report` cu log `[CSP]`; (i) pagina 503 cu link spre `/proprietati`; (j) regulile de cache pentru fișierele statice (bundle-uri cu hash de 16 caractere: un an + `immutable`; `/assets`: 30 de zile; restul: 10 minute). Implementatorul enumera in `## Implementation Notes` fiecare punct, cu linia din noul fisier
- [ ] #4 Output-ul build-ului ramane in `dist/hai-in-sat/browser/` pentru bundle-ul de browser, iar `app.yaml` continua sa functioneze fara modificari — sau, daca a fost nevoie de ajustari, ele sunt in diff si explicate
- [ ] #5 `entrypoint` din `app.yaml` pointeaza spre calea REALA a bundle-ului de server produs de noul builder (azi `dist/hai-in-sat/server/main.js`) — verificat impotriva continutului real al `dist/` dupa build, nu presupus
- [ ] #6 `package.json`: scripturile `build`, `build:browser`, `serve:ssr`, `dev:ssr`, `prerender` sunt actualizate ca sa functioneze cu noul builder (target-ul `hai-in-sat:server` nu mai exista)
- [x] #7 `extra-webpack.config.js` nu exista in repo (sters de TASK-102). Deja adevărat, verificat 2026-11-01
- [ ] #8 Implementatorul a lipit in `## Implementation Notes` timpii de build cold ÎNAINTE si DUPA migrare, masurati identic
- [ ] #9 Implementatorul a rulat protocolul SSR local si a lipit iesirile: `curl -sI http://localhost:4000/` → 200; `curl -s http://localhost:4000/proprietati` → HTML randat pe server, care contine continut de proprietati (nu doar shell-ul gol)
- [ ] #10 `npm run test:ci` trece (config-ul karma e implicit, prin `tsconfig.spec.json` si `polyfills` din `angular.json` — verifica sa fi supravietuit migrarii). `npm run test:ssr` și `npm run test:ssr:http` trec și ele: ultimul verifică punctele (b)–(j) din AC #3 pe un server SSR real
- [ ] #11 Tema PrimeNG **Lara** se randeaza corect: implementatorul a confirmat ca `styles.<hash>.css` produs de noul builder contine variabilele CSS ale temei (`grep -c "\-\-p-" dist/hai-in-sat/browser/styles.*.css` > 0), rezultat lipit in notes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. angular.json:18 tot @angular-devkit/build-angular:browser, :122 :server (legacy webpack). server.ts foloseste CommonEngine. Update-ul din 2026-05-09 ramane corect: migrarea la :application implica rescrierea server.ts la AngularNodeAppEngine. Recomandare: dupa intarirea testelor (task din numerotarea VECHE — vezi azi TASK-104).

Verificare 2026-07-06: neschimbat. IMPORTANT — inventarul de „re-aplicat manual" dupa rescrierea server.ts a CRESCUT: TASK-47 (LIVRAT) a adaugat in server.ts timeout de render 25s + raspuns 503 cu pagina dedicata + mecanismul SSR_RENDER_STATE (src/app/ssr-render-state.ts, injectat ca provider per-request in commonEngine.render — la AngularNodeAppEngine providerul se paseaza diferit, verifica API-ul). La momentul migrarii, adauga pe lista si ce va mai fi intre timp in server.ts din TASK-113 (redirect), TASK-114 (headers), TASK-115 (404), TASK-116 (cache). Nota: output-ul build-ului e deja in dist/hai-in-sat/browser/ (app.yaml e aliniat), deci pasul 3 din descriere e partial rezolvat de la sine.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitatea majora eliminata: secventierea. Descrierea zicea „ori faci TASK-131 INAINTEA lor, ori accepti re-aplicarea dupa" — un fork de planificare pe care un agent nu are cum sa-l decida. DECIS: acest task ruleaza ULTIMUL, iar re-aplicarea middleware-ului intra explicit in scope, ca un checklist de 5 puncte in AC (`dependencies: [TASK-113, TASK-114, TASK-115, TASK-116, TASK-102]`).

Alte ambiguitati eliminate:
1. Pasul de test cerea „deploy la o ruta staging" — interzis agentilor → inlocuit cu protocolul SSR local.
2. AC-ul vechi #3 („site-ul deployat functioneaza identic, test manual") → acoperit de protocolul SSR local + suita de teste.
3. AC-ul vechi #5 („Lara se randeaza corect") era vizual → transformat intr-o verificare pe CSS-ul produs.
4. AC-ul vechi #2 lasa la latitudinea agentului daca output path-ul se schimba sau se forteaza — acum se cere verificarea `entrypoint`-ului din `app.yaml` fata de continutul real al `dist/`.

Nota: la 2026-07-06 output-ul era deja in `dist/hai-in-sat/browser/` si `app.yaml` era aliniat, deci pasul 3 din descriere e in mare parte rezolvat de la sine.
Notă 2026-10-30 (TASK-143): inventarul de re-aplicat din `server.ts` a crescut din nou. Pe lângă punctele (a)–(e) din AC #3 (la 2026-11-01 au fost adăugate în AC #3 ca punctele (f)–(j)), noul `server.ts` trebuie să păstreze: redirecturile 301 de la căile vechi, în engleză, la cele în română (`/properties`, `/property/:id[/:slug]`, `/under-the-mountain`, `/village-of-the-month`, `/homes`, cu și fără slash final, cu query string-ul păstrat), redirecturile `/about-us`, `/contact-us`, `/see-the-area`, `/info-page`, endpoint-ul `POST /csp-report` și linkul `/proprietati` din pagina 503. Toate sunt verificate de `npm run test:ssr:http`.
Actualizare 2026-11-01 (analiza backlog-ului față de cod): încă neimplementat (`:browser` + `:server` în `angular.json`, `CommonEngine` în `server.ts`). Toate dependențele sunt livrate. Checklist-ul din AC #3 a primit punctele (f)–(j): redirecturile din TASK-134/143, `/csp-report`, pagina 503 și regulile de cache pentru fișierele statice. AC #7 e deja adevărat și l-am bifat. Căile din verificări sunt acum cele în română.
<!-- SECTION:NOTES:END -->
