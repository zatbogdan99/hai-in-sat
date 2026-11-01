---
id: TASK-3
title: Migrează fotografiile din base64 inline la URL-uri reale
status: To Do
assignee: []
created_date: '2026-06-12 16:06'
updated_date: '2026-11-01'
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

## De ce e MANUAL (decizie owner, 2026-07-27)

NU se ruleaza prin pipeline. Motiv: pasul 4 (migrarea one-shot a celor ~14 proprietati existente) se executa pe **MongoDB de PRODUCTIE**, cu backup al colectiei inainte. Pipeline-ul nu are — si nu trebuie sa aiba — acces la baza de date de productie, iar un esec la jumatatea migrarii ar lasa anunturile fara poze pe site-ul live.

**Daca vrei sa recuperezi partea de cod pentru pipeline:** taie doua task-uri noi — (a) backend: endpoint `GET /photos/{propertyId}/{photoIndex}/{varianta}/{slug}.jpg` + generarea celor 3 variante la upload + `permitAll` in SecurityConfig + DTO cu URL-uri + scriptul de migrare SCRIS si testat pe date locale; (b) frontend: `<img [src]>` + srcset, curatarea TransferState, `seo.service`. RULAREA migrarii pe prod ramane aici, in manual.

**Blocheaza (nu porni aceste AC pana nu e livrat):** poza reală a anunțului în `og:image` și în JSON-LD `image` (TASK-126 și TASK-125 folosesc până atunci `og-hai-in-sat.jpg`), TASK-24 (srcset pentru pozele anunțurilor).

## Stare 2026-11-01: ce s-a atenuat deja în frontend

Simptomul cel mai grav din auditul 2026-06-12 (HTML SSR de zeci de MB) a fost atenuat fără schimbarea backend-ului. Detaliile sunt în CLAUDE.md, secțiunea „Photos”:
- `/get-photos`, `/get-by-id` și `/get-all-properties` sunt excluse din transfer cache-ul HTTP (`app.config.ts`);
- `PropertyApiService` pune în `TransferState` o copie ușoară: listele fără thumbnail-urile de peste 150 KB (`TRANSFER_IMAGE_LIMIT`), detaliile fără thumbnail, cu excepția anunțurilor cu video;
- galeria anunțului se încarcă doar în browser, în loturi de câte 3;
- pe server, `data:URI`-urile de peste 150 KB devin `assets/fara-fotografie.svg` pe carduri, iar posterul video lipsește până la hidratare;
- `og:image` și JSON-LD `image` folosesc `og-hai-in-sat.jpg`, nu base64.

Cifrele din secțiunea următoare (23,6 MB, 42,5 MB, LCP 29,6 s) sunt de dinainte de aceste atenuări și trebuie re-măsurate pe producție înainte de a decide prioritatea. Din sesiunea de lucru domeniul de producție nu e accesibil, deci măsurarea rămâne la owner. Ce NU s-a rezolvat și justifică în continuare task-ul:
- pozele nu au URL-uri, deci nu există în Google Images;
- share-urile de anunțuri nu arată poza imobilului;
- fără cache HTTP pe poze: browserul descarcă base64 prin API la fiecare vizită, iar unele thumbnail-uri au câțiva MB;
- fără `srcset`.

## De ce — fix-ul cu cel mai mare randament din tot auditul 2026-06-12

Backend-ul stochează/servește fotografiile ca **base64 în JSON** (`thumbnail` + `photos`), iar frontend-ul le randează ca `data:URI`. În HTML-ul SSR fiecare poză ajunge de până la **3 ori**:
1. în `<img src="data:image/...">` (galerie),
2. în **TransferState** `<script id="ng-state">` (Angular serializează răspunsul HTTP — pe `/properties` ng-state are **23,3 MB din totalul de 23,6 MB** al paginii!),
3. în JSON-LD `RealEstateListing.image` (~2 MB per anunț).

Dimensiuni măsurate (crawl 2026-06-12): pagini de anunț **3,7–42,5 MB HTML**; `/properties` 23,6 MB. Consecințe simultane:
- **Googlebot indexează doar primii ~15 MB de HTML** → conținutul și schema paginilor mari sunt trunchiate la indexare;
- LCP măsurat: 7,1 s (anunț mobil), **29,6 s** (/properties desktop);
- **zero prezență posibilă în Google Images** (data:URI nu e indexabil ca imagine) — canal real de achiziție pentru imobiliare;
- og:image data:URI → share Facebook/WhatsApp fără imagine (TASK-126);
- crawlerele AI (GPTBot/ClaudeBot/PerplexityBot) abandonează paginile (limite de fetch < Googlebot);
- cost de bandwidth la fiecare vizită, zero caching pentru poze.

## Cum

**Backend (repo `zatbogdan99/hai-in-sat-api`, branch `master` — NU `main`; deploy `--project=hai-in-sat-api`):**

> **DECIS de owner (2026-07-06): endpoint de streaming din MongoDB** (NU Google Cloud Storage). Binarul rămâne în Mongo; backend-ul îl servește ca imagine normală, cu cache agresiv.

1. **Endpoint nou de servire**: `GET /photos/{propertyId}/{photoIndex}/{varianta}/{slug}.jpg` (controller nou `PhotoController` sau în `HaiInSatController.java`) — citește binarul din colecția de poze (vezi `PhotoRepository`/`PhotoDTO`) și îl scrie în răspuns ca bytes. `{varianta}` ∈ `thumb|medium|og`; `{slug}` e doar cosmetic/SEO (numele descriptiv, ex. `teren-cerna-valcea-9600mp-1.jpg`) — serverul se uită doar la id+index+variantă. **Adaugă ruta în `SecurityConfig.java` la `permitAll` pe GET** (azi `/get-all-properties`, `/get-by-id`, `/get-photos` sunt publice pe GET — `SecurityConfig.java:49`, re-verificat 2026-11-01).
2. **Stocare variante în Mongo**: la upload (`/save-property`, `/replace-photos`, `/add-photo`), generează și persistă ca **bytes binari (nu base64)** 3 variante per poză — thumbnail ~400 px, medium ~1200 px, og JPG 1200×630 (doar pentru prima poză/thumbnail e necesar og). `ThumbnailService` există deja pentru redimensionare — extinde-l.
3. **Servire cu headere corecte**: `Content-Type: image/jpeg` (sau ce format alegi), `Cache-Control: public, max-age=31536000, immutable` (conținutul unei variante nu se schimbă; la înlocuirea pozelor se schimbă indexul/numărul lor, iar riscul de cache stale la scara actuală e acceptabil — dacă vrei perfect, include un hash scurt în slug). Suport pentru `HEAD` și răspuns 404 curat la poze inexistente.
4. **DTO**: `thumbnail`/`photos` din `PropertyDTO` devin URL-uri absolute către endpoint (ex. `https://hai-in-sat-api.lm.r.appspot.com/photos/<id>/0/thumb/<slug>.jpg`); expune și `ogImageUrl`. Migrare one-shot a datelor existente: script/endpoint temporar admin care decodează base64 din Mongo → scrie variantele binare → actualizează documentele. **Atenție la memoria instanței F2 (512 MB)** la migrare — procesează poză cu poză, nu toată colecția în memorie.

**Frontend:**
5. `property-details`, `properties` (carduri), `add-property` (preview): `<img [src]="url">` + `srcset` (thumbnail/medium) în loc de data:URI.
6. **TransferState**: copia ușoară din `PropertyApiService` și pragul de 150 KB (`TRANSFER_IMAGE_LIMIT`, plus `SSR_INLINE_IMAGE_LIMIT` din `property-details`) devin inutile când pozele sunt URL-uri. Simplifică-le după migrare, nu înainte.
7. `property-details.component.ts` (`seoImageFor`): `og:image` și JSON-LD `image` folosesc deja orice thumbnail http(s); după migrare primesc automat `ogImageUrl` în loc de `og-hai-in-sat.jpg`.
8. După migrare: regenerare sitemap cu `<image:image>` (TASK-129 pct. 5).

**Notă de migrare a datelor:** există ~14 proprietăți — migrarea one-shot e mică; scrie scriptul idempotent și păstrează backup-ul colecției înainte.

**Trade-off asumat (streaming din Mongo):** fiecare afișare de imagine consumă instanța F2 a backend-ului. La traficul actual e OK; `Cache-Control` de 1 an face ca vizitatorii recurenți și crawlerele să nu re-descarce. Dacă traficul crește semnificativ, mutarea pe GCS rămâne o optimizare ulterioară — URL-urile din DTO ascund implementarea, deci schimbarea nu va atinge frontend-ul.

## Fișiere afectate

- Backend (branch `master`): `src/main/java/com/haiinsat/controller/HaiInSatController.java` (sau `PhotoController` nou), `src/main/java/com/haiinsat/service/ThumbnailService.java`, `src/main/java/com/haiinsat/service/HaiInSatService.java`, `src/main/java/com/haiinsat/dto/PropertyDTO.java` (+`PhotoDTO`), `src/main/java/com/haiinsat/security/SecurityConfig.java` (permitAll GET `/photos/**`), script/endpoint temporar de migrare
- Frontend: `src/app/property-details/*`, `src/app/properties/*` (carduri), `src/app/add-property/*` (preview), `src/app/service/property-form-service/*`, `src/app/dto/property.dto.ts`, `src/app/service/seo.service.ts`, `src/app/app.config.ts` (transfer cache options)
- `scripts/generate-sitemap.js` (image sitemap — după)

## Efort

L (1–2 săptămâni cu tot cu migrare date și verificări). Deblochează: TASK-126, TASK-125 (image), TASK-24 (srcset), TASK-129 pct. 5.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 HTML-ul SSR al celui mai greu anunț scade sub **300 KB** (de la 42,5 MB); `/proprietati` sub 500 KB (probabil deja adevărat după atenuările din 2026-10, de re-măsurat pe producție) — verificat cu `curl -s -o NUL -w "%{size_download}"` + gzip
- [ ] #2 `<script id="ng-state">` NU mai conține niciun `data:image` (verificabil cu grep pe HTML-ul salvat)
- [ ] #3 Toate `<img>` din galerii și carduri au `src`/`srcset` cu URL-uri https publice; pozele răspund 200 cu `Content-Type: image/*` și `Cache-Control` cu `max-age≥31536000`
- [ ] #4 og:image și JSON-LD `image` pe anunțuri sunt URL-urile reale ale pozelor anunțului, nu `og-hai-in-sat.jpg`
- [ ] #5 Toate proprietățile EXISTENTE migrate (zero base64 rămas în răspunsurile API folosite de site); backup-ul datelor făcut înainte de migrare
- [ ] #6 LCP pe pagina de anunț (mobil, lab) sub 4 s la warm — măsurat cu scriptul din `seo-audit-2026-06-12/crawl/measure.py` și comparat cu baseline-ul (7,1 s)
- [ ] #7 Upload-ul de proprietate nouă din `/add-property` produce automat cele 3 variante + nume descriptive; fluxul admin funcționează cap-coadă
- [ ] #8 Nicio regresie funcțională: galeria, thumbnails în listă, preview admin, regenerate-thumbnails — toate funcționale
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Actualizare 2026-11-01 (analiza backlog-ului față de cod): neînceput în backend (pozele sunt tot base64). Am adăugat secțiunea „Stare 2026-11-01” cu atenuările deja livrate în frontend (TransferState ușor, galerie doar în browser, placeholder SSR peste 150 KB, `og-hai-in-sat.jpg`). Cifrele din audit sunt de dinainte de atenuări. Am actualizat și dependențele față de TASK-125/126 (care folosesc acum imaginea JPEG generică), repo-ul backend și calea `/proprietati`.
<!-- SECTION:NOTES:END -->
