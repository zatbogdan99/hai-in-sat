---
id: TASK-33
title: Construiește layer de conținut/blog pentru autoritate topică
status: To Do
assignee: []
created_date: '2026-05-07 08:04'
updated_date: '2026-07-06'
labels:
  - seo
  - content
  - strategy
  - long-term
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Site-ul nu are blog/articole. Pentru queries long-tail tipice intenției de cumpărare imobiliară rurală în zona Vâlcea (ex: „cum cumperi teren în zona montană", „case bătrânești de renovat Oltenia", „ghid PUG/PUZ Vâlcea cumpărare teren intravilan"), nu există conținut care să prindă acel trafic.

Site-ul deja are paginile statice `/under-the-mountain`, `/village-of-the-month`, `/see-the-area` — un nucleu de „content marketing imobiliar regional" e parțial schițat. Trebuie scalat la ritm constant.

## Cum

1. Creează rutele și componenta:
   - `/articole` (sau `/ghiduri`) — index articole
   - `/articole/:slug` — pagină articol individuală
   - Componente standalone, similar cu `/property/:id/:slug`. Folosește `SeoService` pentru meta + `Article` schema.

2. **Stocare — DECIS de owner (2026-07-06): Markdown în repo** (NU backend/Mongo): `src/assets/articles/*.md`, fiecare cu front matter (`title`, `slug`, `description`, `datePublished`, `dateModified`, `author`, `image`, `villages: []` pentru linking). Parser: `ngx-markdown` (sau `marked` direct, mai mic). Fluxul de publicare = adaugi un fișier .md + regenerezi sitemap + deploy. Un fișier index (`src/assets/articles/index.json` sau citirea front matter-ului la build) alimentează lista din `/articole` și sitemap-ul. ATENȚIE SSR: fetch-ul .md-ului să meargă și pe server (URL absolut sau citire din disc pe server), altfel articolele nu apar în HTML brut — verifică cu `curl` pe HTML-ul SSR.

3. Plan editorial inițial (12 articole / an, 1/lună):
   - „Ghid pentru cumpărarea unui teren extravilan în Oltenia de sub Munte" (legal/PUG/notar)
   - „Cum identifici o casă bătrânească de renovat în satele din Vâlcea"
   - „Profilul satului: Polovragi" (extinderea `/village-of-the-month`)
   - „Costurile reale ale unei case rurale: utilități, drumuri, izolare"
   - „Tradiții și viața în Oltenia de sub Munte" (cultural)
   - „Top 5 sate pentru investiție imobiliară în Vâlcea în 2026"
   - etc.

4. Schema per articol: `@type Article` cu `author`, `datePublished`, `image`, `articleBody`.

5. Linking intern: din articolele despre un sat → proprietățile din acel sat.

## Fișiere afectate

- `src/app/articole/*` + `src/app/articol/*` (index + detaliu — de creat; convenția repo-ului: componentele stau direct în `src/app/<nume>/`, fără folder `components/`)
- `src/app/app.routes.ts` (rute noi — lazy, conform TASK-12)
- `src/assets/articles/*.md` + index-ul lor
- `package.json` (dependența de parser Markdown)
- `scripts/generate-sitemap.js` (include `/articole` + `/articole/:slug`, cu `lastmod` din front matter — sinergie TASK-25)

## Efort

2-3 zile pentru framework articole + 1 articol model. Apoi ~4 ore/articol curat scris (sau outsourced).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Există rute `/articole` și `/articole/:slug` funcționale
- [ ] #2 Cel puțin 3 articole publicate, fiecare cu minim 800 cuvinte și schema `Article` validă (Google Rich Results Test)
- [ ] #3 Sitemap include `/articole` și toate articolele individuale
- [ ] #4 Există linking intern: minim 2 link-uri din articole spre `/properties` (sau direct spre proprietăți relevante)
- [ ] #5 Definit ritm editorial documentat (1 articol / lună sau alt cadență consensuală)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. Nu exista rute /articole sau /articole/:slug in app.routes.ts, nici componente de blog/articol. Feature mare, neinceput.

Cross-ref: NU e duplicat cu noul TASK-32 (pagini de sat /sate) - TASK-33 = blog/articole (/articole), TASK-32 = hub-uri de localitate. Tipuri de continut diferite; amandoua au nevoie de TASK-23 (link-uri interne crawlabile). TASK-32 e prioritizat mai sus in auditul nou.
<!-- SECTION:NOTES:END -->
