---
id: TASK-120
title: Fă link-urile interne crawlabile — <a href> în loc de click handlers
status: In Progress
assignee:
  - '@codex'
created_date: '2026-06-12 16:16'
updated_date: '2026-10-02 07:55'
labels:
  - seo
  - technical
  - internal-linking
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/content.md
  - ../../../../seo-audit-2026-06-12/findings/sitemap.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Crawl-ul auditului 2026-06-12 a găsit **internal_link_count = 0 pe TOATE paginile** (coloana din `crawl/inventory.csv`): în HTML-ul SSR nu există practic niciun `<a href>` intern — navigarea (carduri de proprietăți, meniu, butoane) se face prin click handlers (`(click)="router.navigate(...)"`) care NU produc atribut `href`.

Consecințe:
- Googlebot descoperă paginile DOAR din sitemap, fără context de ancoră și fără flux de PageRank intern;
- anchor text-ul intern (semnal de relevanță: „teren de vânzare în Cerna") e inexistent;
- orice pagină nouă (TASK-32 pagini de sat, TASK-33 articole) pornește fără susținere internă;
- accesibilitate: fără href nu funcționează „open in new tab", middle-click, etc.

## Cum — inventar COMPLET al punctelor de navigare (verificat în cod, 2026-07-06)

Singurul `<a routerLink>` real de pe tot site-ul e „Înapoi la pagina principală" din `login.component.html:72`. Restul:

1. **Meniul principal** (`app.component.html:9-21`): 4 `p-chip (click)` (Oltenia de sub Munte, Sate, Proprietăți, Găsește-mi locul) + aceleași 4 în popover-ul mobil. → fiecare chip devine (sau se învelește în) `<a routerLink>`. Logo-ul (linia 5, `(click)="goToLandingPage()"`) → `<a routerLink="/">`. ATENȚIE: meniul NU leagă deloc `/about-us`, `/contact-us`, `/see-the-area` — azi sunt pagini aproape orfane; le acoperă blocul de footer (pct. 5).
2. **Cardurile de proprietate** (`properties.component.html:186` și `:200` — butonul „Detalii" cu `(click)="viewPropertyDetails(property)"`): învelește cardul (sau titlul + butonul) în `<a [routerLink]="['/property', property.id, slug]">` cu `[queryParams]` pentru page/size/type (logica de queryParams există în `viewPropertyDetails`, properties.component.ts:309-321 — mut-o în template ca binding). Anchor text = numele anunțului.
3. **Homepage** (`new-landing-page.component.html:9`): CTA „Completează formularul" `(click)="goToHomeFormPage()"` → `<a routerLink="/homes">` stilizat ca buton.
4. **Link-uri contextuale**: din anunt → `/properties` („Înapoi la listă" — azi `goBackToProperties()` cu click; fa-l `<a>` cu queryParams) si din paginile statice → `/properties`.

   **Fara link spre pagina satului** — TASK-32 (paginile `/sate`) e in `backlog/manual/`, deci acele rute nu exista. Nu inventa link-uri spre ele.
5. **Footer sitewide NOU**: bloc de link-uri `<a routerLink>` cu EXACT aceste destinatii — `/properties` („Proprietăți"), `/about-us` („Despre noi"), `/contact-us` („Contact"), `/see-the-area` („Vezi zona"), `/under-the-mountain` („Oltenia de sub Munte"), `/village-of-the-month` („Satul lunii"), `/homes` („Găsește-mi locul") — în `app.component.html`, lângă chips-urile legale — cel mai ieftin mod de a da fiecărei pagini link-uri interne și de a dez-orfaniza about-us/contact-us/see-the-area. (Chips-urile legale deschid dialoguri — pot rămâne așa.)
6. **Bonus găsit la verificare**: în `contact-us.component.html`, link-urile sociale de pe desktop au `href="#"` (liniile ~15, 29, 40) — înlocuiește cu URL-urile reale (există în varianta mobilă a aceleiași pagini) + `target="_blank" rel="noopener"`.
7. Verificare: re-rulează crawler-ul de audit — coloana internal_links trebuie să devină >0 peste tot.

Notă tehnică: `routerLink` pe elemente non-`<a>` NU produce href — folosiți întotdeauna `<a>` pentru navigare. `p-chip` nu acceptă să fie `<a>` — învelește-l sau înlocuiește-l cu un element `<a>` stilizat identic.

## Fișiere afectate

- `src/app/app.component.html` (meniu + logo + footer nou), `src/app/properties/properties.component.html` (+ .ts pentru slug în template), `src/app/new-landing-page/new-landing-page.component.html`, `src/app/property-details/property-details.component.html` („Înapoi la listă"), `src/app/contact-us/contact-us.component.html` (href="#")

## Efort

M (1 zi — multe atingeri mici de template).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. Middle-click (sau Ctrl+click) pe un card de proprietate si pe o intrare de meniu — trebuie sa se deschida in tab nou. E dovada ca sunt link-uri reale, nu handlere.
2. Click normal pe aceleasi elemente — navigarea trebuie sa ramana SPA, fara reincarcarea completa a paginii (urmareste sa nu clipeasca).
3. Dupa 2-4 saptamani, in Search Console → Links → Internal links: numarul de link-uri interne per pagina trebuie sa creasca de la ~0.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `app.component.html`: cele 4 intrari de meniu (Oltenia de sub Munte, Sate, Proprietăți, Găsește-mi locul, azi `p-chip` cu `(click)` la liniile 9-21) sunt acum elemente `<a routerLink="...">` — sau `p-chip`-uri INVELITE in `<a routerLink>`. Acelasi tratament pentru cele 4 duplicate din popover-ul mobil
- [x] #2 Logo-ul (azi linia 5, `(click)="goToLandingPage()"`) e `<a routerLink="/">`
- [x] #3 `properties.component.html`: fiecare card de proprietate este (sau contine) `<a [routerLink]="['/property', property.id, slug]">` cu `[queryParams]` pentru `page`/`size`/`type`. Logica de queryParams din `viewPropertyDetails` (`properties.component.ts:309-321`) e mutata in template ca binding. Anchor text-ul e numele anuntului, nu „Detalii"
- [x] #4 `new-landing-page.component.html` (azi linia 9): CTA-ul „Completează formularul" e `<a routerLink="/homes">` stilizat ca buton
- [x] #5 `property-details.component.html`: „Înapoi la listă" e `<a routerLink="/properties">` cu queryParams, nu `(click)="goBackToProperties()"`
- [x] #6 `app.component.html` are un bloc NOU de link-uri in footer, cu exact aceste 7 destinatii: `/properties`, `/about-us`, `/contact-us`, `/see-the-area`, `/under-the-mountain`, `/village-of-the-month`, `/homes` — toate `<a routerLink>`
- [x] #7 `contact-us.component.html`: cele trei `href="#"` de pe link-urile sociale desktop (azi liniile ~15, ~29, ~40) sunt inlocuite cu URL-urile reale (le gasesti in varianta mobila a aceleiasi pagini si in `sameAs` din `index.html`), cu `target="_blank" rel="noopener"`
- [x] #8 Toate navigarile folosesc `routerLink` pe elemente `<a>`, NU `href` simplu — altfel navigarea inceteaza sa fie SPA. `routerLink` pe elemente non-`<a>` nu produce `href`, deci nu se accepta
- [x] #9 Chips-urile legale care deschid dialoguri (Termeni, Politica) raman cu `(click)` — nu sunt navigare
- [x] #10 NU se adauga link-uri spre rute inexistente: `/sate` si `/articole` nu exista (TASK-32 si TASK-33 sunt in `backlog/manual/`)
- [x] #11 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes`, pentru FIECARE ruta din sitemap, rezultatul: `curl -s http://localhost:4000/<ruta> | grep -o 'href="/[^\"]*"' | sort -u | wc -l` — minimum **5** link-uri interne unice pe fiecare pagina (azi: 0)
- [x] #12 Din aceeasi iesire trebuie sa reiasa ca fiecare ruta publica din sitemap primeste cel putin un link de pe alta pagina — footer-ul sitewide garanteaza asta pentru toate cele 7 destinatii
- [x] #13 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Salvează referințe vizuale desktop/mobil pentru meniu, homepage, listă, paginare și detalii.
2. Transformă navigarea din scope în ancore RouterLink fără schimbarea stilurilor; adaugă footerul cu cele 7 destinații și corectează URL-urile sociale desktop.
3. Pentru AC12 (link primit de fiecare anunț), fă filtrele și paginarea listei crawlabile, păstrând parametrii și aspectul. Răspunde la queryParamMap și la navigare înapoi/înainte pe aceeași componentă.
4. Adaugă teste DOM RouterLink, parametri/fallback și graf SSR cu minimum 5 linkuri interne/rută plus anunțuri descoperite prin paginare, folosind API fixture locală realistă.
5. Build și suite Angular/SSR; verificare browser click normal/tab nou, meniu mobil, filtre, întoarcere la listă și comparații responsive.
6. Review independent, remediază blocantele, finalizează backlog și PR. Fără pipeline/deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Modificari:
1. Referintele la paginile de sat (`/sate`) au fost scoase — TASK-32 e in `backlog/manual/`, iar un agent care le urmeaza ar genera link-uri spre rute inexistente (404-uri interne, exact opusul scopului).
2. Lista de destinatii din footer era deschisa („+ Sate după TASK-32") → fixata la 7 destinatii concrete, ceea ce rezolva si problema paginilor orfane semnalata la punctul 1 din descriere (meniul nu leaga deloc `/about-us`, `/contact-us`, `/see-the-area`).
3. AC-urile #1 si #6 cereau re-rularea crawler-ului de audit pe productie → inlocuite cu numaratoarea de `href` prin protocolul SSR local.
4. AC-urile #4 (middle-click) si #5 (navigare SPA fara reload) cer browser real → mutate in `## Verificare post-deploy (owner)`, iar in AC a ramas cerinta structurala care le garanteaza: `<a>` + `routerLink`.

Inventarul curent confirmă că filtrele și paginatorul sunt click-only. Conversia lor în linkuri este necesară pentru AC12: anunțurile din paginile ulterioare și categoria Case trebuie să fie descoperibile pornind de la linkurile site-ului, nu doar prin URL-uri introduse manual în teste. Se păstrează aspectul existent și se testează schimbarea query params în aceeași componentă.

Implementare și validare 2026-10-02, direct, fără dev-pipeline:
- Logo, meniu desktop/mobil, CTA homepage, titluri/Detalii și ambele reveniri la listă folosesc ancore RouterLink. Footer nou cu exact cele 7 destinații cerute; Contact mobil existent este tot ancoră. URL-urile sociale desktop sunt corectate. Dialogurile legale rămân acțiuni.
- Filtrele și paginarea sunt linkuri reale, cu page/size/type. URL-ul listei fără query revine determinist la pagina 0, size 6, terenuri (inclusiv browser Back); întoarcerea din detalii păstrează selecția explicită/fallback. Cache-ul păstrează totalurile separat per page/size/type; schimbarea query anulează requestul foreground anterior, iar prefetch-ul capturează cheia corectă.
- Build producție browser + SSR: PASS. Avertismente SCSS: info-page 9.10 kB, properties 8.90 kB, under-the-mountain 9.35 kB; toate sub limita de eroare 10 kB.
- npm run test:ci: 106/106 PASS în Chrome Headless; npm run test:ssr: 26/26 PASS.
- Protocol SSR local: npm run build, apoi SSR_CACHE_TEST_PORT=4122 npm run test:ssr:http (în PowerShell: $env:SSR_CACHE_TEST_PORT='4122'; npm run test:ssr:http). PASS, 109 răspunsuri HTTP. API fixture locală, fără cereri către API producție; verifică GET/HEAD/304, cache, statusuri, SEO, H1 și linkuri.
- Numărătoarea de mai jos este echivalentul cerinței curl/href, limitată mai strict la ancore interne reale <a href>, parsate din HTML-ul SSR. Toate cele 24 de rute au cel puțin 5 href unice și primesc link de la altă pagină. Crawl-ul urmărește exclusiv filtrele/paginarea descoperite în HTML și ajunge la toate cele 16 anunțuri.

| Ruta din sitemap | Href interne unice | Exemplu de pagină care trimite link |
| --- | ---: | --- |
| `/` | 8 | `/about-us` |
| `/properties` | 10 | `/` |
| `/under-the-mountain` | 8 | `/` |
| `/village-of-the-month` | 8 | `/` |
| `/homes` | 8 | `/` |
| `/see-the-area` | 8 | `/` |
| `/about-us` | 8 | `/` |
| `/contact-us` | 8 | `/` |
| `/property/f6c006e4-092a-44d9-b194-cd3425327c5f/teren-de-vanzare-teren-cerna` | 9 | `/properties?page=0&size=6&type=land` |
| `/property/48dab29f-43e0-4d0f-b3c1-8f7bfbc5f0d3/teren-de-vanzare-teren-racovita` | 9 | `/properties?page=0&size=6&type=land` |
| `/property/f7c9ce67-f71a-4abe-b477-2785c0d0b880/teren-de-vanzare-teren-baia-de-fier` | 9 | `/properties?page=0&size=6&type=land` |
| `/property/f0530ddd-4201-49f8-99d4-c76c5b2ee1de/teren-de-vanzare-teren-baia-de-fier` | 9 | `/properties?page=0&size=6&type=land` |
| `/property/0f59588f-2e62-4160-ac96-fe88bee4f19d/teren-de-vanzare-teren-polovragi` | 9 | `/properties?page=0&size=6&type=land` |
| `/property/fa222b08-b5a7-49af-8e55-68828522bd4b/teren-de-vanzare-teren-vaideeni` | 9 | `/properties?page=0&size=6&type=land` |
| `/property/8641e495-162f-41a1-8847-09f6031cd676/teren-de-vanzare-teren-polovragi` | 9 | `/properties?page=1&size=6&type=land` |
| `/property/8812ad88-028e-46dc-a127-348437baef28/teren-de-vanzare-teren-baia-de-fier` | 9 | `/properties?page=1&size=6&type=land` |
| `/property/126495e7-a342-4868-8783-cc6f0a0a0dd7/teren-de-vanzare-teren-horezu-valcea` | 9 | `/properties?page=1&size=6&type=land` |
| `/property/d32d0ad2-9f30-433a-b7b0-d03d3b85fa67/teren-de-vanzare-teren-romani-balanesti-horezu-valcea` | 9 | `/properties?page=1&size=6&type=land` |
| `/property/eea36016-6c8d-497f-94f7-2cefe2e4a20d/teren-de-vanzare-teren-romani-taco-valcea` | 9 | `/properties?page=1&size=6&type=land` |
| `/property/239d1876-0db7-4941-be29-ec822d54d56a/teren-de-vanzare-teren-vaideeni-zona-lunca-valcea` | 9 | `/properties?page=1&size=6&type=land` |
| `/property/ce1b374c-c585-4174-8076-90767eb3ae0c/teren-de-vanzare-teren-vaideeni-in-vai-valcea` | 9 | `/properties?page=2&size=6&type=land` |
| `/property/2850d7ba-af11-4412-a331-b6592586453d/teren-de-vanzare-teren-varful-roman-valcea` | 9 | `/properties?page=2&size=6&type=land` |
| `/property/a8b5c304-aaac-42c5-9560-2ed6bf2ecccc/teren-de-vanzare-teren-de-vanzare-romani-intersectie-cu-dn67-valcea` | 9 | `/properties?page=2&size=6&type=land` |
| `/property/d5662eb2-0936-403e-852d-ca8c0578b447/casa-de-vanzare-casa-in-horezu` | 9 | `/properties?page=0&size=6&type=house` |

Pagini de listare descoperite:
- `/properties?page=0&size=6&type=land`: 18 linkuri interne unice.
- `/properties?page=0&size=6&type=house`: 11 linkuri interne unice.
- `/properties?page=1&size=6&type=land`: 18 linkuri interne unice.
- `/properties?page=2&size=6&type=land`: 15 linkuri interne unice.
Review independent: constatările despre Back fără query, lățimile chipurilor mobile, focusul mobil, paddingul Detalii și fontul paginatorului au fost corectate și reverificate. Verdict final: fără probleme blocante rămase. git diff --check: PASS.

Limită de verificare: CUA nu poate inițializa browserul (`failed to write kernel assets: The system cannot find the path specified. (os error 3)`), inclusiv după reset/reîncercare. Nu s-au putut face capturi comparative sau verificarea vizuală efectivă desktop/mobil. Media queries existente au fost păstrate și CSS-ul elementelor convertite a fost verificat la review; aceasta nu înlocuiește verificarea vizuală. PR-ul rămâne draft până la această verificare. Fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Navigarea publică folosește linkuri RouterLink crawlabile, inclusiv filtre și paginare. Build + 106 teste Angular + 26 teste SSR + 109 răspunsuri HTTP trecute; toate cele 24 de rute au linkuri interne și incoming links, toate cele 16 anunțuri sunt descoperite. Review independent fără blocante. Verificarea vizuală desktop/mobil rămâne deschisă: CUA indisponibil; PR draft, fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Verificare vizuală comparativă desktop/mobil după restabilirea instrumentului de browser (CUA indisponibil la 2026-10-02).
<!-- DOD:END -->
