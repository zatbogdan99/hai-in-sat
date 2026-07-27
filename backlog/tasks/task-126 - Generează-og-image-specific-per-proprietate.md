---
id: TASK-126
title: 'Generează og:image specific per proprietate'
status: To Do
assignee: []
created_date: '2026-05-07 07:55'
updated_date: '2026-07-27'
labels:
  - seo
  - social
  - images
  - schema
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fiecare pagină de proprietate are `<meta property="og:image" content="https://hai-în-sat.ro/assets/poza_landing1.avif">` în HTML brut. Când cineva partajează un anunț pe Facebook/WhatsApp/Messenger (canalele dominante de descoperire imobiliară în România), se afișează poza generică landing, nu imobilul real. Pierdere directă de CTR pe trafic social.

## Cum — scope REDUS (2026-07-27)

TASK-3 (migrarea pozelor din base64 in URL-uri reale) a fost mutat in `backlog/manual/`. Fara el, `og:image` de pe paginile de ANUNT ramane un `data:URI` base64 si NU poate fi reparat aici. Deci scope-ul acestui task se restrange la ce se poate face acum, complet, fara TASK-3:

**Ce E DEJA facut (verificat 2026-07-06, nu reface):** SSR-ul randeaza deja `og:image` pe server din `property.thumbnail` — `property-details.component.ts:129-134` apeleaza `updatePageMeta` cu `ogImage: prop.thumbnail`, iar `SeoService` seteaza si `og:image` si `twitter:image`. Mecanismul e complet.

**Ce ramane de facut in acest task:**

1. **og:image global e AVIF — asta e problema pe care o rezolvi:** `src/index.html:17` și `:26` folosesc `https://hai-în-sat.ro/assets/poza_landing1.avif` ca og:image/twitter:image. Crawlerele Facebook/WhatsApp NU suportă fiabil AVIF pentru preview — deci azi și share-urile paginilor STATICE pot apărea fără imagine. Fix: generează un **JPG/PNG 1200×630** (`assets/og-default.jpg`) din poza de landing și folosește-l în `index.html` (og:image + twitter:image + og:image:type dacă vrei); același JPG devine fallback-ul de la AC#4 pentru proprietățile fără poze potrivite. AVIF-ul rămâne doar pentru `<link rel="preload">`/afișare, nu pentru OG.

2. **Fallback in `SeoService`:** cand `ogImage` primit e gol / `undefined` / string vid, foloseste URL-ul absolut al noului `og-default.jpg`. Azi, o proprietate fara `thumbnail` ar produce un `og:image` gol.

## Ce NU intra in scope (pana la TASK-3, care e in `backlog/manual/`)

- **`og:image` pe paginile de anunt ramane `data:URI` base64.** Nu incerca sa-l repari: nu exista URL public pentru poze.
- **Verificarea „imaginea are minimum 1200×630"** pentru pozele proprietatilor. Ar cere decodarea base64-ului si citirea dimensiunilor la runtime — efort disproportionat pentru ceva ce TASK-3 rezolva din radacina, prin varianta `og` generata la upload.
- **Compozitul brand-wise** (logo + poza + pret). Task separat, daca se doreste vreodata.

## Fișiere afectate

- `src/assets/og-default.jpg` (NOU — 1200×630, generat din `src/assets/poza_landing1.avif` cu `sharp`, care e deja in devDependencies)
- `src/index.html` (liniile 17 si 26 — `og:image` si `twitter:image`)
- `src/app/service/seo.service.ts` (fallback cand `ogImage` lipseste)
- `src/app/property-details/property-details.component.ts` — **NU se modifica** in acest task

## Efort

S (1-2 ore).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Ruleaza **Facebook Sharing Debugger** (https://developers.facebook.com/tools/debug/) pe `https://hai-în-sat.ro/` si apasa „Scrape Again" — trebuie sa apara imaginea, nu un spatiu gol (azi, AVIF-ul nu e suportat de crawler). Repeta pe o pagina statica, de ex. `/about-us`.

Pe o pagina de ANUNT preview-ul va ramane fara imagine pana la livrarea TASK-3 — asta e asteptat, nu e regresie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exista `src/assets/og-default.jpg`, format JPEG, dimensiuni exact **1200×630**, generat din `src/assets/poza_landing1.avif`. Implementatorul a lipit in `## Implementation Notes` iesirea acestei comenzi, rulata pe fisierul comis: `node -e "require('sharp')('src/assets/og-default.jpg').metadata().then(m => console.log(m.format, m.width, m.height))"` — trebuie sa afiseze `jpeg 1200 630`
- [ ] #2 `src/index.html`: `og:image` (azi linia ~17) si `twitter:image` (azi linia ~26) pointeaza spre `https://hai-în-sat.ro/assets/og-default.jpg` — NU spre `poza_landing1.avif`
- [ ] #3 `git grep "poza_landing1.avif" src/index.html` nu mai returneaza linii de `og:image` / `twitter:image`; fisierul AVIF poate ramane folosit pentru `<link rel="preload">` si pentru afisare
- [ ] #4 `src/app/service/seo.service.ts`: cand `ogImage` primit e `undefined`, `null` sau string gol, se foloseste URL-ul absolut al lui `og-default.jpg` ca fallback — verificabil prin lectura
- [ ] #5 `src/app/property-details/property-details.component.ts` NU e modificat: apelul `updatePageMeta` cu `ogImage: prop.thumbnail` ramane cum e (URL-ul real de poza vine cu TASK-3, care e in `backlog/manual/`)
- [ ] #6 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit rezultatul: `curl -s http://localhost:4000/ | grep -o '<meta property="og:image"[^>]*>'` contine `og-default.jpg`
- [ ] #7 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Mecanism implementat in cod - property-details.component.ts:126-131 cheama seo.updatePageMeta cu ogImage=prop.thumbnail, iar SeoService seteaza og:image + twitter:image, randate de SSR. CAVEAT: prop.thumbnail e adesea data-URL base64, pe care crawlerii social NU il pot incarca - pentru og:image real e nevoie de un URL public. Raman AC#2 (Facebook Debugger, extern) si AC#4 (min 1200x630 + fallback, neimplementat).

Cross-ref: AC nou adaugat reconciliaza referinta din TASK-3 (care listeaza TASK-126 ca deblocat de migrarea pozelor). Mecanismul og:image e gata in cod, dar valoarea reala (poza in share-uri sociale) cere TASK-3 - thumbnail-ul e azi data:URI base64.
Revizuire 2026-07-27 (pregatire pentru pipeline). Scope REDUS, fiindca TASK-3 a fost mutat in `backlog/manual/` (decizie owner): fara URL-uri publice de poze, `og:image` pe anunturi nu poate deveni real. Ce ramane e problema descoperita la verificarea din 2026-07-06 — og:image-ul GLOBAL din `index.html` e AVIF, format pe care crawlerele Facebook/WhatsApp nu-l suporta fiabil, deci si share-urile paginilor STATICE apar azi fara imagine.

AC-uri eliminate: vechiul #6 (URL public real — depinde de TASK-3) si vechiul #4 (verificare „minimum 1200×630" pe pozele proprietatilor — ar cere decodare base64 la runtime; TASK-3 o rezolva din radacina). AC-ul vechi #2 si partea de Facebook Debugger din #7 → mutate in `## Verificare post-deploy (owner)`.

AC-urile #1, #3, #5 din varianta veche erau deja bifate (mecanismul SSR exista) — au fost inlocuite cu criterii pentru munca ramasa.
<!-- SECTION:NOTES:END -->
