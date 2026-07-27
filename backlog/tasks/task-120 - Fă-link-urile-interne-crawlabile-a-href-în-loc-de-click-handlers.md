---
id: TASK-120
title: Fă link-urile interne crawlabile — <a href> în loc de click handlers
status: To Do
assignee: []
created_date: '2026-06-12 16:16'
updated_date: '2026-07-27'
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
- [ ] #1 `app.component.html`: cele 4 intrari de meniu (Oltenia de sub Munte, Sate, Proprietăți, Găsește-mi locul, azi `p-chip` cu `(click)` la liniile 9-21) sunt acum elemente `<a routerLink="...">` — sau `p-chip`-uri INVELITE in `<a routerLink>`. Acelasi tratament pentru cele 4 duplicate din popover-ul mobil
- [ ] #2 Logo-ul (azi linia 5, `(click)="goToLandingPage()"`) e `<a routerLink="/">`
- [ ] #3 `properties.component.html`: fiecare card de proprietate este (sau contine) `<a [routerLink]="['/property', property.id, slug]">` cu `[queryParams]` pentru `page`/`size`/`type`. Logica de queryParams din `viewPropertyDetails` (`properties.component.ts:309-321`) e mutata in template ca binding. Anchor text-ul e numele anuntului, nu „Detalii"
- [ ] #4 `new-landing-page.component.html` (azi linia 9): CTA-ul „Completează formularul" e `<a routerLink="/homes">` stilizat ca buton
- [ ] #5 `property-details.component.html`: „Înapoi la listă" e `<a routerLink="/properties">` cu queryParams, nu `(click)="goBackToProperties()"`
- [ ] #6 `app.component.html` are un bloc NOU de link-uri in footer, cu exact aceste 7 destinatii: `/properties`, `/about-us`, `/contact-us`, `/see-the-area`, `/under-the-mountain`, `/village-of-the-month`, `/homes` — toate `<a routerLink>`
- [ ] #7 `contact-us.component.html`: cele trei `href="#"` de pe link-urile sociale desktop (azi liniile ~15, ~29, ~40) sunt inlocuite cu URL-urile reale (le gasesti in varianta mobila a aceleiasi pagini si in `sameAs` din `index.html`), cu `target="_blank" rel="noopener"`
- [ ] #8 Toate navigarile folosesc `routerLink` pe elemente `<a>`, NU `href` simplu — altfel navigarea inceteaza sa fie SPA. `routerLink` pe elemente non-`<a>` nu produce `href`, deci nu se accepta
- [ ] #9 Chips-urile legale care deschid dialoguri (Termeni, Politica) raman cu `(click)` — nu sunt navigare
- [ ] #10 NU se adauga link-uri spre rute inexistente: `/sate` si `/articole` nu exista (TASK-32 si TASK-33 sunt in `backlog/manual/`)
- [ ] #11 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes`, pentru FIECARE ruta din sitemap, rezultatul: `curl -s http://localhost:4000/<ruta> | grep -o 'href="/[^\"]*"' | sort -u | wc -l` — minimum **5** link-uri interne unice pe fiecare pagina (azi: 0)
- [ ] #12 Din aceeasi iesire trebuie sa reiasa ca fiecare ruta publica din sitemap primeste cel putin un link de pe alta pagina — footer-ul sitewide garanteaza asta pentru toate cele 7 destinatii
- [ ] #13 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Modificari:
1. Referintele la paginile de sat (`/sate`) au fost scoase — TASK-32 e in `backlog/manual/`, iar un agent care le urmeaza ar genera link-uri spre rute inexistente (404-uri interne, exact opusul scopului).
2. Lista de destinatii din footer era deschisa („+ Sate după TASK-32") → fixata la 7 destinatii concrete, ceea ce rezolva si problema paginilor orfane semnalata la punctul 1 din descriere (meniul nu leaga deloc `/about-us`, `/contact-us`, `/see-the-area`).
3. AC-urile #1 si #6 cereau re-rularea crawler-ului de audit pe productie → inlocuite cu numaratoarea de `href` prin protocolul SSR local.
4. AC-urile #4 (middle-click) si #5 (navigare SPA fara reload) cer browser real → mutate in `## Verificare post-deploy (owner)`, iar in AC a ramas cerinta structurala care le garanteaza: `<a>` + `routerLink`.
<!-- SECTION:NOTES:END -->
