---
id: TASK-48
title: Migrează fotografiile din base64 inline la URL-uri reale
status: To Do
assignee: []
created_date: '2026-06-12 16:06'
updated_date: '2026-06-12 16:06'
labels:
  - seo
  - critical
  - performance
  - images
  - backend
  - architecture
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/performance.md
  - ../../../../seo-audit-2026-06-12/findings/visual.md
  - ../../../../seo-audit-2026-06-12/FULL-AUDIT-REPORT.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce — fix-ul cu cel mai mare randament din tot auditul 2026-06-12

Backend-ul stochează/servește fotografiile ca **base64 în JSON** (`thumbnail` + `photos`), iar frontend-ul le randează ca `data:URI`. În HTML-ul SSR fiecare poză ajunge de până la **3 ori**:
1. în `<img src="data:image/...">` (galerie),
2. în **TransferState** `<script id="ng-state">` (Angular serializează răspunsul HTTP — pe `/properties` ng-state are **23,3 MB din totalul de 23,6 MB** al paginii!),
3. în JSON-LD `RealEstateListing.image` (~2 MB per anunț).

Dimensiuni măsurate (crawl 2026-06-12): pagini de anunț **3,7–42,5 MB HTML**; `/properties` 23,6 MB. Consecințe simultane:
- **Googlebot indexează doar primii ~15 MB de HTML** → conținutul și schema paginilor mari sunt trunchiate la indexare;
- LCP măsurat: 7,1 s (anunț mobil), **29,6 s** (/properties desktop);
- **zero prezență posibilă în Google Images** (data:URI nu e indexabil ca imagine) — canal real de achiziție pentru imobiliare;
- og:image data:URI → share Facebook/WhatsApp fără imagine (TASK-5);
- crawlerele AI (GPTBot/ClaudeBot/PerplexityBot) abandonează paginile (limite de fetch < Googlebot);
- cost de bandwidth la fiecare vizită, zero caching pentru poze.

## Cum

**Backend (repo `java.hai-in-sat/hai-in-sat/`, deploy `--project=hai-in-sat-api`):**
1. Stocare poze în **Google Cloud Storage** (bucket nou sau cel existent folosit la video — vezi task-46 completat, care deja detectează video din GCS bucket) SAU endpoint de streaming `GET /photos/{propertyId}/{n}` care servește binarul din MongoDB.
2. La upload (`/save-property`, `/replace-photos`, `/add-photo`): generează 3 variante — thumbnail ~400 px, medium ~1200 px, og-image JPG 1200×630 — cu nume descriptive (`teren-cerna-valcea-9600mp-1.jpg`).
3. Servire cu `Cache-Control: public, max-age=31536000, immutable` și `Content-Type` corect.
4. DTO: `thumbnail`/`photos` devin URL-uri; expune și `ogImageUrl`. Pentru tranziție, păstrează temporar câmpurile vechi sau fă migrare one-shot a datelor existente (script care decodează base64 din Mongo → upload GCS → update document).

**Frontend:**
5. `property-details`, `properties` (carduri), `add-property` (preview): `<img [src]="url">` + `srcset` (thumbnail/medium) în loc de data:URI.
6. **TransferState**: verifică că răspunsurile mari nu mai cară base64; dacă rămân câmpuri grele tranzitorii, exclude-le cu `withHttpTransferCacheOptions` (filter pe URL) sau curăță DTO-ul pe server.
7. `seo.service.ts`: `setRealEstateListing` cu `image` = URL real (TASK-10), `updatePageMeta` cu `ogImage` = `ogImageUrl` (TASK-5).
8. După migrare: regenerare sitemap cu `<image:image>` (TASK-13 pct. 5).

**Notă de migrare a datelor:** există ~14 proprietăți — migrarea one-shot e mică; scrie scriptul idempotent și păstrează backup-ul colecției înainte.

## Fișiere afectate

- Backend: controller foto + serviciu GCS + DTO (`PropertyDTO`), script de migrare date
- Frontend: `src/app/property-details/*`, `src/app/properties/*` (carduri), `src/app/service/property-form-service/*`, `src/app/service/seo.service.ts`, `src/app/app.config.ts` (transfer cache options)
- `scripts/generate-sitemap.js` (image sitemap — după)

## Efort

L (1–2 săptămâni cu tot cu migrare date și verificări). Deblochează: TASK-5, TASK-10 (image), TASK-57 (srcset), TASK-13 pct. 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 HTML-ul SSR al celui mai greu anunț scade sub **300 KB** (de la 42,5 MB); `/properties` sub 500 KB — verificat cu `curl -s -o NUL -w "%{size_download}"` + gzip
- [ ] #2 `<script id="ng-state">` NU mai conține niciun `data:image` (verificabil cu grep pe HTML-ul salvat)
- [ ] #3 Toate `<img>` din galerii și carduri au `src`/`srcset` cu URL-uri https publice; pozele răspund 200 cu `Content-Type: image/*` și `Cache-Control` cu `max-age≥31536000`
- [ ] #4 og:image și JSON-LD `image` pe anunțuri sunt URL-uri reale (sincronizat cu TASK-5 AC#6 și TASK-10 AC#5)
- [ ] #5 Toate proprietățile EXISTENTE migrate (zero base64 rămas în răspunsurile API folosite de site); backup-ul datelor făcut înainte de migrare
- [ ] #6 LCP pe pagina de anunț (mobil, lab) sub 4 s la warm — măsurat cu scriptul din `seo-audit-2026-06-12/crawl/measure.py` și comparat cu baseline-ul (7,1 s)
- [ ] #7 Upload-ul de proprietate nouă din `/add-property` produce automat cele 3 variante + nume descriptive; fluxul admin funcționează cap-coadă
- [ ] #8 Nicio regresie funcțională: galeria, thumbnails în listă, preview admin, regenerate-thumbnails — toate funcționale
<!-- AC:END -->
