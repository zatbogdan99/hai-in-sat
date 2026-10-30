---
id: TASK-140
title: 'Variante redimensionate pentru pozele satelor (carusel, galerii, ecran întreg)'
status: Done
assignee: []
created_date: '2026-10-30 10:45'
updated_date: '2026-10-30 18:00'
labels:
  - frontend
  - performance
  - images
dependencies:
  - TASK-139
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Caruselul de sate de pe `/under-the-mountain` și paginile `/sate/:slug` primesc poze redimensionate la mărimea la care sunt afișate, cu `srcset`/`sizes`, în locul originalelor de la aparatul foto. Încărcarea pe internet lent devine de zeci de ori mai mică. E cauza de fond pentru care TASK-139 adaugă scheletul de încărcare.

## Decizie owner (2026-10-30)

Micșorarea pozelor se face într-un task separat de ecranul de încărcare (TASK-139), după el.

## Starea măsurată (2026-10-30)

Pozele satelor din `src/assets/` sunt originalele, până la 6000 px pe latura mare:

| Pagină (încărcare inițială, 1440 px) | Poze descărcate |
|---|---|
| `/under-the-mountain` | 18 fișiere, **20,5 MB** (costesti1 7 MB, baia1 5,4 MB, slatioara1 2,6 MB, polovragi1 2,4 MB…) |
| `/sate/costesti` | 8,9 MB |
| `/sate/horezu` | 3,0 MB |

Toate cele 20 de fișiere folosite de galerii (`PhotoService`) și de carusel (`data[].photo` din `UnderTheMountainComponent`) au împreună ~56 MB. Pe ecran sunt afișate la ~400 px (cardurile din carusel), cel mult ~640 px (galeria și poza din secțiunea a doua) și la mărimea ecranului (galeria pe tot ecranul).

Probă cu `sharp`, AVIF calitate 55, cu orientarea EXIF aplicată:

| Original | 800 px | 1280 px | 2048 px |
|---|---|---|---|
| costesti1 (7 040 KB) | 116 KB | 263 KB | 544 KB |
| baia1 (5 443 KB) | 60 KB | 143 KB | 322 KB |
| horezu2 (1 625 KB) | 32 KB | 76 KB | 169 KB |
| slatioara1 (2 568 KB) | 50 KB | 120 KB | 268 KB |

## Abordare

1. **Script reproductibil:** `scripts/generate-village-images.js`, cu `sharp`, deja în `devDependencies` (`^0.35.5`). Scriptul:
   - citește lista pozelor folosite de `PhotoService` și de caruselul de sate (o listă explicită în script, ținută sincronizată, sau citită din aceleași surse);
   - generează pentru fiecare variante AVIF la 480, 800, 1280 și 2048 px lățime, fără mărire peste original (`withoutEnlargement`), cu orientarea EXIF aplicată (`.rotate()`), într-un folder dedicat (de exemplu `src/assets/sate/<nume>-<lățime>.avif`);
   - e idempotent;
   - are scriptul `npm run generate-village-images` în `package.json`. NU se leagă de `build`: se rulează manual când se schimbă pozele, după tiparul `generate-sitemap`.

   Variantele generate se comit.
2. **Folosire:**
   - **Carusel** (`under-the-mountain.component.html`): `src` = varianta de 800 px, `srcset` cu 480/800/1280 și `sizes` potrivit cardului (de exemplu `(max-width: 640px) 90vw, 33vw`), plus `width`/`height` reale. Cardurile vizibile la încărcare se descarcă imediat. Celelalte pot fi `loading="lazy"` doar dacă se verifică faptul că apar corect la derularea automată și manuală a caruselului.
   - **Galeriile de pe `/sate/*`** (desktop și telefon) și poza din secțiunea a doua: `srcset` cu 800/1280/2048 și `sizes` după coloana din TASK-138 (de exemplu `(min-width: 901px) min(45vw, 40rem), 100vw`).
   - **Galeria pe tot ecranul:** varianta de 2048 px (sau `srcset` cu `sizes="100vw"`).
   - Datele din `PhotoService` primesc căile variantelor și dimensiunile reale (necesare și pentru spațiul rezervat din TASK-139).
3. **Originalele** rămân în `src/assets/` ca sursă pentru regenerare. Paginile nu le mai folosesc, cu excepția `og:image` (TASK-126). Mutarea lor într-un folder care nu se deployează e în afara scope-ului.

## Fișiere afectate (orientativ)

- `scripts/generate-village-images.js` (nou), `package.json` (doar scriptul nou, fără dependențe noi)
- `src/assets/sate/*.avif` (generate)
- `src/app/service/photo-service.ts`
- `src/app/under-the-mountain/under-the-mountain.component.{ts,html}`
- `src/app/info-page/info-page.component.{ts,html}`

## În afara scope-ului

- Pozele anunțurilor din API (base64): TASK-3 și TASK-24 (manuale). Acest task acoperă doar pozele statice ale satelor. La final se notează în TASK-24 că partea de poze statice ale satelor e rezolvată aici.
- `og:image` pentru paginile de sat și homepage: TASK-126.
- Alte poze statice (`/village-of-the-month`, homepage, „De ce Oltenia de sub Munte?”).
- Reducerea bundle-ului JS: TASK-130.

## Suprapuneri

Depinde de TASK-139, care modifică aceleași `<img>`-uri (schelet, spațiu rezervat).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Există `scripts/generate-village-images.js` și scriptul `npm run generate-village-images`. Rulat de două ori la rând, scriptul produce aceleași fișiere și nu mărește nicio poză peste original. `package.json` nu are dependențe noi, iar `package-lock.json` și `yarn.lock` sunt neschimbate.
- [x] #2 Pentru fiecare poză folosită de carusel și de galeriile satelor există variantele de 480/800/1280/2048 px (sau mai puține, dacă originalul e mai mic), cu orientarea corectă.
- [x] #3 Caruselul, galeriile (desktop și telefon), poza din secțiunea a doua și galeria pe tot ecranul folosesc variantele, cu `srcset`/`sizes` și `width`/`height` reale. Nicio pagină nu mai cere un original din `src/assets/` pentru aceste poze. Se verifică cu Resource Timing în browser.
- [x] #4 La încărcarea inițială pe 1440 px, cu cache gol, pozele descărcate au cel mult 2 MB pe `/under-the-mountain` (azi 20,5 MB) și cel mult 1,5 MB pe fiecare pagină `/sate/*` (azi până la 8,9 MB). La 390 px, valorile sunt egale sau mai mici. Măsurătorile înainte/după sunt în Implementation Notes.
- [x] #5 Calitatea vizuală e verificată prin capturi înainte/după la 1440 (DPR 1 și 2) și la 390 px (DPR 3) pe carusel, galerie și galeria pe tot ecranul. Nu apar artefacte vizibile și nu se schimbă încadrarea.
- [x] #6 Caruselul derulează corect (automat și manual) cu toate cardurile încărcate, inclusiv cele care eventual sunt `loading="lazy"`.
- [x] #7 `npm run build` trece fără eroare de buget, fără modificări în `angular.json`. `npm run test:ci`, `npm run test:ssr`, `npm run test:ssr:http` și regresia din browser trec, fără `fdescribe`/`fit`/`xdescribe`/`xit`.
- [x] #8 TASK-24 (manual) are o notă că pozele statice ale satelor sunt rezolvate de TASK-140.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. PageSpeed Insights pe `/under-the-mountain` și pe o pagină de sat: „Properly size images” și „Total byte weight” nu mai semnalează pozele satelor.
2. Pe telefon, cu internet slab, caruselul și galeriile se încarcă în câteva secunde.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit `185225c`. `npm run generate-village-images` generează 71 de variante AVIF (calitate 55) pentru 19 poze, 9,9 MB în total; pozele mai înguste au mai puține variante (vaideeni1: 480/800, barbatesti: 480/800/1280). A doua rulare durează 0,2 s și lasă fișierele identice (sha256). Din `package.json` s-a schimbat doar scriptul; lockfile-urile nu. Galeria de telefon, ascunsă pe desktop, și poza a doua, ascunsă pe telefon, au `sizes` care cer varianta de 480 px; altfel browserul descărca și varianta de 2048 px a pozei ascunse. Măsurat cu Resource Timing, cu cache gol: la 1440 px DPR 1, /oltenia-de-sub-munte descarcă 1,53 MB de poze (înainte 20,5 MB), iar paginile de sat 0,16–0,74 MB (înainte până la 8,9 MB); la 390 px DPR 1, 1,07 MB și 0,10–0,13 MB. La DPR 2/3 (1440@2x, 390@3x): 2,39 MB / 1,93 MB pe /oltenia-de-sub-munte, ≤ 0,98 MB pe sate. Nicio pagină nu mai cere vreun original. Restul de pe /oltenia-de-sub-munte e din alte poze statice (fundalul poza_landing1 567 KB, poza3_oltenia-cismea 448 KB), în afara scope-ului. Calitate: decupaj din costesti1 la mărimea afișată pe 2x, original față de varianta de 1280 px, fără diferență vizibilă; încadrarea e aceeași (harta diferențelor: pixelii schimbați sunt doar în interiorul pozelor). Caruselul derulează automat și manual (regresia: autoplay, glisare, săgeți). Notă adăugată în TASK-24.

Validare finală 2026-10-30, pe build-ul cu TASK-139…143 (branch `claude/pensive-heisenberg-2m6ix7`): `npm run build` PASS, fără erori de buget; `npm run test:ci` 139/139; `npm run test:ssr` 26/26; `npm run test:ssr:http` PASS (28 de rute din sitemap cu incoming links, 16 anunțuri descoperite, 151 de răspunsuri HTTP, inclusiv 11 redirecturi 301 de la căile vechi). Regresia din browser: 65 PASS, 0 FAIL. Capturi pe 7 dimensiuni (1920, 1440, 1280, 1000, 390, 320, 844×390 × 13 pagini): 0 scroll orizontal, 0 erori JavaScript. Comparația pixel cu pixel cu reperul de dinainte: 0,00% pe homepage, /proprietati și varianta de telefon a /satul-lunii; diferențele rămase sunt cele intenționate. Fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Pozele satelor au variante redimensionate cu srcset; /oltenia-de-sub-munte descarcă 1,5 MB de poze în loc de 20,5 MB, iar paginile de sat sub 0,75 MB. Fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
