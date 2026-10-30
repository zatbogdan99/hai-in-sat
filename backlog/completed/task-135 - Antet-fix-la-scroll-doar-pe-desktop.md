---
id: TASK-135
title: Antet fix la scroll doar pe desktop
status: Done
assignee: []
created_date: '2026-10-29 22:35'
updated_date: '2026-10-29 23:59'
labels:
  - frontend
  - ui
  - header
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Pe desktop, antetul (bara albastră `.topbar` cu logo, meniul cu chip-uri și rețelele sociale) rămâne mereu vizibil în partea de sus a ecranului la derulare. Pe telefon și tabletă, antetul se derulează în continuare odată cu pagina, ca acum.

## Decizie owner (2026-10-29)

- Fix **doar pe desktop**, definit de breakpoint-ul existent `@media only screen and (min-width: 1200px) and (min-height: 600px)`. După același breakpoint se aleg deja meniul cu chip-uri și butonul de meniu mobil (`app.component.scss`).
- Sub acest breakpoint (lățime sub 1200 px **sau** înălțime sub 600 px, inclusiv telefonul ținut orizontal) comportamentul rămâne neschimbat: antetul se derulează.
- Aspectul și dimensiunea antetului nu se schimbă (logo 80 px, ~88 px înălțime). Nu se micșorează la scroll și nu se ascunde la derulare în jos.

## Context verificat (2026-10-29)

- Se poate face doar din CSS, cu `position: sticky; top: 0`. `.topbar` este primul copil al `.app-shell`, care conține tot site-ul (antet, `main`, footer), deci rămâne lipit pe toată pagina.
- `body` are `overflow-x: hidden` / `overflow-y: scroll` (`src/styles.scss`), dar `html` nu are `overflow`. Derularea rămâne deci pe fereastră și `sticky` funcționează. **Nu adăuga `overflow` pe `html`, `body`, `app-root` sau `.app-shell`:** `sticky` ar înceta să funcționeze fără nicio eroare vizibilă.
- `z-index` existent:
  - conținutul paginilor: între 1 și 100 (`under-the-mountain` 5/10, `property-details` 2/3, `.mobile-title` 100);
  - spinnerele pe tot ecranul: 1000 (`properties`) și 2000 (`styles.scss`);
  - dialogurile și toast-urile PrimeNG: 1100+;
  - galeria fullscreen: mască PrimeNG;
  - meniul mobil: `baseZIndex` 10000.

  Antetul trebuie să stea peste conținut și sub toate acestea. O valoare în jur de 500, cu un comentariu care explică intervalul, le respectă.
- Meniul mobil (popover-ul) există doar sub breakpoint, deci nu e afectat.
- Accesibilitate (WCAG 2.4.11 Focus Not Obscured): pe desktop, elementul focusat cu Tab nu trebuie să ajungă ascuns sub antet. Se rezolvă cu `scroll-padding-top` pe `html`, tot doar în media query-ul de desktop.

## Scope

- `src/app/app.component.scss` — în blocul existent `@media only screen and (min-width: 1200px) and (min-height: 600px)`, `.topbar` primește `position: sticky; top: 0; z-index: …`, cu un comentariu în română care explică de ce e doar pe desktop și intervalul de `z-index`.
- `src/styles.scss` — în același breakpoint, `html { scroll-padding-top: … }`, cu o valoare cel puțin egală cu înălțimea reală a antetului. Măsoar-o la 1440×900, nu o estima.
- `scripts/test-browser-regression.cjs`:
  - la 1440 px, după o derulare de cel puțin 1000 px pe o pagină lungă (de exemplu `/properties` sau `/under-the-mountain`), `.topbar` are `getBoundingClientRect().top === 0` și e vizibil;
  - la 390 px și la 320 px, după aceeași derulare, `.topbar` a ieșit din ecran (`bottom <= 0`);
  - adaugă și un viewport de telefon orizontal (de exemplu 844×390): antetul se derulează și acolo.

## În afara scope-ului

- Orice schimbare de design, dimensiune sau conținut a antetului; micșorarea la scroll; ascunderea la derulare în jos.
- Antet fix pe telefon sau tabletă.
- Ajustarea secțiunilor hero cu `min-height: 100vh`: antetul exista deja deasupra lor, iar înălțimea vizibilă nu se schimbă la încărcare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 La 1440×900 px, pe orice pagină publică, după o derulare de minimum 1000 px, `.topbar` rămâne lipit sus (`top === 0`), cu același aspect ca la încărcare. Chip-urile de meniu, logo-ul și rețelele sociale rămân clickabile.
- [x] #2 La 390 px și 320 px lățime, și în viewport-ul de telefon orizontal (înălțime sub 600 px), antetul se derulează odată cu pagina, ca înainte de task.
- [x] #3 `position: sticky` și `scroll-padding-top` sunt definite doar în breakpoint-ul de desktop existent. Nu s-a adăugat JavaScript și nici `overflow` pe `html`, `body`, `app-root` sau `.app-shell`.
- [x] #4 Pe desktop, antetul stă peste conținutul paginilor (galerii, carduri, secțiuni hero) și sub dialogurile PrimeNG (Termeni, Politica, Cookies, Contact), sub toast-uri, sub galeria fullscreen și sub spinnerele de încărcare. Toate au fost verificate deschise după derulare.
- [x] #5 Pe desktop, navigarea cu Tab printr-o pagină lungă nu lasă niciun element focusat ascuns sub antet. `scroll-padding-top` este cel puțin egal cu înălțimea măsurată a antetului, iar valoarea măsurată e notată în `## Implementation Notes`.
- [x] #6 Back/Forward păstrează restaurarea poziției de scroll (`withInMemoryScrolling`), iar o navigare nouă pornește de sus, cu antetul vizibil.
- [x] #7 `scripts/test-browser-regression.cjs` acoperă cazurile #1 și #2 (1440 px lipit sus; 390, 320 px și telefon orizontal derulat).
- [x] #8 `npm run build` și `npm run test:ci` trec. Bugetul de stil per componentă din `angular.json` nu e depășit. Nu există teste `fdescribe`/`fit`/`xdescribe`/`xit`.
- [x] #9 Verificarea vizuală la 1440, 390 și 320 px e documentată în `## Implementation Notes`, cu capturi după derulare.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe desktop, derulează pagina de proprietăți și o pagină de anunț: antetul rămâne sus.
2. Pe telefon, antetul pleacă din ecran la derulare, ca înainte.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit `0c3d465`. Înălțimea măsurată a antetului la 1440×900: 88 px; `scroll-padding-top: 6rem` (96 px). `z-index: 500`. Verificat: la 1920/1440/1280 antetul rămâne la `top: 0` după derulare; la 1000, 390, 320 și 844×390 pleacă din ecran. Galeria fullscreen și cele 3 dialoguri legale, deschise după derulare, acoperă antetul; toast-ul apare peste el. Tab prin `/under-the-mountain`: niciun element focusat ascuns sub antet. Back pe `/properties` restaurează scroll-ul (700 px), o navigare nouă pornește de sus.

Validare finală 2026-10-29 pe build-ul final (branch `claude/pensive-heisenberg-2m6ix7`): `npm run build` PASS, fără erori de buget (info-page sub pragul de avertisment, under-the-mountain 8,92 KB, properties 9,32 KB neschimbat); `npm run test:ci` 133/133; `npm run test:ssr` 26/26; `npm run test:ssr:http` PASS: „redirect, static assets, SEO phones, 28 sitemap headings and incoming links, 16 discovered properties; 128 HTTP responses checked”, minimum 5 href-uri interne distincte pe fiecare rută. Regresia din browser (`scripts/test-browser-regression.cjs`, 1440/390/320 px + telefon orizontal + layout sate la 1280/1440) 55 PASS, 0 FAIL. Capturi înainte/după: 91 de pagini (7 ecrane: 1920, 1440, 1280, 1000, 390, 320, 844×390 × 13 pagini), 0 scroll orizontal, 0 erori JavaScript. Verificări suplimentare în browser real: 8/8 PASS. Fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Antetul e sticky doar în breakpoint-ul de desktop (min 1200 × 600), cu z-index sub overlay-uri și scroll-padding pentru focus; pe telefon/tabletă se derulează ca înainte. Fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
