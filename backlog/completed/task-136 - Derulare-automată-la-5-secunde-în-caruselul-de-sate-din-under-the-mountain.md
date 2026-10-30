---
id: TASK-136
title: Derulare automată la 5 secunde în caruselul de sate din /under-the-mountain
status: Done
assignee: []
created_date: '2026-10-29 22:50'
updated_date: '2026-10-30 10:00'
labels:
  - frontend
  - ui
  - accessibility
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Caruselul „Descoperă Oltenia de sub Munte” de pe `/under-the-mountain` trece singur la satul următor (spre dreapta, la fel ca un click pe săgeata din dreapta) la fiecare 5 secunde, la nesfârșit, datorită buclei existente.

## Decizii owner

- **2026-10-29:** interval de 5000 ms, spre satul următor. După o interacțiune manuală (click pe săgeata stânga/dreapta sau glisare/tragere cu degetul sau cu mouse-ul) autoplay-ul se oprește definitiv.
- **2026-10-30 (înlocuiește decizia din 2026-10-29 despre buton):** **fără buton Pauză/Redare**. Owner-ului nu i-a plăcut cum arată butonul, așa că acesta a fost implementat, apoi scos. Caruselul se mișcă singur implicit, iar după ce cineva îl atinge rămâne oprit până la o nouă intrare pe pagină. Owner-ul și-a asumat explicit renunțarea la butonul cerut de WCAG 2.2.2. Mecanismele de oprire rămase sunt săgețile și glisarea, care opresc definitiv, plus pauza la hover și la focus de tastatură.

## Context verificat (2026-10-29)

- Caruselul este un `swiper-container` (Swiper 12.2, `register()` din `swiper/element/bundle`, care include modulul Autoplay), configurat în `ngAfterViewInit` din `src/app/under-the-mountain/under-the-mountain.component.ts`. Are deja `loop: true`, `navigation` cu `#prevNav` / `#nextNav`, `a11y` cu etichete în română și `syncSlideFocus`, care scoate din ordinea de Tab cardurile nevăzute.
- Inițializarea (`swiperEl.initialize()`) rulează doar în browser. Pe server `initialize` nu există. Autoplay-ul trebuie să pornească tot doar în browser.
- Swiper oprește singur autoplay-ul cât timp tab-ul este ascuns (`visibilitychange`). Comportamentul trebuie păstrat.
- **Buget de stil:** SCSS-ul componentei compilează sub eroarea de 10 KB din `angular.json`. Nu ridica bugetul.

## Comportament cerut

1. **Pornire:** în browser, după `initialize()`, autoplay pornește cu `delay: 5000`, cu excepția cazului `prefers-reduced-motion: reduce`, când caruselul nu se mișcă singur.
2. **Pauză temporară** (se reia singură):
   - cât timp mouse-ul e deasupra caruselului;
   - cât timp focusul de tastatură e în carusel (`focusin` / `focusout` pe `.discover__cards`).

   Pauza temporară nu oprește definitiv autoplay-ul. Rolul ei: cardul pe care vrei să dai click să nu fugă de sub cursor.
3. **Oprire până la o nouă intrare pe pagină:** click pe săgeți sau glisare/tragere oprește autoplay-ul (`disableOnInteraction: true`), inclusiv dacă se întâmplă în timpul pauzei temporare. La o nouă intrare pe pagină (o nouă instanță a componentei) caruselul pornește din nou.
4. **Cititoare de ecran:** cât timp autoplay-ul rulează, schimbările de slide nu se anunță (`aria-live="off"` pe wrapper); după oprire se anunță (`polite`).
5. `syncSlideFocus` continuă să ruleze la fiecare schimbare de slide, inclusiv la cele automate.
6. **Fără buton de control** și fără alt element nou vizibil: aspectul caruselului rămâne cel dinainte de task.

## Fișiere afectate

- `src/app/under-the-mountain/under-the-mountain.component.ts`: parametrii `autoplay`, `prefers-reduced-motion`, pauza temporară, oprirea la interacțiune, `aria-live`.
- `src/app/under-the-mountain/under-the-mountain.component.html`: evenimentele de pointer și focus pe `.discover__cards`.
- `src/app/under-the-mountain/under-the-mountain.component.spec.ts`: teste noi.
- `scripts/test-browser-regression.cjs`: verificarea în browser real.

## În afara scope-ului

- Alte caruseluri sau galerii (de exemplu galeriile din pagina de anunț).
- Schimbarea numărului de carduri vizibile, a vitezei de tranziție (`speed: 450`) sau a designului cardurilor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 În browser, fără `prefers-reduced-motion`, caruselul trece la satul următor la fiecare 5 secunde și continuă după ultimul sat cu primul, datorită buclei.
- [x] #2 Cu `prefers-reduced-motion: reduce`, caruselul nu se mișcă singur.
- [x] #3 Hover și focus de tastatură în carusel îl pun pe pauză temporar. La ieșire, derularea se reia.
- [x] #4 Click pe săgeata stânga/dreapta sau o glisare manuală oprește autoplay-ul: nu mai pornește singur nici după 10 secunde, nici după ieșirea mouse-ului sau a focusului. La o nouă intrare pe pagină caruselul derulează din nou.
- [x] #5 Caruselul nu are buton Pauză/Redare sau alt control nou. Aspectul săgeților și al cardurilor e identic cu cel dinainte de task.
- [x] #6 Cât timp autoplay-ul rulează, wrapper-ul Swiper are `aria-live="off"`. După oprire, are `aria-live="polite"`.
- [x] #7 Cardurile nevăzute rămân scoase din ordinea de Tab după schimbările automate de slide (`syncSlideFocus`).
- [x] #8 Pe server nu se pornește niciun timer, iar `npm run test:ssr:http` trece (un singur `h1`, linkuri interne, cache).
- [x] #9 `under-the-mountain.component.spec.ts` are teste pentru: parametrii autoplay (5000 ms, oprire la interacțiune), lipsa butonului, oprirea la săgeată, pauza la focus, oprirea definitivă la săgeată în timpul pauzei și pornirea oprită la `prefers-reduced-motion`.
- [x] #10 `npm run build` trece fără eroare de buget. Stilul compilat al componentei rămâne sub 10 KB, iar `angular.json` nu este modificat. `npm run test:ci` trece, fără teste `fdescribe`/`fit`/`xdescribe`/`xit`.
- [x] #11 Verificarea în browser la 1440, 390 și 320 px e documentată în `## Implementation Notes`: derulare automată, pauză la hover, oprire la săgeată, repornire la o nouă intrare, capturi.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe `/under-the-mountain`, desktop și telefon: caruselul de sate se mută singur la 5 secunde. După o săgeată sau o glisare rămâne pe loc, iar la o nouă intrare pe pagină pornește din nou.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit-uri `68b1ae4`, `4e8f211` și `ce79250`. Swiper 12.2: `autoplay` cu `delay: 5000`, `disableOnInteraction: true`. Descoperit la testarea în browser real: `swiper.autoplay.pause()` se reia singur la următorul `transitionend`, deci pauza la hover/focus folosește `stop()`/`start()` cu o stare „pauză temporară”. O schimbare de slide în timpul pauzei (săgeată, glisare) devine oprire definitivă. `aria-live` e setat de componentă (`off` cât derulează, `polite` oprit), pentru că modulul a11y îl setează doar la inițializare.

Butonul Pauză/Redare a fost implementat pe 2026-10-29 și scos pe 2026-10-30, la cererea owner-ului (`ce79250`). Stilurile săgeților (`.discover__nav`) sunt din nou identice cu cele din `master`. Notă: un click pe săgeată venit exact în timpul unei tranziții e ignorat de Swiper (`loopPreventsSliding`); comportamentul exista dinainte.

Validare după scoaterea butonului (2026-10-30): `npm run build` PASS (under-the-mountain 8,75 KB, sub eroarea de 10 KB); `npm run test:ci` 132/132; `npm run test:ssr` 26/26; `npm run test:ssr:http` PASS (28 de rute din sitemap cu incoming links, 16 anunțuri descoperite, 128 de răspunsuri HTTP). Regresia din browser: 55 PASS, 0 FAIL, inclusiv, în browser real fără mișcare redusă, la 1440, 390 și 320 px: avansare la 5 s, pauză la hover 6 s (desktop), oprire la săgeată (10 s fără mișcare) și repornire la o nouă intrare pe pagină. Cardurile nevăzute rămân scoase din Tab după avansarea automată. Capturile caruselului la 1440/390/320 arată aspectul dinainte de task. Fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Caruselul de sate derulează automat la 5 s, fără buton de control. Are pauză temporară la hover/focus, se oprește la săgeată sau glisare până la o nouă intrare pe pagină și nu derulează la mișcare redusă. Fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
