---
id: TASK-142
title: '/village-of-the-month: „Pastilă pentru suflet” nu mai e tăiată de footer'
status: To Do
assignee: []
created_date: '2026-10-30 11:15'
labels:
  - frontend
  - ui
  - layout
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Problema (raportată de owner pe un MacBook Air, reprodusă 2026-10-30)

Pe `/village-of-the-month`, pe desktop, secțiunea „Pastilă pentru suflet” (cardul cu titlul și video-ul YouTube din dreapta lui) stă lipită de footer, ba chiar se suprapune puțin cu el.

Cauza, în `village-of-the-month.component.scss`, în breakpoint-ul de desktop (min 1200 × 600):
- `.container1` are `height: 75vh` (plus `padding-top: 6rem`), deci înălțimea secțiunii depinde de înălțimea ferestrei;
- conținutul are înălțimi fixe: cardul `p-card` are 32,5rem (520 px, prin `[style]` în template), iar containerul video `.reveal > div:nth-child(2)` / `.youtube-container` are 53,5rem (856 px);
- `.reveal` are `overflow: hidden`, deci tot ce trece de 75vh e tăiat exact la marginea de sus a footerului.

Măsurat cu Playwright (cardul și video-ul față de marginea de sus a footerului):

| Fereastră | Secțiune (75vh) | Cardul trece peste footer | Video tăiat la footer |
|---|---|---|---|
| 1280×689 | 517 px | da (100 px) | da |
| 1440×789 (MacBook Air 13", fereastră de browser) | 592 px | da (25 px) | da |
| 1470×845 (MacBook Air 13,6") | 634 px | nu | da |
| 1440×900 | 675 px | nu | da |
| 1920×960 | 720 px | nu | da |

## Scope

- Pe desktop, înălțimea secțiunii vine din conținut, nu din `75vh`. Cardul și video-ul se văd întregi, iar între ele și footer există spațiu, același la orice înălțime de fereastră.
- Video-ul încape întreg pe ecran pe ferestrele de laptop. Înălțimea lui e limitată la înălțimea ferestrei minus antetul fix (88 px, TASK-135) și o margine, de exemplu `min(53.5rem, calc(100vh - 88px - 4rem))`. Lățimea se adaptează, ca proporția să rămână cea de acum.
- Cardul „Pastilă pentru suflet” rămâne vizibil întreg, cu colțurile rotunjite, alături de video, centrat vertical față de el sau aliniat sus, cum e acum. Dimensiunea lui fixă (`40rem × 32,5rem`) poate rămâne dacă încape.
- Animația de apariție (`.reveal`, gsap) funcționează ca înainte. `overflow: hidden` de pe `.reveal` poate rămâne doar dacă nu mai taie conținutul.
- Pe telefon și tabletă (`.small-screen`) nu se schimbă nimic.

## Fișiere afectate

- `src/app/village-of-the-month/village-of-the-month.component.scss`
- eventual `src/app/village-of-the-month/village-of-the-month.component.html` (stilurile inline ale cardului)
- `scripts/test-browser-regression.cjs` (verificarea automată)

## În afara scope-ului

- Secțiunea de sus („Prezentarea satului” cu video-ul satului).
- Conținutul cardului și alegerea video-ului.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 La 1280×689, 1440×789, 1470×845, 1440×900 și 1920×960, cardul „Pastilă pentru suflet” și containerul video se termină cu cel puțin 3rem (48 px) deasupra footerului. Nimic din secțiune nu e tăiat și nimic nu se suprapune peste footer. Se măsoară cu `getBoundingClientRect()`.
- [ ] #2 La aceleași ferestre, video-ul încape întreg pe ecran sub antetul fix: înălțimea lui ≤ înălțimea ferestrei − 88 px.
- [ ] #3 Spațiul dintre secțiune și footer e același (±1 px) la toate înălțimile de fereastră de mai sus, adică nu mai depinde de `vh`.
- [ ] #4 Cardul are toate colțurile rotunjite vizibile, iar animația de apariție a secțiunii funcționează.
- [ ] #5 La 390 și 320 px, varianta de telefon e neschimbată față de capturile dinainte.
- [ ] #6 `scripts/test-browser-regression.cjs` verifică AC #1 la 1440×789 și 1920×960.
- [ ] #7 `npm run build` trece fără eroare de buget. `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec, fără `fdescribe`/`fit`/`xdescribe`/`xit`.
- [ ] #8 Capturile înainte/după la ferestrele de la AC #1 sunt documentate în `## Implementation Notes`.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe MacBook Air, la finalul paginii `/village-of-the-month`: cardul și video-ul „Pastilă pentru suflet” se văd întregi, cu spațiu până la footer.
