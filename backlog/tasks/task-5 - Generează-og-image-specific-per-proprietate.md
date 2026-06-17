---
id: TASK-5
title: 'Generează og:image specific per proprietate'
status: To Do
assignee: []
created_date: '2026-05-07 07:55'
updated_date: '2026-06-17 15:04'
labels:
  - seo
  - social
  - images
  - schema
dependencies:
  - TASK-2
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

2. **Strategic (combinat cu TASK-2 SSR)**: la SSR, randează `og:image` direct pe server din `property.photos[0]`. Pentru OG image consistentă brand-wise, generează un compozit 1200x630 cu logo + prima poză + preț în footer (worker pe Cloud Run sau pe upload via `PhotoAdminService`).

## Fișiere afectate

- `src/app/service/seo.service.ts` (verifică interfața `updatePageMeta` — adaugă `ogImage` dacă nu există)
- `src/app/components/property-details/property-details.component.ts` (sau echivalent — apel `updatePageMeta` în `ngOnInit`)
- (opțional) backend Java: nou endpoint `/properties/<id>/og-image` care returnează imagine compozită cached

## Efort

30 min varianta tactic; 4-8 ore combinată cu SSR pentru servire corectă din HTML brut.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pe pagina de detaliu proprietate, după mount, `document.querySelector('meta[property="og:image"]').getAttribute('content')` este prima poză a proprietății, NU `poza_landing1.avif`
- [ ] #2 Facebook Sharing Debugger pe URL de proprietate afișează prima poză a proprietății, nu landing-ul
- [x] #3 `twitter:image` este și el actualizat similar la `og:image`
- [ ] #4 Imaginea folosită are minimum 1200x630px (recomandat OG); fallback la landing dacă fotografia sursă e mai mică
- [x] #5 După implementarea TASK-2 SSR: HTML brut al paginii de proprietate (fără JS) conține deja `og:image` specific
- [ ] #6 og:image si twitter:image folosesc un URL public real al pozei (nu data:URI base64) - depinde de TASK-48 (migrare poze base64 -> URL-uri reale)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Mecanism implementat in cod - property-details.component.ts:126-131 cheama seo.updatePageMeta cu ogImage=prop.thumbnail, iar SeoService seteaza og:image + twitter:image, randate de SSR. CAVEAT: prop.thumbnail e adesea data-URL base64, pe care crawlerii social NU il pot incarca - pentru og:image real e nevoie de un URL public. Raman AC#2 (Facebook Debugger, extern) si AC#4 (min 1200x630 + fallback, neimplementat).

Cross-ref: AC nou adaugat reconciliaza referinta din TASK-48 (care listeaza TASK-5 ca deblocat de migrarea pozelor). Mecanismul og:image e gata in cod, dar valoarea reala (poza in share-uri sociale) cere TASK-48 - thumbnail-ul e azi data:URI base64.
<!-- SECTION:NOTES:END -->
