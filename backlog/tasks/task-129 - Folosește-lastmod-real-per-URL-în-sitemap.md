---
id: TASK-129
title: Folosește lastmod real per URL în sitemap
status: To Do
assignee: []
created_date: '2026-05-07 08:00'
updated_date: '2026-11-01'
labels:
  - seo
  - sitemap
  - crawl-budget
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`sitemap.xml` curent (28 URL-uri) nu are `lastmod` real: generatorul pune `today` pe orice intrare (`generate-sitemap.js:89` → `:105` pentru paginile statice și `:112` pentru anunțuri). Re-verificat 2026-11-01: 21 de intrări au `2026-07-28` (ultima rulare), iar cele 7 pagini de sat au `2026-10-28` (adăugate ulterior). Datele nu spun nimic despre momentul în care s-a schimbat fiecare pagină. Google folosește `lastmod` pentru a aloca crawl budget — când e identic peste tot, semnalul e ignorat. Cu `lastmod` real per pagină, Google re-crawlează exact paginile care s-au schimbat.

Impact: după ce listezi o proprietate nouă sau actualizezi descrierea, Googlebot revine în ore (vs. zile sau săptămâni).

## Cum

În `scripts/generate-sitemap.js`:

1. Pentru proprietăți: folosește data reală per proprietate din răspunsul `GET /get-all-properties`.

   > **DECIS de owner (2026-07-27): se face treapta COMPLETA, cu backend.** Nu livra doar varianta cu `createdAt`. Task-ul e MULTI-REPO.

   **Backend (repo `zatbogdan99/hai-in-sat-api`, branch implicit `master` — NU `main`):**
   - adauga campul `updatedAt` (`Instant`) in `src/main/java/com/haiinsat/dto/PropertyDTO.java`, care e chiar documentul Mongo (`@Document(collection = "properties")`, unde `createdAt` exista deja la linia 28 si e serializat). Adaugă-l și în proiecțiile lite din `PropertyRepository` (liniile 16 și 19), altfel `/get-all-properties` nu-l întoarce;
   - seteaza-l in `HaiInSatService` la FIECARE mutatie care schimba ce vede vizitatorul pe pagina anuntului (lista re-verificată 2026-11-01 pe `HaiInSatController`):
     - `POST /save-property` (`saveProperty`, creare și editare);
     - `PATCH /properties/{id}/description` (`updatePropertyDescription`);
     - `POST /replace-photos` (`replacePhotos`);
     - `POST /add-photo` (`addPhotoToProperty`);
     - `DELETE /delete-property-photos` (`deletePhotosForProperty`);
     - `PATCH /properties/{id}/refresh-video` (`refreshVideo`);
     - `POST /regenerate-thumbnail/{propertyId}` și `POST /regenerate-thumbnails` (schimbă thumbnail-ul).
   - NU se setează la `PATCH /properties/{id}/sort-order` (schimbă doar ordinea din listă, nu pagina anunțului). `DELETE /delete-all-photos` (utilitar de admin, șterge pozele tuturor anunțurilor) poate rămâne fără `updatedAt`: e documentat ca excepție, nu se folosește în mod obișnuit. Endpoint-urile `update-description` și `delete-photo` din versiunea veche a task-ului nu există;
   - la salvarea unei proprietati NOI, `updatedAt` = `createdAt`;
   - pentru cele ~14 documente EXISTENTE, care nu au campul: nu face migrare de date, lasa-l `null`. Frontend-ul cade pe `createdAt` (vezi mai jos).

   **Frontend (`scripts/generate-sitemap.js`):** `lastmod = updatedAt ?? createdAt`, formatat `yyyy-mm-dd`.
2. Pentru pagini statice (acasă, `/oltenia-de-sub-munte`, `/satul-lunii`, `/gaseste-mi-locul`, `/sate/:slug`): folosește data ultimului commit pe componenta corespondentă (`git log -1 --format=%cI <component-path>`), cu fallback la data curentă doar dacă git nu e disponibil.
3. `/proprietati` (listing) ar trebui să aibă `lastmod = max(lastmod-urile proprietăților)` (orice listing nou pe pagina 1 modifică listing-ul).

## Verificare (locala)

`npm run generate-sitemap` loveste API-ul de PRODUCTIE (`https://hai-in-sat-api.lm.r.appspot.com/get-all-properties`), care e citire publica — deci scriptul se poate rula local, fara deploy. Dupa rulare:

```bash
grep -o "<lastmod>[^<]*</lastmod>" src/sitemap.xml | sort -u
```

Atentie: pana cand backend-ul MODIFICAT ajunge in productie, API-ul nu va returna `updatedAt`, deci toate valorile vor veni din `createdAt`. Asta e in regula si e exact ce testeaza fallback-ul `updatedAt ?? createdAt` — diversitatea datelor vine oricum, fiindca `createdAt` difera de la un anunt la altul.

## Fișiere afectate

- `scripts/generate-sitemap.js`
- backend `zatbogdan99/hai-in-sat-api`: `src/main/java/com/haiinsat/dto/PropertyDTO.java` (câmp `updatedAt`), `repository/PropertyRepository.java` (proiecțiile lite), `service/HaiInSatService.java` (setare la mutații), `src/test/java/com/haiinsat/service/HaiInSatServiceTest.java` (teste Mockito)
- `npm run generate-sitemap` înainte de fiecare build (deja e pattern-ul)

## Efort

4-5 ore (multi-repo: backend + frontend).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. Dupa deploy-ul BACKEND-ului, editeaza descrierea unei proprietati din admin, apoi ruleaza `npm run generate-sitemap` si confirma ca `lastmod`-ul acelei proprietati s-a schimbat in ziua curenta.
2. Dupa deploy-ul FRONTEND-ului: `curl https://xn--hai-n-sat-t5a.ro/sitemap.xml | grep lastmod` — valori diverse.
3. In Search Console → Sitemaps, resubmite `sitemap.xml` si verifica statusul **Success**.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Backend: `PropertyDTO.java` are campul `updatedAt` de tip `Instant`, serializat in raspunsurile care contin proprietati, la fel ca `createdAt`
- [ ] #2 Backend: proiecțiile lite din `PropertyRepository` includ `updatedAt`, deci `GET /get-all-properties` îl întoarce
- [ ] #3 Backend: `HaiInSatService` seteaza `updatedAt = Instant.now()` la fiecare mutatie care schimba continutul public al unui anunt — exact lista din descriere (`save-property`, `PATCH .../description`, `replace-photos`, `add-photo`, `delete-property-photos`, `PATCH .../refresh-video`, `regenerate-thumbnail(s)`), dar NU la `sort-order`. La crearea unei proprietati noi, `updatedAt` e egal cu `createdAt`. Câte un test Mockito pe mutație în `HaiInSatServiceTest`
- [ ] #4 Backend: NU exista migrare de date pentru documentele existente — `updatedAt` ramane `null` pe cele ~14 anunturi vechi, iar asta e intentionat
- [ ] #5 `scripts/generate-sitemap.js`: pentru proprietati, `lastmod = updatedAt ?? createdAt`, formatat `yyyy-mm-dd` — nu mai foloseste variabila `today` (azi liniile 89 → 105/112)
- [ ] #6 `scripts/generate-sitemap.js`: paginile statice primesc `lastmod` din data ultimului commit pe componenta corespondenta (`git log -1 --format=%cI <cale>`), cu fallback pe data curenta DOAR daca `git` nu e disponibil
- [ ] #7 `scripts/generate-sitemap.js`: `/proprietati` primeste `lastmod = max(lastmod-urile tuturor proprietatilor)`
- [ ] #8 Toate valorile de `lastmod` respecta ISO 8601 (`yyyy-mm-dd` sau `yyyy-mm-ddThh:mm:ssZ`) — verificabil prin regex pe `src/sitemap.xml` regenerat
- [ ] #9 Implementatorul a rulat `npm run generate-sitemap` (API-ul de productie e citire publica, merge fara deploy) si a lipit in `## Implementation Notes` iesirea `grep -o "<lastmod>[^<]*</lastmod>" src/sitemap.xml | sort -u` — trebuie sa contina **cel putin 3 valori distincte**
- [ ] #10 `./mvnw test -Dtest='!HaiInSatApplicationTests'` (backend; testul de context cere Atlas) și `npm run test:ci` (frontend) trec — task-ul atinge ambele repo-uri
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. generate-sitemap.js foloseste 'today' (linia 83) pentru lastmod la TOATE intrarile (liniile 99, 106) - nu citeste updatedAt per proprietate. Backend-ul nu expune updatedAt in /get-all-properties. Niciun AC satisfacut.
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZIE owner: se face **treapta completa**, cu `updatedAt` in backend — nu doar varianta intermediara cu `createdAt`. Planul „in doua trepte (a)/(b)" era un fork pe care agentul l-ar fi decis singur, probabil alegand varianta usoara.

Precizari adaugate ca sa nu ramana nimic de ghicit: lista exacta a mutatiilor la care se seteaza `updatedAt`, ce se intampla cu cele ~14 documente existente (raman `null`, fallback pe `createdAt`, fara migrare), si faptul ca `generate-sitemap.js` poate fi rulat local fiindca loveste un endpoint public de citire.

AC-ul vechi #2 spunea „acceptat `createdAt` in treapta intermediara — documenteaza care s-a folosit", ceea ce facea criteriul nefalsificabil → inlocuit cu criterii pe cod. AC-ul vechi #1 si verificarea pe `sitemap.xml` din productie → refacute pe fisierul regenerat local; resubmit-ul in Search Console a trecut in post-deploy.

Acesta e un task MULTI-REPO: pipeline-ul creeaza branch in ambele repo-uri si ruleaza ambele suite de teste.
Actualizare 2026-11-01 (analiza backlog-ului față de cod): încă neimplementat. Lista de mutații a fost corectată după endpoint-urile reale din `HaiInSatController` (`update-description` și `delete-photo` nu există; lipseau `PATCH .../description`, `delete-property-photos`, `refresh-video` și `regenerate-thumbnail(s)`). Am precizat și că proiecțiile lite din `PropertyRepository` trebuie să includă câmpul. Căile au fost trecute pe `/proprietati` (TASK-143), repo-ul backend pe `zatbogdan99/hai-in-sat-api`, iar comenzile de test pe cele actuale.
<!-- SECTION:NOTES:END -->
