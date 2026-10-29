---
id: TASK-134
title: Șterge pagina /about-us și redirecționează-o 301 către prima pagină
status: Done
assignee: []
created_date: '2026-10-29 22:20'
updated_date: '2026-10-29 23:59'
labels:
  - frontend
  - ssr
  - seo
  - cleanup
dependencies:
  - TASK-133
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Pagina „Despre noi” (`/about-us`) este veche și se scoate complet din site: componenta, ruta, assetul propriu, sitemap-ul, `llms.txt` și testele. Adresa veche (indexată de Google, prezentă în sitemap) duce permanent la prima pagină.

## Decizii owner (2026-10-29)

- **Redirect 301 `/about-us` → `/`**, după tiparul existent pentru `/contact-us`: handler în `server.ts` și `redirectTo` în router. Prima pagină are secțiunea „Cu ce ne ocupăm”, cel mai apropiat conținut.
- **Conținutul nu se mută nicăieri.** Textele paginii („Despre noi”, „Revitalizăm viața la țară”, „Misiunea noastră”) se șterg odată cu ea.

## Context

- După TASK-133, footerul nu mai leagă `/about-us`, deci pagina este orfană. TASK-133 a adăugat în `scripts/test-ssr-cache.cjs` o excepție temporară de incoming links doar pentru `/about-us`, cu un comentariu care trimite la acest task. Excepția se scoate aici.
- Implementarea pornește din `master` după merge-ul TASK-133.
- `gsap` și iconițele Font Awesome importate de componentă sunt folosite și în alte componente: dependențele din `package.json` rămân.

## Scope

**De șters:**
- `src/app/about-us/`: `about-us.component.ts`, `.html`, `.scss`, `.spec.ts`.
- `src/assets/contact.avif`, folosit doar de această pagină (template, SCSS și `ogImage`). Înainte de ștergere, confirmă cu `git grep -n "contact.avif"` că nu are alte utilizări. `assets/logo.avif` rămâne: e folosit și în alte locuri.

**De modificat:**
- `src/app/app.routes.ts`:
  - scoate importul `AboutUsComponent`;
  - ruta `{ path: 'about-us', component: AboutUsComponent }` devine `{ path: 'about-us', redirectTo: '', pathMatch: 'full' }`, cu un comentariu scurt în română, ca la `contact-us`.
- `src/server.ts` — adaugă `server.get(['/about-us', '/about-us/'], …)` cu `res.redirect(301, '/')`, lângă redirectul `/contact-us`, cu comentariu în română. Redirectul trebuie să ruleze înaintea randării SSR, ca cel existent.
- `scripts/generate-sitemap.js` — scoate `{ path: '/about-us', … }` din `STATIC_PAGES`.
- `src/sitemap.xml` — scoate intrarea `/about-us`. Fișierul e generat, dar regenerarea cere API-ul live. Scoate doar blocul `<url>` respectiv și nu modifica restul fișierului.
- `src/llms.txt` — scoate rândul `- [Despre noi](https://hai-în-sat.ro/about-us)`.
- `scripts/test-ssr-cache.cjs`:
  - scoate excepția de incoming links pentru `/about-us` adăugată în TASK-133;
  - testul de cache HIT/MISS pe o pagină statică (`/about-us`, în jurul liniilor 179-182) se mută pe o altă pagină statică publică, de exemplu `/under-the-mountain`, păstrând aceeași secvență HEAD/GET și aceleași așteptări MISS/HIT;
  - `/about-us` se scoate din lista rutelor cu verificare de telefon (în jurul liniei 258);
  - adaugă verificarea că `/about-us` și `/about-us/` răspund `301` cu `Location: /`, după modelul `/contact-us`.
- `src/app/app.component.spec.ts` — dacă după TASK-133 mai există referințe la `/about-us`, le scoți.
- `CLAUDE.md` — în secțiunea „Bootstrap and routing”, rândul despre redirecturile 301 (`/info-page`, `/contact-us`, `/see-the-area`) include și `/about-us` → `/`.
- `backlog/docs/verificare-locala-ssr.md` — exemplul `curl -s http://localhost:4000/about-us | grep -o "<h1" | wc -l` folosește altă pagină publică.

## În afara scope-ului

- Mutarea textelor din pagina veche în alte pagini (decizie owner: nu).
- Task-urile din `backlog/completed/` și `wont-do/` care pomenesc `/about-us` rămân neschimbate: sunt istorice.
- Eliminarea dependențelor `gsap` sau Font Awesome, folosite în alte componente.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Directorul `src/app/about-us/` nu mai există. `git grep -n "AboutUsComponent\|app-about-us"` nu găsește nimic în afara `backlog/`.
- [x] #2 `src/assets/contact.avif` este șters, iar `git grep -n "contact.avif" -- src` nu găsește nimic.
- [x] #3 `app.routes.ts` are `{ path: 'about-us', redirectTo: '', pathMatch: 'full' }`. Navigarea client-side spre `/about-us` ajunge pe prima pagină.
- [x] #4 `server.ts` răspunde la `GET /about-us` și `GET /about-us/` cu `301` și `Location: /`, fără randare SSR. `scripts/test-ssr-cache.cjs` verifică ambele adrese.
- [x] #5 `scripts/generate-sitemap.js`, `src/sitemap.xml` și `src/llms.txt` nu mai conțin `/about-us`. Restul intrărilor din `sitemap.xml` sunt identice cu cele dinainte.
- [x] #6 `scripts/test-ssr-cache.cjs` nu mai are excepția de incoming links pentru `/about-us` și nicio altă excepție. Toate rutele din sitemap au cel puțin un incoming link și cel puțin 5 href-uri interne distincte. Testul de cache HIT/MISS pentru o pagină statică rulează pe altă pagină publică, cu aceleași așteptări.
- [x] #7 `CLAUDE.md` și `backlog/docs/verificare-locala-ssr.md` nu mai prezintă `/about-us` ca pagină existentă. `CLAUDE.md` menționează redirectul `/about-us` → `/`.
- [x] #8 `package.json`, `package-lock.json` și `yarn.lock` sunt neschimbate.
- [x] #9 `npm run build`, `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec, fără teste `fdescribe`/`fit`/`xdescribe`/`xit`. Rezumatul `test:ssr:http` (rute din sitemap, incoming links, anunțuri descoperite) este lipit în `## Implementation Notes`.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. `curl -sI https://xn--hai-n-sat-t5a.ro/about-us` → `301`, `Location: /`.
2. După `npm run generate-sitemap` pe API-ul live, `src/sitemap.xml` nu conține `/about-us`. Retrimite sitemap-ul în Google Search Console și Bing Webmaster.
3. În Google Search Console, la „Pagini”, `/about-us` apare în timp ca „Pagină cu redirecționare”.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit `59021c0`. Șterse: `src/app/about-us/`, `src/assets/contact.avif` și stilul global `.despreNoiStyle`, rămas fără folosință. `/about-us` și `/about-us/` → 301 `Location: /` (handler în `server.ts` și `redirectTo` în router), verificat în `test:ssr:http` și cu curl pe serverul SSR local. Sitemap: 28 de rute (înainte 29), toate cu incoming link, fără excepții. Testul de cache HIT/MISS rulează pe `/under-the-mountain`. `package.json`, `package-lock.json` și `yarn.lock` neschimbate (`npm ci` rescrisese `yarn.lock` local; modificarea a fost anulată, nu a fost comisă).

Validare finală 2026-10-29 pe build-ul final (branch `claude/pensive-heisenberg-2m6ix7`): `npm run build` PASS, fără erori de buget (info-page sub pragul de avertisment, under-the-mountain 8,92 KB, properties 9,32 KB neschimbat); `npm run test:ci` 133/133; `npm run test:ssr` 26/26; `npm run test:ssr:http` PASS: „redirect, static assets, SEO phones, 28 sitemap headings and incoming links, 16 discovered properties; 128 HTTP responses checked”, minimum 5 href-uri interne distincte pe fiecare rută. Regresia din browser (`scripts/test-browser-regression.cjs`, 1440/390/320 px + telefon orizontal + layout sate la 1280/1440) 55 PASS, 0 FAIL. Capturi înainte/după: 91 de pagini (7 ecrane: 1920, 1440, 1280, 1000, 390, 320, 844×390 × 13 pagini), 0 scroll orizontal, 0 erori JavaScript. Verificări suplimentare în browser real: 8/8 PASS. Fără merge și fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pagina /about-us a fost ștearsă complet, cu redirect 301 spre prima pagină, sitemap/llms.txt/teste/documentație actualizate. Fără merge și fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
