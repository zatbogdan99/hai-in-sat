---
id: TASK-16
title: Adaugă favicon fallback PNG/ICO pe lângă AVIF
status: To Do
assignee: []
created_date: '2026-06-12 16:18'
updated_date: '2026-07-06'
labels:
  - seo
  - images
  - quick-win
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/visual.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`src/index.html` declară un singur favicon: `<link rel="icon" type="image/avif" href="assets/favicon.avif">`. Suportul AVIF pentru favicon e incomplet: Safari (toate versiunile relevante) nu îl afișează, iar pentru favicon-ul din rezultatele Google (mobile SERP) Google cere format suportat universal și mărime multiplu de 48px. Azi: tab fără icon în Safari și risc de favicon generic în SERP. (findings/visual.md V6)

## Stare verificată (2026-07-06) — mai simplu decât părea

- `src/favicon.ico` **EXISTĂ deja**, e în `angular.json` assets (ajunge în rădăcina build-ului) și `app.yaml` are deja handler dedicat pentru `/favicon.ico` (liniile 36–39). Deci infrastructura e gata.
- Ce lipsește efectiv: (a) index.html NU declară favicon.ico (declară DOAR AVIF-ul, linia 173 — browserele care nu-l suportă nu au fallback declarat; unele cer oricum /favicon.ico hardcodat, de-asta pare că „merge parțial"); (b) nu există PNG 48×48 și apple-touch-icon; (c) de verificat că .ico-ul existent chiar conține mărimile 16+32+48 (dacă nu, regenerează-l din logo).

## Cum

1. Verifică conținutul `src/favicon.ico` (mărimi incluse); dacă nu are 16+32+48, regenerează din logo (`src/assets/Hai in sat.avif` / logo sursă). Generează și: `favicon-48.png` (sau 96), `apple-touch-icon.png` (180×180) în `src/assets/`.
2. În `src/index.html` (lângă linia 173), înlocuiește declarația unică AVIF cu setul complet:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" href="assets/favicon-48.png" sizes="48x48">
<link rel="icon" type="image/avif" href="assets/favicon.avif"><!-- progressive enhancement -->
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
```
3. Nimic de făcut în `app.yaml`/`angular.json` — mapările există deja (verificat).

## Fișiere afectate

- `src/index.html` (linia ~173), `src/assets/` (PNG + apple-touch-icon noi), eventual `src/favicon.ico` (regenerat dacă nu e multi-size)

## Efort

S (30 min).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `GET /favicon.ico` răspunde 200 cu `Content-Type: image/x-icon` (sau image/vnd.microsoft.icon)
- [ ] #2 Favicon vizibil în tab pe Safari și Chrome (test manual)
- [ ] #3 Există PNG de minimum 48×48 declarat cu `sizes` (cerința Google SERP) + apple-touch-icon 180×180
- [ ] #4 AVIF-ul rămâne declarat ultimul ca progressive enhancement; nimic nu se strică în browserele care îl suportă
<!-- AC:END -->
