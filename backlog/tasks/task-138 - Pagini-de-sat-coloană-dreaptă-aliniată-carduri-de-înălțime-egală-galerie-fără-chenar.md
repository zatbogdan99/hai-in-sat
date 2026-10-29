---
id: TASK-138
title: >-
  Pagini de sat: coloană dreaptă aliniată, carduri de înălțime egală, galerie
  fără chenar
status: To Do
assignee: []
created_date: '2026-10-29 23:30'
labels:
  - frontend
  - ui
  - layout
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Pe paginile de sat (`/sate/:slug`, `InfoPageComponent`), varianta desktop pe două coloane (lățime peste 900 px):

1. **Coloana dreaptă are aceleași margini peste tot.** Galeria de sus, cardul alb din dreapta („Depresiunea…”, „La poalele…”) și poza din secțiunea a doua au aceeași margine stângă și aceeași margine dreaptă, la orice lățime de ecran desktop. Azi galeria începe vizibil mai la dreapta decât cardul de sub ea, iar poza din secțiunea a doua nici ea nu se aliniază cu cardul.
2. **Cele două carduri albe („Ce găsești aici” și cardul din dreapta) au mereu aceeași înălțime**, egală cu cea a cardului cu mai mult conținut. Azi cardul din dreapta e mai înalt decât cel din stânga și coboară până lipește de poza de dedesubt.
3. **Galeria nu mai are chenar.** Linia subțire care înconjoară zona cu punctele indicatoare, sub poză, dispare.

## Decizii owner (2026-10-29)

- Cerințele 1–3 de mai sus, la cererea owner-ului, pe baza capturilor de pe `/sate/horezu`.
- Alinierea pozei din secțiunea a doua cu coloana dreaptă e o extensie a cerinței 1, adăugată la recomandare: aceeași coloană, aceeași dezaliniere în a doua captură.

## Cauza (verificată 2026-10-29)

Layoutul desktop din `src/app/info-page/info-page.component.scss` e construit din dimensiuni fixe, reglate pentru o singură lățime de ecran, nu dintr-o grilă comună:

- `.feature-card-left`: `width: 56.5rem; height: 25rem`; `.feature-card`: `width: 40rem; height: 26rem`; `.feature-card .p-card .p-card-body`: `height: 18.5rem !important; width: 36rem`.
- `.gallery-wrap` / `.top-row > .gallery-wrap`: `max-width: 36rem`, `flex: 0 1 36rem`, plus `[containerStyle]="{ 'max-width': '40rem' }"` pe `p-galleria`.
- Poza din secțiunea a doua, cu lățimi „reglate fin”: `.horezu-image` `38.375rem` (cu comentariul „+0.875rem total spre dreapta față de 39.25rem”), `.vaideeni/.slatioara/.costesti-section .polovragi-image` `39.25rem`, `.polovragi-image` `36rem`, `.baia-section .polovragi-image` cu `max-height` diferit.
- `.features-row` e flex cu `justify-content: space-between` între două lățimi fixe, deci golul dintre carduri variază cu ecranul.
- Între rândul cu carduri și secțiunea următoare nu există un spațiu definit: cardul din dreapta, mai înalt, ajunge să atingă poza.
- Chenarul galeriei: rădăcina `p-galleria` (preset-ul Lara) are bordură de 1 px. Poza acoperă partea de sus, deci bordura se vede doar în jurul zonei cu indicatori. `p-galleria` e folosit doar în această componentă: galeria desktop (linia ~26 din template), cea de mobil (~249) și cea fullscreen (~334).

## Abordare

1. **O coloană dreaptă comună**, definită o singură dată ca variabile CSS pe containerul desktop, de exemplu `--sat-col-right` (lățimea coloanei drepte, fluidă cu limită maximă) și `--sat-gap` (golul dintre coloane). Toate rândurile desktop le folosesc:
   - `.top-row` și `.features-row`: `display: grid; grid-template-columns: minmax(0, 1fr) var(--sat-col-right); gap: var(--sat-gap)`;
   - pozele flotante din secțiunea a doua (`.horezu-image--float`, `.polovragi-image--float` și variantele per sat) au `width: var(--sat-col-right)` și `margin-left: var(--sat-gap)`, păstrând `float: right`, astfel încât textul să curgă în continuare sub poză.

   Lățimea coloanei se raportează la același container în toate rândurile. Verifică asta; dacă un rând are alt padding, aliniază containerele.
2. **Cardurile:** se șterg lățimile și înălțimile fixe (`56.5rem`, `40rem`, `25rem`, `26rem`, `18.5rem !important`, `36rem`). Celulele grilei se întind pe înălțimea rândului (`align-items: stretch`), iar `p-card` și `.p-card-body` umplu celula (`height: 100%`), cu același padding în ambele carduri. Conținutul începe sus în ambele carduri. Regula care centrează vertical doar pe Horezu (`.horezu-context .feature-card .p-card .p-card-body { justify-content: center }`) se scoate, ca cele două carduri să arate la fel.
3. **Galeria:** umple lățimea coloanei drepte (fără `max-width` fix, fără `[containerStyle]` cu `40rem`), cu raportul pozei păstrat. Fără chenar: `:host ::ng-deep .p-galleria { border: 0; }` sau tokenul echivalent, doar în această componentă, pentru galeriile desktop și mobil. Indicatorii (punctele, focusul vizibil, ținta de 24 px) rămân neschimbați.
4. **Spațiere verticală:** între rândul cu carduri și secțiunea următoare există un spațiu fix, același pe toate paginile de sat (de exemplu egal cu `padding-top` al `.features-row`), astfel încât cardul să nu mai atingă poza.
5. **Curățenie:** se șterg regulile de „reglaj fin” devenite inutile și comentariile lor. SCSS-ul componentei e la ~9,1 KB din bugetul de eroare de 10 KB, iar ștergerile îl reduc.
6. **Mobil (sub 900 px)** rămâne pe o coloană, ca acum: carduri pe toată lățimea, una sub alta, cu înălțimea după conținut. Galeria de mobil pierde doar chenarul.

## Fișiere afectate

- `src/app/info-page/info-page.component.scss` (layout desktop, carduri, galerie, curățenie)
- `src/app/info-page/info-page.component.html` (scoaterea `[containerStyle]` și, dacă e nevoie, a claselor de reglaj per sat)
- `scripts/test-browser-regression.cjs` (verificările automate din AC #5)

## Suprapuneri

TASK-137 (tipografia paragrafelor) modifică același SCSS și elimină `m-0` din același template. Oricare se implementează al doilea face rebase pe primul.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pe toate cele 7 pagini `/sate/*`, la 1000, 1280, 1440 și 1920 px lățime, marginea stângă a galeriei de sus, a cardului alb din dreapta și a pozei din secțiunea a doua sunt la aceeași coordonată X. Același lucru e valabil pentru marginea dreaptă. Toleranța e de ±1 px, măsurată cu `getBoundingClientRect()`.
- [ ] #2 La aceleași lățimi, cele două carduri albe din rândul „Ce găsești aici” au aceeași înălțime (±1 px), egală cu înălțimea necesară cardului cu mai mult conținut. Niciun text nu e tăiat sau ascuns.
- [ ] #3 Între rândul cu carduri și secțiunea următoare există pe toate paginile de sat același spațiu vertical, de cel puțin 2rem. Cardul din dreapta nu mai atinge poza de dedesubt.
- [ ] #4 Galeriile desktop și mobil nu mai au bordură: `border-width` calculat al rădăcinii `.p-galleria` e `0px`. Punctele indicatoare, săgețile, deschiderea pe tot ecranul și focusul vizibil funcționează ca înainte.
- [ ] #5 `scripts/test-browser-regression.cjs` verifică automat AC #1, #2 și #4 pe toate paginile `/sate/*`, la 1280 și 1440 px.
- [ ] #6 `info-page.component.scss` nu mai conține lățimile și înălțimile fixe enumerate în „Cauza” (`56.5rem`, `40rem`, `25rem`, `26rem`, `18.5rem !important`, `36rem`, `38.375rem`, `39.25rem`) pentru carduri, galerie și pozele din secțiunea a doua. Coloana dreaptă e definită o singură dată, prin variabile CSS.
- [ ] #7 Sub 900 px layoutul rămâne pe o coloană, ca înainte, fără scroll orizontal la 390 și 320 px. Capturile înainte/după sunt documentate.
- [ ] #8 `npm run build` trece fără eroare de buget și fără modificări în `angular.json`. `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec (un singur `h1` pe pagină, linkuri interne), fără teste `fdescribe`/`fit`/`xdescribe`/`xit`.
- [ ] #9 Capturile înainte/după pentru `/sate/horezu` și încă două sate, la 1280, 1440 și 1920 px, sunt documentate în `## Implementation Notes`.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe `/sate/horezu` și încă un sat, pe laptop și pe monitor mare: galeria, cardul din dreapta și poza de dedesubt au aceeași margine stângă. Cardurile au aceeași înălțime. Sub galerie nu mai e nicio linie în jurul punctelor.
