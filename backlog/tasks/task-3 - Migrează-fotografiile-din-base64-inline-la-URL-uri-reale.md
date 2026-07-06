---
id: TASK-3
title: Migrează fotografiile din base64 inline la URL-uri reale
status: To Do
assignee: []
created_date: '2026-06-12 16:06'
updated_date: '2026-07-06'
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
- og:image data:URI → share Facebook/WhatsApp fără imagine (TASK-22);
- crawlerele AI (GPTBot/ClaudeBot/PerplexityBot) abandonează paginile (limite de fetch < Googlebot);
- cost de bandwidth la fiecare vizită, zero caching pentru poze.

## Cum

**Backend (repo `java.hai-in-sat/hai-in-sat/`, branch `master` — NU `main`; deploy `--project=hai-in-sat-api`):**

> **DECIS de owner (2026-07-06): endpoint de streaming din MongoDB** (NU Google Cloud Storage). Binarul rămâne în Mongo; backend-ul îl servește ca imagine normală, cu cache agresiv.

1. **Endpoint nou de servire**: `GET /photos/{propertyId}/{photoIndex}/{varianta}/{slug}.jpg` (controller nou `PhotoController` sau în `HaiInSatController.java`) — citește binarul din colecția de poze (vezi `PhotoRepository`/`PhotoDTO`) și îl scrie în răspuns ca bytes. `{varianta}` ∈ `thumb|medium|og`; `{slug}` e doar cosmetic/SEO (numele descriptiv, ex. `teren-cerna-valcea-9600mp-1.jpg`) — serverul se uită doar la id+index+variantă. **Adaugă ruta în `SecurityConfig.java` la `permitAll` pe GET** (azi doar `/get-all-properties`, `/get-by-id`, `/get-photos` sunt publice — linia ~49).
2. **Stocare variante în Mongo**: la upload (`/save-property`, `/replace-photos`, `/add-photo`), generează și persistă ca **bytes binari (nu base64)** 3 variante per poză — thumbnail ~400 px, medium ~1200 px, og JPG 1200×630 (doar pentru prima poză/thumbnail e necesar og). `ThumbnailService` există deja pentru redimensionare — extinde-l.
3. **Servire cu headere corecte**: `Content-Type: image/jpeg` (sau ce format alegi), `Cache-Control: public, max-age=31536000, immutable` (conținutul unei variante nu se schimbă; la înlocuirea pozelor se schimbă indexul/numărul lor, iar riscul de cache stale la scara actuală e acceptabil — dacă vrei perfect, include un hash scurt în slug). Suport pentru `HEAD` și răspuns 404 curat la poze inexistente.
4. **DTO**: `thumbnail`/`photos` din `PropertyDTO` devin URL-uri absolute către endpoint (ex. `https://hai-in-sat-api.lm.r.appspot.com/photos/<id>/0/thumb/<slug>.jpg`); expune și `ogImageUrl`. Migrare one-shot a datelor existente: script/endpoint temporar admin care decodează base64 din Mongo → scrie variantele binare → actualizează documentele. **Atenție la memoria instanței F2 (512 MB)** la migrare — procesează poză cu poză, nu toată colecția în memorie.

**Frontend:**
5. `property-details`, `properties` (carduri), `add-property` (preview): `<img [src]="url">` + `srcset` (thumbnail/medium) în loc de data:URI.
6. **TransferState**: verifică că răspunsurile mari nu mai cară base64; dacă rămân câmpuri grele tranzitorii, exclude-le cu `withHttpTransferCacheOptions` (filter pe URL) sau curăță DTO-ul pe server.
7. `seo.service.ts`: `setRealEstateListing` cu `image` = URL real (TASK-29), `updatePageMeta` cu `ogImage` = `ogImageUrl` (TASK-22).
8. După migrare: regenerare sitemap cu `<image:image>` (TASK-25 pct. 5).

**Notă de migrare a datelor:** există ~14 proprietăți — migrarea one-shot e mică; scrie scriptul idempotent și păstrează backup-ul colecției înainte.

**Trade-off asumat (streaming din Mongo):** fiecare afișare de imagine consumă instanța F2 a backend-ului. La traficul actual e OK; `Cache-Control` de 1 an face ca vizitatorii recurenți și crawlerele să nu re-descarce. Dacă traficul crește semnificativ, mutarea pe GCS rămâne o optimizare ulterioară — URL-urile din DTO ascund implementarea, deci schimbarea nu va atinge frontend-ul.

## Fișiere afectate

- Backend (branch `master`): `src/main/java/com/haiinsat/controller/HaiInSatController.java` (sau `PhotoController` nou), `src/main/java/com/haiinsat/service/ThumbnailService.java`, `src/main/java/com/haiinsat/service/HaiInSatService.java`, `src/main/java/com/haiinsat/dto/PropertyDTO.java` (+`PhotoDTO`), `src/main/java/com/haiinsat/security/SecurityConfig.java` (permitAll GET `/photos/**`), script/endpoint temporar de migrare
- Frontend: `src/app/property-details/*`, `src/app/properties/*` (carduri), `src/app/add-property/*` (preview), `src/app/service/property-form-service/*`, `src/app/dto/property.dto.ts`, `src/app/service/seo.service.ts`, `src/app/app.config.ts` (transfer cache options)
- `scripts/generate-sitemap.js` (image sitemap — după)

## Efort

L (1–2 săptămâni cu tot cu migrare date și verificări). Deblochează: TASK-22, TASK-29 (image), TASK-24 (srcset), TASK-25 pct. 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 HTML-ul SSR al celui mai greu anunț scade sub **300 KB** (de la 42,5 MB); `/properties` sub 500 KB — verificat cu `curl -s -o NUL -w "%{size_download}"` + gzip
- [ ] #2 `<script id="ng-state">` NU mai conține niciun `data:image` (verificabil cu grep pe HTML-ul salvat)
- [ ] #3 Toate `<img>` din galerii și carduri au `src`/`srcset` cu URL-uri https publice; pozele răspund 200 cu `Content-Type: image/*` și `Cache-Control` cu `max-age≥31536000`
- [ ] #4 og:image și JSON-LD `image` pe anunțuri sunt URL-uri reale (sincronizat cu TASK-22 AC#6 și TASK-29 AC#5)
- [ ] #5 Toate proprietățile EXISTENTE migrate (zero base64 rămas în răspunsurile API folosite de site); backup-ul datelor făcut înainte de migrare
- [ ] #6 LCP pe pagina de anunț (mobil, lab) sub 4 s la warm — măsurat cu scriptul din `seo-audit-2026-06-12/crawl/measure.py` și comparat cu baseline-ul (7,1 s)
- [ ] #7 Upload-ul de proprietate nouă din `/add-property` produce automat cele 3 variante + nume descriptive; fluxul admin funcționează cap-coadă
- [ ] #8 Nicio regresie funcțională: galeria, thumbnails în listă, preview admin, regenerate-thumbnails — toate funcționale
<!-- AC:END -->
