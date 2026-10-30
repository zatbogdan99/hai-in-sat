---
id: TASK-143
title: URL-uri în română pentru paginile publice, cu redirect 301 de la cele vechi
status: Done
assignee: []
created_date: '2026-10-30 11:45'
updated_date: '2026-10-30 18:00'
labels:
  - seo
  - frontend
  - ssr
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Căile paginilor publice trec din engleză în română, fără diacritice, pentru consecvență cu un site în limba română și pentru URL-uri lizibile în rezultatele Google și în linkurile distribuite. Fiecare adresă veche duce permanent (301) la cea nouă, fără lanțuri de redirect.

## Decizii owner (2026-10-30)

| Acum | Nou |
|---|---|
| `/properties` | `/proprietati` |
| `/property/:id/:slug` | `/proprietati/:id/:slug` (slugul rămâne, ex. `teren-de-vanzare-…`, `casa-de-vanzare-…`) |
| `/property/:id` (fallback vechi, fără slug) | `/proprietati/:id` |
| `/under-the-mountain` | `/oltenia-de-sub-munte` |
| `/village-of-the-month` | `/satul-lunii` |
| `/homes` | `/gaseste-mi-locul` |
| `/`, `/sate/:slug` | neschimbate |
| `/login`, `/add-property` | **neschimbate**: sunt pagini de administrare noindex, fără beneficiu SEO |

- **Parametrii din adresa listei rămân în engleză:** `?page=&size=&type=land|house`. Se schimbă doar calea, de exemplu `/proprietati?page=1&size=6&type=house`.
- **Fără diacritice în cale.** Domeniul rămâne `hai-în-sat.ro`.

## De ce și cu ce cost (analiza din 2026-10-30)

- **Câștig SEO direct mic:** Google tratează cuvintele din URL ca semnal foarte slab. Câștigul real e lizibilitatea: calea apare în rezultate (`hai-în-sat.ro › proprietati › …`) și în linkurile distribuite. Mai e consecvența, pentru că `/sate/:slug` și slugurile anunțurilor sunt deja în română.
- **Cost:** o mini-migrare. Google transferă semnalele prin 301, dar câteva săptămâni pot apărea fluctuații, până se recrawlează paginile. Momentul e bun, pentru că site-ul are încă trafic mic și puține linkuri externe.
- **Ordine:** se face înaintea TASK-121 (breadcrumbs), TASK-125 (schema anunț), TASK-129 (`lastmod`) și înainte de trimiterea sitemap-ului în Search Console (TASK-MANUAL-2), ca acestea să nu fie refăcute. TASK-131 (rescrierea `server.ts`) trebuie să păstreze redirecturile noi.

## Scope

1. **Rute (`src/app/app.routes.ts`):**
   - rutele noi cu componentele existente;
   - rutele vechi devin `redirectTo` spre cele noi, pentru navigarea în aplicație din HTML vechi aflat în cache;
   - pentru `/property/:id/:slug` → `/proprietati/:id/:slug` se folosește o funcție de redirect (Angular 20) care păstrează parametrii.
2. **Redirecturi 301 pe server (`src/server.ts`)**, înaintea randării SSR, ca cele existente:
   - fiecare cale veche, cu și fără slash final, păstrând query string-ul;
   - `/property/:id/:slug` și `/property/:id` generic, fără apel la API.
   - Redirecturile existente duc direct la adresele noi, fără lanț: `/see-the-area` → `/proprietati`, `/info-page` → `/oltenia-de-sub-munte`. `/about-us` și `/contact-us` → `/` rămân.
3. **Toate referințele interne:**
   - meniul (desktop și telefon), CTA-urile, linkurile de întoarcere la listă, filtrele și paginarea, cardurile, pagina 404, pagina 503 din `server.ts` (`<a href="/properties">`);
   - `canonicalPath`, breadcrumbs JSON-LD, `og:url`;
   - `PropertiesStateService` și orice `router.navigate(['/property', …])`.
4. **Sitemap și fișiere statice:**
   - `scripts/generate-sitemap.js`: `STATIC_PAGES` și calea anunțurilor (`/proprietati/${id}/${slug}`);
   - `src/sitemap.xml`: căile înlocuite determinist. Generatorul cere API-ul live, iar owner-ul îl rulează înainte de deploy;
   - `src/llms.txt`;
   - `src/robots.txt` rămâne neschimbat, pentru că `/login` și `/add-property` nu se schimbă.
5. **Documentație:** `CLAUDE.md` (rutele, redirecturile și secțiunea „Property URLs use `/property/:id/:slug`”) și o notă în TASK-131 despre redirecturile de reaplicat.
6. **Teste:**
   - `scripts/test-ssr-cache.cjs` (rute, cache, 301 de la fiecare cale veche, inclusiv cu query string);
   - `src/ssr-cache.test.ts`, dacă folosește căi;
   - `scripts/test-browser-regression.cjs`;
   - spec-urile care verifică `href`-uri.

## ATENȚIE: nu se redenumesc endpoint-urile API

Căutarea după `properties`/`property` prinde și endpoint-uri ale backendului, care NU se schimbă: `POST /properties-form` (`property-contact.service.ts`), `PATCH /properties/{id}/sort-order` (`property-api.service.ts`), `/save-property`, `/get-all-properties`, `/get-by-id`, `/get-photos`, `/delete-*` etc. Se schimbă doar rutele frontendului (`routerLink`, `router.navigate`, căile din SEO, sitemap și teste).

## În afara scope-ului

- Traducerea parametrilor (`page`, `size`, `type`, `land`, `house`): decizie owner, rămân în engleză.
- Paginile de administrare (`/login`, `/add-property`).
- Schimbarea formatului slugului (`generateSlug` rămâne identic, inclusiv duplicatul din `generate-sitemap.js`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Paginile publice răspund 200 la `/proprietati`, `/proprietati/:id/:slug`, `/oltenia-de-sub-munte`, `/satul-lunii` și `/gaseste-mi-locul`, cu canonical, `og:url` și breadcrumbs JSON-LD pe noile căi.
- [x] #2 Fiecare cale veche (`/properties`, `/property/:id/:slug`, `/property/:id`, `/under-the-mountain`, `/village-of-the-month`, `/homes`), cu și fără slash final, răspunde **301** direct la calea nouă, într-un singur pas. Query string-ul se păstrează, de exemplu `/properties?page=1&size=6&type=house` → `/proprietati?page=1&size=6&type=house`.
- [x] #3 Redirecturile existente duc direct la căile noi, fără lanț: `/see-the-area` → `/proprietati`, `/info-page` → `/oltenia-de-sub-munte`, `/about-us` și `/contact-us` → `/`.
- [x] #4 Navigarea în aplicație spre o cale veche (link vechi, Back) ajunge pe calea nouă, prin `redirectTo` în router.
- [x] #5 În HTML-ul SSR al tuturor rutelor din sitemap nu mai există niciun `href` intern spre o cale veche. Cele 28 de rute (actualizate) au incoming links și cel puțin 5 href-uri interne. `npm run test:ssr:http` verifică asta.
- [x] #6 `scripts/generate-sitemap.js`, `src/sitemap.xml` și `src/llms.txt` folosesc doar căile noi. Numărul de intrări din sitemap e neschimbat.
- [x] #7 Endpoint-urile API (`/properties-form`, `/properties/{id}/sort-order`, `/save-property`, `/get-*`, `/delete-*`) sunt neschimbate. `git diff` pe serviciile API arată doar schimbări de rute de frontend, dacă există.
- [x] #8 `/login` și `/add-property` funcționează ca înainte, iar `robots.txt` e neschimbat.
- [x] #9 `CLAUDE.md` descrie noile căi și redirecturile. TASK-131 are o notă cu redirecturile de reaplicat.
- [x] #10 `npm run build` trece fără eroare de buget. `npm run test:ci`, `npm run test:ssr`, `npm run test:ssr:http` și regresia din browser trec, fără `fdescribe`/`fit`/`xdescribe`/`xit`.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Înainte de build: `npm run generate-sitemap` pe API-ul live.
2. După deploy: `curl -sI https://xn--hai-n-sat-t5a.ro/properties` → `301`, `Location: /proprietati`; la fel pentru un anunț vechi `/property/<id>/<slug>`.
3. În Google Search Console: retrimite `sitemap.xml`, inspectează 2–3 URL-uri noi și urmărește „Pagini”. Vechile adrese apar treptat ca „Pagină cu redirecționare”.
4. Redirecturile vechi se păstrează permanent, minimum un an.
5. În Google Analytics/GTM, notează data schimbării: rapoartele pe pagini vor avea alte căi de la această dată.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit `f6ae6f6`. Înlocuirea s-a făcut doar pe șiruri de rută (după ghilimele: `'/properties'`, `['/property', …]`, `` `/property/${…}` ``); serviciile API sunt neschimbate (0 modificări în `src/app/service`). `server.ts` are un middleware care răspunde 301 pentru căile vechi (cu și fără slash, query string păstrat), înaintea randării. Routerul are `redirectTo` pentru navigarea în aplicație (test unitar nou: `app.routes.spec.ts`). `test:ssr:http`: 11 căi vechi × GET/HEAD → 301 într-un pas, crawlerul verifică acum și că niciun link intern nu duce la o cale veche. `src/sitemap.xml` a fost actualizat determinist (aceleași 28 de intrări); owner-ul rulează `npm run generate-sitemap` înainte de deploy. Notă adăugată în TASK-131. Rămâne în engleză: parametrii `?page=&size=&type=` și `/login`, `/add-property` (decizie owner).

Validare finală 2026-10-30, pe build-ul cu TASK-139…143 (branch `claude/pensive-heisenberg-2m6ix7`): `npm run build` PASS, fără erori de buget; `npm run test:ci` 139/139; `npm run test:ssr` 26/26; `npm run test:ssr:http` PASS (28 de rute din sitemap cu incoming links, 16 anunțuri descoperite, 151 de răspunsuri HTTP, inclusiv 11 redirecturi 301 de la căile vechi). Regresia din browser: 65 PASS, 0 FAIL. Capturi pe 7 dimensiuni (1920, 1440, 1280, 1000, 390, 320, 844×390 × 13 pagini): 0 scroll orizontal, 0 erori JavaScript. Comparația pixel cu pixel cu reperul de dinainte: 0,00% pe homepage, /proprietati și varianta de telefon a /satul-lunii; diferențele rămase sunt cele intenționate. Fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Căile publice sunt în română (/proprietati, /proprietati/:id/:slug, /oltenia-de-sub-munte, /satul-lunii, /gaseste-mi-locul), cu 301 într-un pas de la cele vechi și toate referințele interne actualizate. Fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
