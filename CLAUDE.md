# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`hai-in-sat` — Angular 20 single-page application for a Romanian real estate site (region: Oltenia de sub Munte, Vâlcea). UI text and code comments are in Romanian. Production site: `https://hai-în-sat.ro` (IDN domain with diacritics).

## Commands

- `npm start` (= `ng serve --open`) — dev server on `http://localhost:4200`. Uses `proxy.conf.json` to forward `/home-form` to the production API.
- `ng serve` — same, without auto-opening the browser.
- `npm run build` (= `ng build`) — production build by default (configuration is `production`); outputs to `dist/hai-in-sat/`. Production swaps `src/environments/environment.ts` for `environment.prod.ts`.
- `ng build --configuration development` or `npm run watch` — non-optimized dev build with sourcemaps.
- `npm test` (= `ng test`) — local, interactive Karma + Jasmine run.
- `npm run test:ci` — single headless test run used for automated verification. Run one spec with `npm run test:ci -- --include=src/app/path/to.spec.ts`.
- `npm run test:ssr` — Node tests for the SSR HTML cache, including expiry and HTTP freshness.
- `npm run test:ssr:http` — after `npm run build`, starts a temporary SSR server with local API fixtures and checks real GET/HEAD/304 responses, SEO phone filtering and that any rendered `tel:` link is the official number (the footer no longer shows it; the Contact dialog does). Also checks internal links on every sitemap route and discovers property pages by following the rendered filter/pagination links; saves `internal-links.json` as evidence. Port 4000 must be free, or set `SSR_CACHE_TEST_PORT`. Stops its server and prints the evidence directory on completion.
- Never leave focused or disabled Jasmine tests (`fdescribe`, `fit`, `xdescribe`, `xit`) in committed code.
- `npm run generate-sitemap` — fetches every property from the live API and writes `src/sitemap.xml`. Run **before** `ng build` when properties have changed; the sitemap is bundled as a static asset.

Production budgets (see `angular.json`): initial bundle warns at 4 MB / errors at 6 MB; per-component style warns at 7.5 KB / errors at 10 KB.

## Deployment

Deployed to Google App Engine Standard, runtime `nodejs22`, instance class F2. `app.yaml` `entrypoint: node dist/hai-in-sat/server/main.js` runs the Express SSR server. Static handlers serve `dist/hai-in-sat/browser/...` directly without invoking Node. `automatic_scaling: min_instances: 0` — instances scale to zero on idle (cold start ~1-3s). Both bundles must exist before `gcloud app deploy app.yaml`: `dist/hai-in-sat/browser/` AND `dist/hai-in-sat/server/main.js`.

## Architecture

### Bootstrap and routing
- Standalone-component app — **no NgModule**. Bootstrapped in `src/main.ts` via `bootstrapApplication(AppComponent, { providers: [...] })`. Add new providers there (router, Firebase, PrimeNG theme, HttpClient, global services).
- Routes live in `src/app/app.routes.ts`. The explicit empty-path route renders `NewLandingPageComponent`; the `**` wildcard renders `NotFoundComponent` with HTTP 404 on SSR and `noindex`. New routes go here, and the imported component must be `standalone: true` (Angular 19 default) — there is no module to register it in.
- `add-property` is the only auth-gated route; protected by `authGuard` (`src/app/guards/auth.guard.ts`) which uses Firebase `authStateReady()` and redirects to `/login`.
- Village pages live at `/sate/:slug` (`InfoPageComponent`, slugs in `src/app/utils/villages.ts`); an unknown slug renders the 404 page. The list is duplicated in `scripts/generate-sitemap.js` (`STATIC_PAGES`) and `src/llms.txt` — keep all three in sync. `/info-page` (old in-memory village state), `/contact-us` (page removed) and `/see-the-area` („Vezi zona” removed; its two lands are listings in `/properties`, target of the redirect) redirect with 301 in `server.ts` and via router `redirectTo`.
- The router uses `withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })`: Back/Forward restore the scroll position, new navigations start at the top. Don't add manual `scrollTo(0, 0)` on `NavigationEnd`.
- Firebase Auth is created with `initializeAuth` without the popup/redirect resolver (login is email + password only), so public pages don't load the `apis.google.com` iframe. If popup sign-in is ever added, pass `browserPopupRedirectResolver` to that call and add the punycode domain to Firebase's authorized domains.

### Backend API
- Backend base URL is hardcoded in each service: `https://hai-in-sat-api.lm.r.appspot.com`. Each service file also has a commented-out `http://localhost:8080` variant — toggling between them is the convention here, there is no env-var mechanism. `PhotoAdminService.regenerateThumbnails*` is hardcoded to localhost (admin-only, run locally).
- `proxy.conf.json` rewrites `/home-form` → API root for the dev server only; production hits the API directly.

### State and services
- `DataService` (`src/app/service/data-service.ts`) holds global `BehaviorSubject` signals — used by the footer / `AppComponent` to open Terms and Privacy popups from anywhere. Subscribe-and-reset pattern (set to `true`, consumer resets to `false`).
- `PropertiesStateService` (`src/app/service/properties-state-service/`) uses **Angular signals** for paged property list state and an in-memory cache keyed by `${page}:${size}:${type}`, including each page's pagination totals. The list reacts to URL query changes; absent parameters mean page 0, size 6, type land. Detail-page return links carry the current selection explicitly. Distinct from the BehaviorSubject pattern in `DataService` — match the existing style of the area you're editing.
- Heavy use of PrimeNG components (Dialog, Toast, Button, etc.) with the `Lara` theme preset (configured in `main.ts`). `darkModeSelector: 'none'` disables PrimeNG's auto dark-mode handling.

### SEO
- The official phone is `+40728140628` in links/schema/llms.txt and `0728 140 628` in the UI. Use `stripPhones` after `HtmlTextService.htmlToText`, before truncation, for property SEO descriptions and listing image alt text (including property names used there). Keep owners' phones in visible descriptions and `phoneLink` unchanged.
- Static caching in `app.yaml` and local Express: JS/CSS with a 16-character content hash get one year + `immutable`; `/assets` gets 30 days without `immutable`; other eligible static files get 10 minutes. Keep this order and limit long immutable caching to versioned bundles. Direct HTML paths use SSR.
- Public SSR HTML uses a per-instance LRU cache (100 entries, at most 96 MB in total and 4 MB per page, five minutes from render start). GET requests without query strings are eligible; admin/noindex, 404/503, API-degraded HTML and authenticated requests bypass it with `no-store`. `X-Cache` reports HIT/MISS; original `Date` and increasing `Age` prevent a HIT from restarting browser freshness. When a component catches an error that degrades SSR content, set optional `SSR_RENDER_STATE.cacheable = false`.
- `SeoService` (`src/app/service/seo.service.ts`) is the single point for `<title>`, meta/OG/Twitter tags, canonical link, and JSON-LD injection (`setBreadcrumbs`, `setRealEstateListing`). Page components call `updatePageMeta(...)` and the JSON-LD helpers in `ngOnInit`. Base URL constant is `https://hai-în-sat.ro`.
- Property URLs use `/property/:id/:slug` (with a legacy `/property/:id` fallback). Slug is built by `generateSlug(type, name)` in `src/app/utils/slug.util.ts` — prefix is `casa-de-vanzare` for `PropertyType.HOUSE`, `teren-de-vanzare` otherwise; diacritics are stripped via a fixed map (ă/â→a, î→i, ș→s, ț→t). The same logic is duplicated in `scripts/generate-sitemap.js` — keep them in sync if you change one.

### Photos
- `PhotoService` is a registry of hardcoded asset paths per village (Horezu, Costești, Polovragi, etc.). Adding a village means adding a `getXxxData()` method and a public `getXxxImages()` accessor. Source images are AVIF under `src/assets/`.
- Property images from the API are base64 data URIs (some thumbnails are several MB). Keep them out of the SSR HTML: `PropertyDetailsComponent` loads gallery photos only in the browser (with a 4-slot thumbnail skeleton meanwhile), and data URIs over 150 KB are replaced on the server by `assets/fara-fotografie.svg` (list cards) or dropped (video poster, bound with `[attr.poster]` so null removes it) until hydration. Meta tags and JSON-LD use `assets/og-hai-in-sat.jpg` unless the thumbnail is an http(s) URL. Gallery photos are requested in batches of 3 and de-duplicated client-side.
- `/get-photos`, `/get-by-id` and `/get-all-properties` are excluded from Angular's HTTP transfer cache (`app.config.ts`). Instead `PropertyApiService` stores a light copy in `TransferState`: list pages without thumbnails over 150 KB (the browser shows the copy at once, then fetches the full page if something was left out), details without the thumbnail unless the property has a video. This keeps the HTML small and avoids content blanking after hydration, independent of the API's Cache-Control.
- `PhotoAdminService` is the admin-only API client for replace/delete/regenerate operations.
- YouTube videos are plain lazy `youtube-nocookie.com` iframes (`YoutubePlayerComponent`); there is no IFrame API script in `index.html`.

### Accessibility hooks
- `app.config.ts` merges Romanian labels into PrimeNG's `translation.aria` at startup (`setTranslation` only merges the first level, so always spread the existing `aria`), and a global `pt.galleria` pass-through names the galleria arrows/indicators that PrimeNG 20.4 leaves unnamed. `styles.scss` darkens the `info` and `primary` button tokens and `--p-floatlabel-focus-color` (`:root:root`) for contrast; the Lara emerald primary (`#10b981`) fails 4.5:1 with white text.
- The global `pt` reaches sub-components such as `GalleriaItem` (they declare a `hostName`), but not `p-galleria` itself in the production build (keyed by the minified class name). The fullscreen galleria therefore names its dialog mask with a component-level `[pt]="{ mask: { 'aria-label': … } }"`.
- `p-dialog` has no default `closeAriaLabel`: set `closeAriaLabel="Închide"` on every dialog, or the close button has no accessible name.
- A galleria with `[showIndicators]="true"` needs an `<ng-template #indicator>` (a plain `span`): the default renders a `<button>` inside the focusable indicator tab (axe `nested-interactive`). `p-galleria` has no `onItemChange` output; follow the current photo with `(activeIndexChange)`.
- PrimeNG 20 templates: `p-dataView` reads only `#header` (not `pTemplate="header"`); `p-card` and others need `PrimeTemplate` imported for `pTemplate` — prefer `#header` / `#footer` / `#item` template refs.
- `p-galleria` item templates must be `<ng-template #item>`: with `pTemplate="item"` PrimeNG 20.4 renders the first photo only and the arrows change the index without changing the image.
- Like `p-button`, `p-radioButton` and `p-checkbox` render `autofocus="true"` (even in SSR HTML) unless given `[autofocus]="false"`; the browser then focuses and scrolls to the first one on load.
- Each page must have exactly one `h1` in the SSR DOM (checked by `npm run test:ssr:http`), even when a component renders separate phone/desktop branches.
- `server.ts` sends the CSP as `Content-Security-Policy-Report-Only` with `report-uri /csp-report`; reports are logged as `[CSP]` lines.

### Build pipeline notes
- Karma config is implicit (no `karma.conf.js`) — test bootstrapping uses `tsconfig.spec.json` and `polyfills: ["zone.js", "zone.js/testing"]` from `angular.json`.

## Conventions

- Component style is `scss` (set in `angular.json` schematics). Selector prefix is `app`.
- TypeScript ~5.9; Angular ~20.3; zone.js ~0.15; RxJS ~7.8. Node must satisfy `^22.12.0 || ^24.0.0`; App Engine remains on Node 22.
- Keep TypeScript pinned with a tilde (`~`) so routine updates stay within patch releases (5.9.x). Before changing the TypeScript minor version, verify compatibility with the Angular version used by the project.
- Keep `package-lock.json` and `yarn.lock` in sync. App Engine installs from `yarn.lock`; verify a clean `yarn install --frozen-lockfile --production=true` after dependency updates. Keep npm `overrides` and Yarn `resolutions` identical; the temporary security pins and remaining tooling advisories are explained in `docs/task-132-dependency-audit.md`.
- PrimeNG 20 uses the Lara preset from `@primeuix/themes/lara`, Select instead of Dropdown, and SVG icons with `data-p-icon` selectors. Preserve the existing appearance when updating component APIs.
- PrimeNG 20.4.0 passes an undefined autofocus value to its internal directive unless `p-button` has `[buttonProps]="{ autofocus: false }"`. Keep this explicit on buttons that must not steal focus on page load; do not hide keyboard focus rings as a workaround. Reevaluate after an upstream fix.
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
