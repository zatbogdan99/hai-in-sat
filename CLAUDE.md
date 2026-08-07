# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`hai-in-sat` — Angular 19 single-page application for a Romanian real estate site (region: Oltenia de sub Munte, Vâlcea). UI text and code comments are in Romanian. Production site: `https://hai-în-sat.ro` (IDN domain with diacritics).

## Commands

- `npm start` (= `ng serve --open`) — dev server on `http://localhost:4200`. Uses `proxy.conf.json` to forward `/home-form` to the production API.
- `ng serve` — same, without auto-opening the browser.
- `npm run build` (= `ng build`) — production build by default (configuration is `production`); outputs to `dist/hai-in-sat/`. Production swaps `src/environments/environment.ts` for `environment.prod.ts`.
- `ng build --configuration development` or `npm run watch` — non-optimized dev build with sourcemaps.
- `npm test` (= `ng test`) — local, interactive Karma + Jasmine run.
- `npm run test:ci` — single headless test run used for automated verification. Run one spec with `npm run test:ci -- --include=src/app/path/to.spec.ts`.
- Never leave focused or disabled Jasmine tests (`fdescribe`, `fit`, `xdescribe`, `xit`) in committed code.
- `npm run generate-sitemap` — fetches every property from the live API and writes `src/sitemap.xml`. Run **before** `ng build` when properties have changed; the sitemap is bundled as a static asset.

Production budgets (see `angular.json`): initial bundle warns at 4 MB / errors at 6 MB; per-component style warns at 7.5 KB / errors at 10 KB.

## Deployment

Deployed to Google App Engine Standard, runtime `nodejs22`, instance class F2. `app.yaml` `entrypoint: node dist/hai-in-sat/server/main.js` runs the Express SSR server. Static handlers serve `dist/hai-in-sat/browser/...` directly without invoking Node. `automatic_scaling: min_instances: 0` — instances scale to zero on idle (cold start ~1-3s). Both bundles must exist before `gcloud app deploy app.yaml`: `dist/hai-in-sat/browser/` AND `dist/hai-in-sat/server/main.js`.

## Architecture

### Bootstrap and routing
- Standalone-component app — **no NgModule**. Bootstrapped in `src/main.ts` via `bootstrapApplication(AppComponent, { providers: [...] })`. Add new providers there (router, Firebase, PrimeNG theme, HttpClient, global services).
- Routes live in `src/app/app.routes.ts`. The `**` wildcard renders `NewLandingPageComponent` (the home page is the wildcard, not a literal `/`). New routes go here, and the imported component must be `standalone: true` (Angular 19 default) — there is no module to register it in.
- `add-property` is the only auth-gated route; protected by `authGuard` (`src/app/guards/auth.guard.ts`) which uses Firebase `authStateReady()` and redirects to `/login`.

### Backend API
- Backend base URL is hardcoded in each service: `https://hai-in-sat-api.lm.r.appspot.com`. Each service file also has a commented-out `http://localhost:8080` variant — toggling between them is the convention here, there is no env-var mechanism. `PhotoAdminService.regenerateThumbnails*` is hardcoded to localhost (admin-only, run locally).
- `proxy.conf.json` rewrites `/home-form` → API root for the dev server only; production hits the API directly.

### State and services
- `DataService` (`src/app/service/data-service.ts`) holds global `BehaviorSubject` signals — used by the footer / `AppComponent` to open Terms and Privacy popups from anywhere. Subscribe-and-reset pattern (set to `true`, consumer resets to `false`).
- `PropertiesStateService` (`src/app/service/properties-state-service/`) uses **Angular signals** for paged property list state and an in-memory page cache keyed by `${page}:${size}`. Distinct from the BehaviorSubject pattern in `DataService` — match the existing style of the area you're editing.
- Heavy use of PrimeNG components (Dialog, Toast, Button, etc.) with the `Lara` theme preset (configured in `main.ts`). `darkModeSelector: 'none'` disables PrimeNG's auto dark-mode handling.

### SEO
- `SeoService` (`src/app/service/seo.service.ts`) is the single point for `<title>`, meta/OG/Twitter tags, canonical link, and JSON-LD injection (`setBreadcrumbs`, `setRealEstateListing`). Page components call `updatePageMeta(...)` and the JSON-LD helpers in `ngOnInit`. Base URL constant is `https://hai-în-sat.ro`.
- Property URLs use `/property/:id/:slug` (with a legacy `/property/:id` fallback). Slug is built by `generateSlug(type, name)` in `src/app/utils/slug.util.ts` — prefix is `casa-de-vanzare` for `PropertyType.HOUSE`, `teren-de-vanzare` otherwise; diacritics are stripped via a fixed map (ă/â→a, î→i, ș→s, ț→t). The same logic is duplicated in `scripts/generate-sitemap.js` — keep them in sync if you change one.

### Photos
- `PhotoService` is a registry of hardcoded asset paths per village (Horezu, Costești, Polovragi, etc.). Adding a village means adding a `getXxxData()` method and a public `getXxxImages()` accessor. Source images are AVIF under `src/assets/`.
- `PhotoAdminService` is the admin-only API client for replace/delete/regenerate operations.

### Build pipeline notes
- Karma config is implicit (no `karma.conf.js`) — test bootstrapping uses `tsconfig.spec.json` and `polyfills: ["zone.js", "zone.js/testing"]` from `angular.json`.

## Conventions

- Component style is `scss` (set in `angular.json` schematics). Selector prefix is `app`.
- TypeScript ~5.8; Angular ~19.2; zone.js ~0.15; RxJS ~7.8.
- Keep TypeScript pinned with a tilde (`~`) so routine updates stay within patch releases (5.8.x). Before changing the TypeScript minor version, verify compatibility with the Angular version used by the project.
- Romanian text is the default in templates and user-facing strings — match the surrounding language when editing.

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
