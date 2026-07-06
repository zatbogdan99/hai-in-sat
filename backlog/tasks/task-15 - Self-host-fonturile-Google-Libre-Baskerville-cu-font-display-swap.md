---
id: TASK-15
title: Self-host fonturile Google (Libre Baskerville) cu font-display swap
status: To Do
assignee: []
created_date: '2026-06-12 16:19'
updated_date: '2026-07-06'
labels:
  - seo
  - performance
  - quick-win
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/performance.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`src/index.html` încarcă Libre Baskerville prin CSS extern de la `fonts.googleapis.com` (cu `preconnect`, dar tot un lanț extern render-blocking: CSS-ul de la Google → fontul de la gstatic). Pe conexiunile lente (publicul rural/mobil al site-ului), asta întârzie FCP/LCP cu sute de ms. Auditul 2026-06-12 (findings/performance.md P5) recomandă self-hosting — elimină 2 origini externe și face fontul cache-uibil cu restul asseturilor (1 an, immutable). Bonus: fără transfer de IP-uri către Google Fonts (GDPR-friendly).

## Cum

1. Descarcă subsetul latin + latin-ext (avem diacritice românești!) pentru Libre Baskerville 400/700/italic în format WOFF2 (ex. prin google-webfonts-helper).
2. Pune fișierele în `src/assets/fonts/` și declară în `styles.scss`:
```css
@font-face {
  font-family: 'Libre Baskerville';
  src: url('/assets/fonts/libre-baskerville-v…-latin-ext.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* + 700 și italic */
```
3. Șterge `<link>`-urile spre fonts.googleapis.com/fonts.gstatic.com (și preconnect-urile) din `index.html` — verificate 2026-07-06: sunt la liniile 170–172 (2× preconnect + 1× stylesheet cu `family=Libre+Baskerville:ital,wght@0,400;0,700;1,400`; exact seturile 400/700/italic-400 de descărcat).
4. `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/...-400.woff2">` pentru varianta folosită above-fold.
5. Verifică diacriticele (ă â î ș ț) — de aceea e obligatoriu subsetul latin-ext.
6. Sinergie TASK-6 (CSP): după self-host, domeniile fonts.googleapis.com/fonts.gstatic.com se pot scoate din `style-src`/`font-src`.

## Fișiere afectate

- `src/index.html` (liniile 170–172), `src/styles.scss` (există — e în `angular.json` la styles), `src/assets/fonts/` (nou)

## Efort

S (1-2 ore).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Nicio cerere către `fonts.googleapis.com` / `fonts.gstatic.com` în Network tab pe nicio pagină
- [ ] #2 Fonturile se servesc din `/assets/fonts/` cu `Cache-Control` de 1 an (moștenit din config-ul de assets)
- [ ] #3 `font-display: swap` activ — textul e vizibil imediat cu fallback, fără FOIT
- [ ] #4 Diacriticele românești se randează corect cu fontul self-hosted (test vizual pe titluri cu ă/î/ș/ț)
- [ ] #5 FCP pe homepage (lab) egal sau mai bun față de baseline-ul din `seo-audit-2026-06-12/crawl/playwright-metrics.json`
<!-- AC:END -->
