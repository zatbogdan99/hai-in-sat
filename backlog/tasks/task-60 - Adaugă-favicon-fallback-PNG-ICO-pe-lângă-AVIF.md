---
id: TASK-60
title: Adaugă favicon fallback PNG/ICO pe lângă AVIF
status: To Do
assignee: []
created_date: '2026-06-12 16:18'
updated_date: '2026-06-12 16:18'
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

## Cum

1. Generează din logo: `favicon.ico` (16+32+48 px multi-size), `favicon-48.png` (sau 96), `apple-touch-icon.png` (180×180).
2. În `src/index.html`:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" href="assets/favicon-48.png" sizes="48x48">
<link rel="icon" type="image/avif" href="assets/favicon.avif"><!-- progressive enhancement -->
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
```
3. `favicon.ico` în rădăcina servită (mulți crawleri îl cer hardcodat la `/favicon.ico`) — verifică maparea statică în `app.yaml`/`angular.json` assets.

## Fișiere afectate

- `src/index.html`, `src/assets/` (+ `angular.json` assets dacă e nevoie pentru rădăcină)

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
