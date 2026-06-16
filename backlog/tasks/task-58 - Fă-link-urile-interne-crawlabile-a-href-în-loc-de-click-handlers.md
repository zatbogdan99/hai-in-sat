---
id: TASK-58
title: Fă link-urile interne crawlabile — <a href> în loc de click handlers
status: To Do
assignee: []
created_date: '2026-06-12 16:16'
updated_date: '2026-06-12 16:16'
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
- orice pagină nouă (TASK-55 pagini de sat, TASK-19 articole) pornește fără susținere internă;
- accesibilitate: fără href nu funcționează „open in new tab", middle-click, etc.

## Cum

1. **Inventariere**: grep în template-uri după `(click)=".*navigate` și `routerLink` — listează toate elementele de navigare.
2. **Cardurile de proprietate** din `/properties` (+ orice listă): învelește cardul în `<a [routerLink]="['/property', p.id, slug(p)]">` (routerLink pe `<a>` randează `href` în SSR) sau adaugă link explicit pe titlul cardului. Click handler-ul existent poate rămâne pentru UX, dar elementul trebuie să fie `<a href>`.
3. **Meniu/navigație/footer**: toate intrările → `<a routerLink>`; verifică și logo-ul (→ `/`).
4. **Link-uri contextuale**: din anunț → `/properties` („Înapoi la listă" să fie `<a>`) și → pagina satului (după TASK-55); din paginile statice → `/properties`.
5. **Footer sitewide**: bloc de link-uri (Proprietăți, Sate, Despre noi, Contact) — cel mai ieftin mod de a da fiecărei pagini link-uri interne.
6. Verificare: re-rulează crawler-ul de audit — coloana internal_links trebuie să devină >0 peste tot.

Notă tehnică: `routerLink` pe elemente non-`<a>` NU produce href — folosiți întotdeauna `<a>` pentru navigare.

## Fișiere afectate

- Template-urile: carduri properties, meniu/navbar, footer, property-details, paginile statice

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
