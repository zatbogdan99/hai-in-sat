---
id: TASK-23
title: Fă link-urile interne crawlabile — <a href> în loc de click handlers
status: To Do
assignee: []
created_date: '2026-06-12 16:16'
updated_date: '2026-07-06'
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
4. **Link-uri contextuale**: din anunț → `/properties` („Înapoi la listă" — azi `goBackToProperties()` cu click; fă-l `<a>` cu queryParams) și → pagina satului (după TASK-32); din paginile statice → `/properties`.
5. **Footer sitewide NOU**: bloc de link-uri `<a routerLink>` (Proprietăți, Despre noi, Contact, Vezi zona, + Sate după TASK-32) în `app.component.html`, lângă chips-urile legale — cel mai ieftin mod de a da fiecărei pagini link-uri interne și de a dez-orfaniza about-us/contact-us/see-the-area. (Chips-urile legale deschid dialoguri — pot rămâne așa.)
6. **Bonus găsit la verificare**: în `contact-us.component.html`, link-urile sociale de pe desktop au `href="#"` (liniile ~15, 29, 40) — înlocuiește cu URL-urile reale (există în varianta mobilă a aceleiași pagini) + `target="_blank" rel="noopener"`.
7. Verificare: re-rulează crawler-ul de audit — coloana internal_links trebuie să devină >0 peste tot.

Notă tehnică: `routerLink` pe elemente non-`<a>` NU produce href — folosiți întotdeauna `<a>` pentru navigare. `p-chip` nu acceptă să fie `<a>` — învelește-l sau înlocuiește-l cu un element `<a>` stilizat identic.

## Fișiere afectate

- `src/app/app.component.html` (meniu + logo + footer nou), `src/app/properties/properties.component.html` (+ .ts pentru slug în template), `src/app/new-landing-page/new-landing-page.component.html`, `src/app/property-details/property-details.component.html` („Înapoi la listă"), `src/app/contact-us/contact-us.component.html` (href="#")

## Efort

M (1 zi — multe atingeri mici de template).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Re-crawl (crawler-ul din `seo-audit-2026-06-12/crawl/crawl.py`): fiecare pagină din sitemap are ≥5 link-uri interne `<a href>` în HTML-ul brut SSR (azi: 0)
- [ ] #2 Fiecare card de proprietate din /properties este (sau conține) un `<a href="/property/...">` cu anchor text descriptiv (numele anunțului)
- [ ] #3 Meniul principal și footer-ul folosesc `<a routerLink>` cu href vizibil în HTML brut pentru toate rutele publice
- [ ] #4 Middle-click / „Deschide în tab nou" funcționează pe carduri și meniu (dovada că sunt link-uri reale)
- [ ] #5 Navigarea client-side rămâne SPA (fără full reload la click normal) — routerLink, nu href simplu
- [ ] #6 Nicio pagină publică din sitemap nu rămâne orfană: fiecare primește minimum un link intern de pe altă pagină (verificabil din câmpul internal_links din inventory.json)
<!-- AC:END -->
