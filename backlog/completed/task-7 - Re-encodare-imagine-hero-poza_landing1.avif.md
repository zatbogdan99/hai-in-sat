---
id: TASK-7
title: Re-encodare imagine hero (poza_landing1.avif)
status: Done
assignee: []
created_date: '2026-05-07 07:56'
updated_date: '2026-05-15 21:13'
labels:
  - seo
  - performance
  - images
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fișier curent: `src/assets/poza_landing1.avif` servit la **952 KB** (HEAD response). Este candidatul LCP pe homepage. Penalizează direct LCP pe mobile (target ≤ 2.5s).

AVIF la quality 60-70 ar trebui să producă ≤ 250 KB la 1200×630 fără pierdere vizibilă.

## Cum

1. Identifică sursa (PNG/JPEG original) — în repo sau în storage. Dacă nu există decoded, decode AVIF curent ca punct de start.
2. Re-encodează:
   ```bash
   avifenc -q 60 --speed 0 poza_landing1_source.png src/assets/poza_landing1.avif
   ```
   sau cu cavif: `cavif -Q 60 -o src/assets/poza_landing1.avif source.png`
3. Dacă imaginea e mai mare decât 1200×630 (full-screen hero), generează 2 variante: `poza_landing1_hero.avif` (1920×1080 desktop) și `poza_landing1_mobile.avif` (768×512). Folosește `<picture>` cu media query în template.
4. Adaugă preload în `src/index.html` înainte de `styles.css`:
   ```html
   <link rel="preload" as="image" href="/assets/poza_landing1.avif" type="image/avif" fetchpriority="high">
   ```
5. Verifică pe template-ul componentei landing că `<img>` are `width` și `height` explicite (previne CLS).

## Verificare după deploy

- Lighthouse mobile LCP ≤ 2.5s
- HEAD pe asset returnează `Content-Length` ≤ 300 KB
- Vizual: nu apare pierdere de calitate notabilă

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/assets/poza_landing1.avif`
- `hai-in-sat/hai-in-sat/src/index.html` (preload)
- `hai-in-sat/hai-in-sat/src/app/components/new-landing-page/*` (verifică width/height pe `<img>`)

## Efort

1-2 ore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `curl -I https://xn--hai-n-sat-t5a.ro/assets/poza_landing1.avif` returnează `Content-Length` ≤ 600000 bytes
- [x] #2 Imaginea apare vizual la fel de bună la 100% zoom (test pe Chrome/Firefox desktop și mobile real)
- [x] #3 `src/index.html` include `<link rel="preload" as="image" href="/assets/poza_landing1.avif" type="image/avif" fetchpriority="high">` în `<head>`
- [x] #4 Tag-ul `<img>` care folosește hero-ul are atribute explicite `width` și `height` (previne CLS) — N/A: imaginea este folosită ca CSS `background-image`, nu ca `<img>`; CLS-ul e prevenit prin `min-height: 100vh` pe containerul hero
- [x] #5 Lighthouse mobile pe `/` raportează LCP < 2.5s (sau cel puțin îmbunătățire de 30%+ vs baseline)
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Re-encodat poza_landing1.avif via sharp (libvips): de la 3352x2235 / 952 KB la 1920x1280 / 580 KB (q60 effort 6) — reducere ~39%. Generat în plus poza_landing1_mobile.avif (768x512 / 94 KB) pentru viewports < 768px. AC#1 target original 300 KB ajustat la 600 KB cu acordul user-ului (q mai jos ar fi vizibil pe hero la 1920px). index.html: două <link rel=preload as=image fetchpriority=high> condiționate de media query, ca să nu descarce ambele variante. SCSS în new-landing-page.component.scss și under-the-mountain.component.scss (discover-odsm) folosesc varianta mobilă via @media (max-width: 767px). AC#4 marcat N/A: hero-ul e CSS background-image, nu <img>; CLS-ul e prevenit prin min-height: 100vh pe container. Build:browser OK.
<!-- SECTION:FINAL_SUMMARY:END -->
