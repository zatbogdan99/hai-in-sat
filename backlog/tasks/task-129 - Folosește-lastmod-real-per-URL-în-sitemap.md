---
id: TASK-129
title: Folosește lastmod real per URL în sitemap
status: To Do
assignee: []
created_date: '2026-05-07 08:00'
updated_date: '2026-07-27'
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

`sitemap.xml` curent (22 URL-uri) are ACELAȘI `lastmod` pe TOATE entry-urile (la re-verificarea din 2026-07-06: `2026-05-13` peste tot — data ultimei rulări a scriptului; generatorul folosește `today` pentru orice intrare, `generate-sitemap.js:83→99/106`). Google folosește `lastmod` pentru a aloca crawl budget — când e identic peste tot, semnalul e ignorat. Cu `lastmod` real per pagină, Google re-crawlează exact paginile care s-au schimbat.

Impact: după ce listezi o proprietate nouă sau actualizezi descrierea, Googlebot revine în ore (vs. zile sau săptămâni).

## Cum

În `hai-in-sat/hai-in-sat/scripts/generate-sitemap.js`:

1. Pentru proprietăți: folosește data reală per proprietate din răspunsul `GET /get-all-properties`.

   > **DECIS de owner (2026-07-27): se face treapta COMPLETA, cu backend.** Nu livra doar varianta cu `createdAt`. Task-ul e MULTI-REPO.

   **Backend (repo `java.hai-in-sat/hai-in-sat/`, branch `master` — NU `main`):**
   - adauga campul `updatedAt` (`Instant`) in modelul/documentul Mongo al proprietatii si in `src/main/java/com/haiinsat/dto/PropertyDTO.java` (unde `createdAt` exista deja si e serializat);
   - seteaza-l in `HaiInSatService` la FIECARE mutatie: `save-property`, `replace-photos`, `add-photo`, `update-description`, `delete-photo` — orice operatie care schimba ce vede vizitatorul;
   - la salvarea unei proprietati NOI, `updatedAt` = `createdAt`;
   - pentru cele ~14 documente EXISTENTE, care nu au campul: nu face migrare de date, lasa-l `null`. Frontend-ul cade pe `createdAt` (vezi mai jos).

   **Frontend (`scripts/generate-sitemap.js`):** `lastmod = updatedAt ?? createdAt`, formatat `yyyy-mm-dd`.
2. Pentru pagini statice (acasă, /properties, /under-the-mountain etc.): folosește data ultimului commit pe componenta corespondentă (`git log -1 --format=%cI <component-path>`), cu fallback la data curentă doar dacă git nu e disponibil.
3. `/properties` (listing) ar trebui să aibă `lastmod = max(lastmod-urile proprietăților)` (orice listing nou pe pagina 1 modifică listing-ul).

## Verificare (locala)

`npm run generate-sitemap` loveste API-ul de PRODUCTIE (`https://hai-in-sat-api.lm.r.appspot.com/get-all-properties`), care e citire publica — deci scriptul se poate rula local, fara deploy. Dupa rulare:

```bash
grep -o "<lastmod>[^<]*</lastmod>" src/sitemap.xml | sort -u
```

Atentie: pana cand backend-ul MODIFICAT ajunge in productie, API-ul nu va returna `updatedAt`, deci toate valorile vor veni din `createdAt`. Asta e in regula si e exact ce testeaza fallback-ul `updatedAt ?? createdAt` — diversitatea datelor vine oricum, fiindca `createdAt` difera de la un anunt la altul.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/scripts/generate-sitemap.js`
- (treapta b) backend Java, branch `master`: `src/main/java/com/haiinsat/dto/PropertyDTO.java` (câmp `updatedAt`) + `service/HaiInSatService.java` (setare la mutații) + modelul/repo Mongo
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
- [ ] #1 Backend (branch `master`): `PropertyDTO.java` are campul `updatedAt` de tip `Instant`, serializat in raspunsurile care contin proprietati, la fel ca `createdAt`
- [ ] #2 Backend: modelul/documentul Mongo al proprietatii are campul `updatedAt`
- [ ] #3 Backend: `HaiInSatService` seteaza `updatedAt = Instant.now()` la fiecare mutatie care schimba continutul public al unui anunt — cel putin `save-property`, `replace-photos`, `add-photo`, `update-description`, `delete-photo`. La crearea unei proprietati noi, `updatedAt` e egal cu `createdAt`
- [ ] #4 Backend: NU exista migrare de date pentru documentele existente — `updatedAt` ramane `null` pe cele ~14 anunturi vechi, iar asta e intentionat
- [ ] #5 `scripts/generate-sitemap.js`: pentru proprietati, `lastmod = updatedAt ?? createdAt`, formatat `yyyy-mm-dd` — nu mai foloseste variabila `today` (azi liniile 83 → 99/106)
- [ ] #6 `scripts/generate-sitemap.js`: paginile statice primesc `lastmod` din data ultimului commit pe componenta corespondenta (`git log -1 --format=%cI <cale>`), cu fallback pe data curenta DOAR daca `git` nu e disponibil
- [ ] #7 `scripts/generate-sitemap.js`: `/properties` primeste `lastmod = max(lastmod-urile tuturor proprietatilor)`
- [ ] #8 Toate valorile de `lastmod` respecta ISO 8601 (`yyyy-mm-dd` sau `yyyy-mm-ddThh:mm:ssZ`) — verificabil prin regex pe `src/sitemap.xml` regenerat
- [ ] #9 Implementatorul a rulat `npm run generate-sitemap` (API-ul de productie e citire publica, merge fara deploy) si a lipit in `## Implementation Notes` iesirea `grep -o "<lastmod>[^<]*</lastmod>" src/sitemap.xml | sort -u` — trebuie sa contina **cel putin 3 valori distincte**
- [ ] #10 `.\mvnw.cmd -q test` (backend) si `npx ng test --watch=false --browsers=ChromeHeadless` (frontend) trec — task-ul atinge ambele repo-uri
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. generate-sitemap.js foloseste 'today' (linia 83) pentru lastmod la TOATE intrarile (liniile 99, 106) - nu citeste updatedAt per proprietate. Backend-ul nu expune updatedAt in /get-all-properties. Niciun AC satisfacut.
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZIE owner: se face **treapta completa**, cu `updatedAt` in backend — nu doar varianta intermediara cu `createdAt`. Planul „in doua trepte (a)/(b)" era un fork pe care agentul l-ar fi decis singur, probabil alegand varianta usoara.

Precizari adaugate ca sa nu ramana nimic de ghicit: lista exacta a mutatiilor la care se seteaza `updatedAt`, ce se intampla cu cele ~14 documente existente (raman `null`, fallback pe `createdAt`, fara migrare), si faptul ca `generate-sitemap.js` poate fi rulat local fiindca loveste un endpoint public de citire.

AC-ul vechi #2 spunea „acceptat `createdAt` in treapta intermediara — documenteaza care s-a folosit", ceea ce facea criteriul nefalsificabil → inlocuit cu criterii pe cod. AC-ul vechi #1 si verificarea pe `sitemap.xml` din productie → refacute pe fisierul regenerat local; resubmit-ul in Search Console a trecut in post-deploy.

Acesta e un task MULTI-REPO: pipeline-ul creeaza branch in ambele repo-uri si ruleaza ambele suite de teste.
<!-- SECTION:NOTES:END -->
