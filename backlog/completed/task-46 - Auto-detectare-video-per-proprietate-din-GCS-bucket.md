---
id: TASK-46
title: Auto-detectare video per proprietate din GCS bucket
status: Done
assignee: []
created_date: '2026-05-15 20:12'
updated_date: '2026-05-15 20:55'
labels:
  - backend
  - frontend
  - video
  - gcs
dependencies:
  - TASK-43
  - TASK-45
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Vrem ca pagina `/property/:id/:slug` să afișeze automat layout-ul cu video atunci când proprietatea are un fișier video în GCS, și layout-ul cu poze când nu are. **Sursa de adevăr: bucket-ul GCS** — admin urcă/șterge un video și site-ul se ajustează singur, fără sincronizare manuală a unui flag în MongoDB.

Acest task implementează **doar mecanismul de detecție + propagare a `videoUrl` în PropertyDTO**. Layout-urile efective (mobile cu video / desktop cu video) sunt în TASK-43 și TASK-45.

## Arhitectură propusă

### Convenție de path în GCS

Fișierul video pentru o proprietate trăiește la path-ul predictibil:

```
gs://{bucket}/videos/{propertyId}.mp4
```

Nu există tabel de mapare; ID-ul proprietății derivă path-ul.

### Backend (Spring Boot)

1. Adaugă bean `Storage` (Google Cloud Storage Java SDK) inițializat cu credențialele de service account deja folosite pentru photos.
2. Serviciu nou `VideoStorageService` cu metodă `Optional<String> findVideoUrl(String propertyId)`:
   - Construiește path-ul `videos/{propertyId}.mp4`
   - `storage.get(bucketName, path)` — dacă obiectul există → returnează URL public (sau signed URL cu TTL ~1h)
   - Dacă nu există → `Optional.empty()`
3. **Cache in-memory (Caffeine)** cu cheie `propertyId`, TTL 10 min, mărime max ~1000 entries. Evită hammering pe GCS la fiecare request.
4. La `GET /properties/{id}`: după ce încarci property-ul din Mongo, completează `videoUrl` în DTO cu rezultatul `findVideoUrl(id).orElse(null)`.
5. Endpoint admin pentru invalidare cache: `POST /admin/cache/video/invalidate/{propertyId}` (auth admin required). Apelat de UI-ul de admin după upload/delete video.

### Frontend (Angular)

1. Adaugă `videoUrl?: string | null` pe `PropertyDTO` (`src/app/dto/property.dto.ts`).
2. În `PropertyDetailsComponent`, expune `propertyVideoUrl: string | null = null;` și setează-l din response.
3. Template: switch între layout cu video (TASK-43/45) și fără video (TASK-42/44) pe baza `*ngIf="propertyVideoUrl"`.
4. **Curăță logica veche hardcodată** `*ngIf="propertyType === 0"` pentru Milostea — devine inutilă (Milostea va avea video în bucket).
5. SSR-safe: deoarece `videoUrl` vine în DTO-ul randat server-side, nu există flicker între versiuni la hidratare.

### Admin UI (opțional, scope separat)

Formular admin pentru upload/delete video per proprietate:
- `POST /admin/property/{id}/video` (multipart)
- `DELETE /admin/property/{id}/video`

După acțiune, backend-ul invalidează automat cache-ul. Dacă admin-ul urcă/șterge direct din Cloud Console, cache-ul se invalidează singur după TTL (max 10 min latență — acceptabil).

## SEO bonus

Când `videoUrl` există, completează în `SeoService`:
- JSON-LD `VideoObject` cu `contentUrl`, `thumbnailUrl` (poate fi thumbnail-ul proprietății), `uploadDate`
- Meta tag `og:video` și `og:video:type`

Creează vizibilitate suplimentară în Google Video și pe social.

## Fișiere afectate (estimare)

**Backend (`java.hai-in-sat/hai-in-sat`)**:
- `pom.xml` — adăugare dependency `google-cloud-storage`, `caffeine`
- `src/main/java/.../service/VideoStorageService.java` — nou
- `src/main/java/.../service/PropertyService.java` — adaugă call către VideoStorageService
- `src/main/java/.../dto/PropertyDTO.java` — câmp `videoUrl: String`
- `src/main/java/.../controller/AdminCacheController.java` — endpoint nou de invalidare
- `src/main/resources/application.yml` — config bucket name (poate fi același bucket ca pentru photos cu prefix `videos/`)

**Frontend (`hai-in-sat/hai-in-sat`)**:
- `src/app/dto/property.dto.ts` — câmp `videoUrl?: string | null`
- `src/app/property-details/property-details.component.ts` — citește `propertyVideoUrl` din DTO
- `src/app/property-details/property-details.component.html` — switch template pe baza `videoUrl` (după ce TASK-43/45 sunt implementate)
- `src/app/service/seo.service.ts` — extinde `setRealEstateListing` cu `VideoObject` JSON-LD când există video

## Trade-off principal

**Un round-trip extra la GCS per property-fetch**. Mitigat de cache Caffeine (TTL 10 min). În worst case (cache miss), latență ~50-150ms pe lookup metadata GCS — acceptabil pentru un endpoint care oricum face și un query MongoDB.

Alternativă: adăugăm flag `hasVideo: boolean` în Mongo și admin-ul îl actualizează la upload/delete. Latență zero, dar drift dacă admin-ul șterge direct din Cloud Console. **Recomandare: bucket-ca-sursă-de-adevăr** (alinează cu intenția exprimată a user-ului).

## Decizii de luat înainte de implementare

1. **URL signed sau public?** Bucket public e mai simplu (no signing logic, no expiry), dar lipsește hotlink protection. Signed URL (TTL 1h) este standard pentru content premium dar înseamnă re-fetch la refresh după expiry. **Recomandare**: începem cu public, la fel ca pentru poze.
2. **Format video**: `.mp4` doar, sau și `.webm`/`.hls`? **Recomandare**: începem cu `.mp4` (universal support); HLS pentru streaming progresiv vine separat când avem video-uri lungi.
3. **Bucket separat sau același cu photos?** **Recomandare**: același bucket, prefix `videos/` — minimizează config-ul.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Backend `GET /properties/{id}` returnează câmpul `videoUrl: string|null` bazat pe existența fișierului `videos/{id}.mp4` în GCS
- [x] #2 `VideoStorageService` folosește cache Caffeine cu TTL 10 min, max ~1000 entries
- [ ] #3 Endpoint `POST /admin/cache/video/invalidate/{propertyId}` (auth admin) invalidează cache-ul pe demand
- [x] #4 `PropertyDTO` (frontend + backend) include câmpul `videoUrl?: string | null`
- [x] #5 `PropertyDetailsComponent` populează `propertyVideoUrl` din DTO și îl expune template-ului
- [x] #6 Template-ul folosește `*ngIf="propertyVideoUrl"` pentru a alege între layout cu video (TASK-43/45) și fără video (TASK-42/44)
- [x] #7 Logica hardcodată `*ngIf="propertyType === 0"` pentru Milostea este eliminată
- [ ] #8 `SeoService` adaugă `VideoObject` JSON-LD și `og:video` meta când `videoUrl` există
- [x] #9 SSR-safe: pagina randată server-side conține deja varianta corectă, fără flicker la hidratare
- [x] #10 Pentru o proprietate FĂRĂ fișier video în bucket, pagina arată identic cu acum (TASK-42/44)
- [x] #11 După upload în bucket prin endpoint admin sau Cloud Console + invalidare cache, refresh-ul paginii afișează layout-ul cu video
- [x] #12 După delete din bucket + invalidare cache, refresh-ul paginii revine la layout-ul fără video
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementat varianta 1 (cache simplu, fără endpoint de invalidare). Backend: pom.xml + google-cloud-storage 2.40.0 + caffeine 3.1.8. VideoStorageService nou: Storage bean GCS inițializat în @PostConstruct via getApplicationDefault (ADC), checkExists prin storage.get(bucket, videos/{id}.mp4) wrapped în Caffeine Cache<String,Boolean> TTL 10 min max 1000. URL returnat: https://storage.googleapis.com/hai-in-sat-assets/videos/{id}.mp4 (bucket public). PropertyDTO.videoUrl marcat @Transient (nu se persistă în Mongo). HaiInSatService.getPropertyById populează videoUrl. application.properties: gcs.video-bucket=hai-in-sat-assets, gcs.video-prefix=videos/. Frontend: PropertyDTO.videoUrl?: string|null, propertyVideoUrl + videoSlide în component, switch template *ngIf=propertyVideoUrl între branch-uri TASK-42/44 (fără) și TASK-43/45 (cu). Mvn clean compile OK; npm run build:browser + server OK. NEIMPLEMENTAT in scope: AC#3 endpoint /admin/cache/video/invalidate (variantă scoasă explicit la cererea user-ului — invalidare prin TTL max 10 min); AC#8 SeoService VideoObject + og:video (lăsat pentru un task ulterior dacă apare necesitatea SEO video).
<!-- SECTION:FINAL_SUMMARY:END -->
