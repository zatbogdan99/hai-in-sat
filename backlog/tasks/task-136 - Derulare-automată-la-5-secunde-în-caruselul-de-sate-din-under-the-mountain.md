---
id: TASK-136
title: Derulare automată la 5 secunde în caruselul de sate din /under-the-mountain
status: To Do
assignee: []
created_date: '2026-10-29 22:50'
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

## Decizii owner (2026-10-29)

- **Interval:** 5000 ms, spre satul următor.
- **Buton vizibil Pauză/Redare** lângă controalele caruselului, pentru conformitate cu WCAG 2.2.2 (Pause, Stop, Hide).
- **După o interacțiune manuală autoplay-ul se oprește definitiv**, până la reîncărcarea paginii. Interacțiune manuală înseamnă click pe săgeata stânga/dreapta sau glisare/tragere cu degetul sau cu mouse-ul. Butonul trece atunci în starea „Redare”. Dacă utilizatorul apasă explicit „Redare”, autoplay-ul repornește: e o alegere a lui, nu o reluare automată.

## Context verificat (2026-10-29)

- Caruselul este un `swiper-container` (Swiper 12.2, `register()` din `swiper/element/bundle`, care include modulul Autoplay), configurat în `ngAfterViewInit` din `src/app/under-the-mountain/under-the-mountain.component.ts`. Are deja `loop: true`, `navigation` cu `#prevNav` / `#nextNav`, `a11y` cu etichete în română și `syncSlideFocus`, care scoate din ordinea de Tab cardurile nevăzute.
- Inițializarea (`swiperEl.initialize()`) rulează doar în browser. Pe server `initialize` nu există. Autoplay-ul trebuie să pornească tot doar în browser.
- Swiper oprește singur autoplay-ul cât timp tab-ul este ascuns (`visibilitychange`). Comportamentul trebuie păstrat.
- **Buget de stil:** SCSS-ul componentei compilează la ~9,35 KB. În `angular.json`, avertismentul e la 7,5 KB și eroarea la 10 KB. Stilurile butonului trebuie să fie minime, reutilizând aspectul `.discover__nav` (cerc alb, umbră, SVG inline). Nu ridica bugetul. Dacă tot se depășește, elimină CSS mort din același fișier, de exemplu regulile comentate, și notează asta în Implementation Notes.

## Comportament cerut

1. **Pornire:** în browser, după `initialize()`, autoplay pornește cu `delay: 5000`, cu excepția cazului `prefers-reduced-motion: reduce`. Atunci caruselul pornește oprit, iar butonul arată „Redare”.
2. **Pauză temporară** (se reia singură):
   - cât timp mouse-ul e deasupra caruselului (`pauseOnMouseEnter` sau echivalent);
   - cât timp focusul de tastatură e în carusel (`focusin` / `focusout` pe `.discover__cards`).

   Pauza temporară nu schimbă starea butonului și nu oprește definitiv autoplay-ul.
3. **Oprire definitivă:** click pe săgeți sau glisare/tragere oprește autoplay-ul și pune butonul pe „Redare”. Folosește `disableOnInteraction: true`. Verifică dacă Swiper 12 tratează și click-urile pe navigare drept interacțiune. Dacă nu, oprește explicit autoplay-ul pe evenimentele `navigationNext` / `navigationPrev`.
4. **Butonul Pauză/Redare:**
   - `<button type="button">` real, cu SVG inline `aria-hidden="true"`, ca la săgeți;
   - `aria-label` în română care descrie acțiunea: „Oprește derularea automată” / „Pornește derularea automată”;
   - funcționează din tastatură (Enter/Space) și are focus vizibil;
   - nu se suprapune peste carduri sau săgeți la 1440, 390 sau 320 px. Plasarea exactă (de exemplu centrat sub carusel) e la alegerea implementatorului, documentată cu capturi.
5. **Cititoare de ecran:** cât timp autoplay-ul rulează, schimbările de slide nu se anunță. Swiper a11y pune `aria-live="off"` pe wrapper când autoplay-ul e activ și `polite` când e oprit. Verifică, nu presupune.
6. `syncSlideFocus` continuă să ruleze la fiecare schimbare de slide, inclusiv la cele automate.

## Fișiere afectate

- `src/app/under-the-mountain/under-the-mountain.component.ts` — parametrii `autoplay`, starea butonului, `prefers-reduced-motion`, pauza la focus, oprirea la interacțiune.
- `src/app/under-the-mountain/under-the-mountain.component.html` — butonul Pauză/Redare.
- `src/app/under-the-mountain/under-the-mountain.component.scss` — stiluri minime pentru buton, în bugetul de 10 KB.
- `src/app/under-the-mountain/under-the-mountain.component.spec.ts` — teste noi.

## În afara scope-ului

- Alte caruseluri sau galerii (de exemplu galeriile din pagina de anunț).
- Schimbarea numărului de carduri vizibile, a vitezei de tranziție (`speed: 450`) sau a designului cardurilor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 În browser, fără `prefers-reduced-motion`, caruselul trece la satul următor la fiecare 5 secunde și continuă după ultimul sat cu primul, datorită buclei.
- [ ] #2 Cu `prefers-reduced-motion: reduce`, caruselul nu se mișcă singur la încărcare, iar butonul arată „Pornește derularea automată”.
- [ ] #3 Hover și focus de tastatură în carusel îl pun pe pauză temporar. La ieșire, derularea se reia, iar starea butonului rămâne neschimbată.
- [ ] #4 Click pe săgeata stânga/dreapta sau o glisare manuală oprește definitiv autoplay-ul: nu mai pornește singur nici după 10 secunde, nici după ieșirea mouse-ului sau a focusului. Butonul trece pe „Pornește derularea automată”.
- [ ] #5 Butonul Pauză/Redare este un `<button type="button">` cu `aria-label` în română care descrie acțiunea curentă. Funcționează cu mouse, Enter și Space, are focus vizibil și nu se suprapune peste carduri sau săgeți la 1440, 390 și 320 px.
- [ ] #6 Cât timp autoplay-ul rulează, wrapper-ul Swiper are `aria-live="off"`. După oprire, are `aria-live="polite"`.
- [ ] #7 Cardurile nevăzute rămân scoase din ordinea de Tab după schimbările automate de slide (`syncSlideFocus`).
- [ ] #8 Pe server nu se pornește niciun timer. HTML-ul SSR al `/under-the-mountain` conține butonul, iar `npm run test:ssr:http` trece (un singur `h1`, linkuri interne, cache).
- [ ] #9 `under-the-mountain.component.spec.ts` are teste pentru: parametrii autoplay (5000 ms, oprire la interacțiune), comutarea butonului (`autoplay.stop()` / `autoplay.start()` și eticheta), pornirea oprită la `prefers-reduced-motion` și oprirea definitivă la navigare. Swiper-ul real sau `matchMedia` sunt înlocuite cu dubluri unde e nevoie.
- [ ] #10 `npm run build` trece fără eroare de buget. Stilul compilat al componentei rămâne sub 10 KB, iar `angular.json` nu este modificat. `npm run test:ci` trece, fără teste `fdescribe`/`fit`/`xdescribe`/`xit`.
- [ ] #11 Verificarea în browser la 1440, 390 și 320 px e documentată în `## Implementation Notes`: derulare automată, pauză la hover/focus, oprire la săgeată/glisare, buton, capturi.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe `/under-the-mountain`, desktop și telefon: caruselul de sate se mută singur la 5 secunde. Butonul Pauză îl oprește, iar o săgeată apăsată îl oprește definitiv.
