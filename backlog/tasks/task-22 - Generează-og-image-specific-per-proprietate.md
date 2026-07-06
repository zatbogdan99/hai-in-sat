---
id: TASK-22
title: 'Generează og:image specific per proprietate'
status: To Do
assignee: []
created_date: '2026-05-07 07:55'
updated_date: '2026-07-06'
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

## Cum

Două variante:

1. **Tactic (rapid, 30 min)**: în componenta de detaliu proprietate (probabil `src/app/components/property-details` sau similar), apelează `SeoService.updatePageMeta()` cu prima imagine a proprietății. `SeoService.ts` deja există și gestionează `og:image`. Doar trebuie ca `PropertyDetailComponent.ngOnInit()` să facă `seoService.updatePageMeta({...ogImage: property.photos[0]})`. Funcționează pe Facebook (care face JS render parțial) și pe Google.

2. **Strategic (SSR — deja în loc):** SSR-ul randează deja `og:image` pe server din `property.thumbnail` (mecanism implementat și RE-VERIFICAT 2026-07-06: `property-details.component.ts:129-134` apelează `updatePageMeta` cu `ogImage: prop.thumbnail`). Ce rămâne de fapt: (a) valoarea să fie un **URL public real**, nu `data:URI` base64 — vine din TASK-3 (DECIS: endpoint de streaming din Mongo; folosește varianta `og` 1200×630 — `.../photos/<id>/0/og/<slug>.jpg`); (b) opțional, un compozit brand-wise (logo + prima poză + preț) — generarea variantei `og` la upload e deja parte din TASK-3 pct. 2.

3. **PROBLEMĂ NOUĂ descoperită la verificare (2026-07-06) — og:image global e AVIF:** `src/index.html:17` și `:26` folosesc `https://hai-în-sat.ro/assets/poza_landing1.avif` ca og:image/twitter:image. Crawlerele Facebook/WhatsApp NU suportă fiabil AVIF pentru preview — deci azi și share-urile paginilor STATICE pot apărea fără imagine. Fix: generează un **JPG/PNG 1200×630** (`assets/og-default.jpg`) din poza de landing și folosește-l în `index.html` (og:image + twitter:image + og:image:type dacă vrei); același JPG devine fallback-ul de la AC#4 pentru proprietățile fără poze potrivite. AVIF-ul rămâne doar pentru `<link rel="preload">`/afișare, nu pentru OG.

## Fișiere afectate

- `src/index.html` (og:image/twitter:image global → JPG 1200×630 nou în `src/assets/`)
- `src/app/service/seo.service.ts` (interfața `updatePageMeta` are deja `ogImage` — verificat; adaugă doar logică de fallback dacă e cazul)
- `src/app/property-details/property-details.component.ts` (folosește `ogImageUrl`/varianta og din TASK-3 în loc de `prop.thumbnail`)
- (acoperit de TASK-3) backend: varianta og 1200×630 servită de endpoint-ul de poze

## Efort

30 min varianta tactic; 4-8 ore combinată cu SSR pentru servire corectă din HTML brut.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pe pagina de detaliu proprietate, după mount, `document.querySelector('meta[property="og:image"]').getAttribute('content')` este prima poză a proprietății, NU `poza_landing1.avif`
- [ ] #2 Facebook Sharing Debugger pe URL de proprietate afișează prima poză a proprietății, nu landing-ul
- [x] #3 `twitter:image` este și el actualizat similar la `og:image`
- [ ] #4 Imaginea folosită are minimum 1200x630px (recomandat OG); fallback la landing dacă fotografia sursă e mai mică
- [x] #5 HTML-ul brut SSR al paginii de proprietate (fără JS) conține deja `og:image` specific (SSR existent, mecanism implementat)
- [ ] #6 og:image si twitter:image folosesc un URL public real al pozei (nu data:URI base64) - depinde de TASK-3 (migrare poze base64 -> URL-uri reale)
- [ ] #7 og:image/twitter:image globale din `index.html` (paginile statice) sunt JPG sau PNG 1200×630 (NU AVIF — crawlerele social nu-l suportă fiabil); Facebook Sharing Debugger pe homepage afișează imaginea
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Mecanism implementat in cod - property-details.component.ts:126-131 cheama seo.updatePageMeta cu ogImage=prop.thumbnail, iar SeoService seteaza og:image + twitter:image, randate de SSR. CAVEAT: prop.thumbnail e adesea data-URL base64, pe care crawlerii social NU il pot incarca - pentru og:image real e nevoie de un URL public. Raman AC#2 (Facebook Debugger, extern) si AC#4 (min 1200x630 + fallback, neimplementat).

Cross-ref: AC nou adaugat reconciliaza referinta din TASK-3 (care listeaza TASK-22 ca deblocat de migrarea pozelor). Mecanismul og:image e gata in cod, dar valoarea reala (poza in share-uri sociale) cere TASK-3 - thumbnail-ul e azi data:URI base64.
<!-- SECTION:NOTES:END -->
