---
id: TASK-44
title: DESIGN Pagină proprietate desktop — versiune fără video
status: Done
assignee: []
created_date: '2026-05-13 13:00'
updated_date: '2026-05-15 20:11'
labels:
  - design
  - ux
  - desktop
  - property-details
dependencies:
  - TASK-42
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Pe desktop, pagina `/property/:id/:slug` are acum titlul + descrierea într-o coloană îngustă pe stânga și galeria full-width dedesubt. Galeria full-width pare prea mare pentru un ecran lat, iar zona din dreapta titlului este goală. Acest task reorganizează desktop-ul într-un **layout cu 2 coloane**: galerie pe dreapta (55% lățime), text pe stânga, **cu wrap natural** — când descrierea depășește înălțimea galeriei, restul textului se extinde automat pe toată lățimea containerului sub galerie.

**Scope**: doar versiunea desktop **fără video**. Versiunea desktop cu video intră în task separat.

**Referință vizuală**: `.mockups/property-desktop.html`.

## Pre-requisite

**TASK-42 trebuie finalizat înainte**. Acest task adaugă overrides pentru layout-ul desktop peste baza de styling stabilită în TASK-42 (chip, accent line, back-btn pill, gallery nav overlay, counter, thumbs). Dacă TASK-42 nu a fost încă implementat, finalizați-l mai întâi.

## Cum

### 1. Header și footer — neschimbate

Identic cu TASK-42: nu se ating nici `src/app/menu/`, nici componenta de footer.

### 2. Container și padding

```scss
.property-details-container {
  max-width: 1080px;          /* nu 1200px ca acum */
  margin: 0 auto;
  padding: 2rem 1rem;          /* default mobil din TASK-42 */
}

@media (min-width: 56.25rem) { /* ≥ 900px = desktop/tablet larg */
  .property-details-container {
    padding: 40px 32px 56px;
  }
}
```

### 3. Chip categorie

Stilul de bază definit în TASK-42 rămâne. Pe desktop, padding-ul și letter-spacing-ul cresc ușor:

```scss
@media (min-width: 56.25rem) {
  .category-chip {
    font-size: 11px;
    letter-spacing: 2.5px;
    padding: 7px 16px;
    margin-bottom: 18px;
  }
}
```

### 4. Rândul titlu + buton "Înapoi"

Pe desktop, titlul și butonul "Înapoi la lista de proprietăți" stau **pe același rând**: titlul pe stânga, butonul pe dreapta, aliniate vertical pe centru.

```html
<div class="title-row">
  <h1 class="property-title">{{ propertyName }}</h1>
  <button type="button" class="back-btn" (click)="goBackToProperties()">
    <span aria-hidden="true">←</span> Înapoi la lista de proprietăți
  </button>
</div>
```

```scss
.title-row {
  display: flex;
  flex-direction: column;     /* mobil: stack */
  gap: 16px;
}

@media (min-width: 56.25rem) {
  .title-row {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  h1.property-title {
    flex: 1 1 auto;
    font-size: clamp(2rem, 3.5vw, 2.75rem);  /* mai mic decât pe mobil-only */
    margin: 0;
    color: #1e1e1e;
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.005em;
  }
  .back-btn {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 12px 22px;        /* păstrat din TASK-42 */
  }
}
```

**Important**: pe mobil (TASK-42), butonul "Înapoi" este la sfârșitul paginii, sub descriere. Pe desktop, butonul migrează în rândul titlului prin schimbarea ordinii DOM **NU este recomandat** — în schimb, folosiți **două instanțe** ale butonului, unul în `title-row` (vizibil doar pe desktop via media query) și unul la sfârșitul paginii (vizibil doar pe mobil).

```html
<!-- În title-row, doar pentru desktop -->
<button type="button" class="back-btn back-btn--inline" ...>...</button>

<!-- La sfârșitul paginii, doar pentru mobil -->
<div class="back-action back-action--bottom">
  <button type="button" class="back-btn back-btn--bottom" ...>...</button>
</div>
```

```scss
.back-btn--inline { display: none; }
.back-action--bottom { display: flex; }

@media (min-width: 56.25rem) {
  .back-btn--inline { display: inline-flex; }
  .back-action--bottom { display: none; }
}
```

Aceasta evită mutarea elementului în DOM și păstrează semantica clean pentru screen readers (deși ambele butoane sunt în accessibility tree — eventual unul cu `aria-hidden="true"` dacă auditul se plânge).

**Alternativă mai curată**: folosiți o singură instanță, dar mutați-o cu CSS Grid `grid-template-areas` în loc de două butoane. Dacă preferați această abordare, discutați cu owner-ul taskului înainte de implementare.

### 5. Liniuța accent

Pe desktop, margin-bottom-ul de sub liniuță crește pentru a separa zona titlu de zona conținut:

```scss
@media (min-width: 56.25rem) {
  .accent-line {
    margin: 22px 0 28px;
  }
}
```

### 6. Secțiunea de conținut — float layout

**Aceasta este schimbarea-cheie a taskului**. Galeria flotează pe dreapta (55% lățime), iar descrierea curge natural pe stânga și **wrap-uiește sub galerie când e mai lungă**.

```html
<section class="content-section">
  <aside class="media-column">
    <div class="gallery">
      <img [src]="..." [alt]="..." />
      <button class="gallery-nav prev" (click)="prevSlide()">‹</button>
      <button class="gallery-nav next" (click)="nextSlide()">›</button>
      <div class="gallery-counter">{{ currentIndex + 1 }} / {{ images.length }}</div>
    </div>
    <div class="thumb-strip">
      <div *ngFor="..." class="thumb" ...>...</div>
    </div>
  </aside>

  <div class="property-description" [innerHTML]="propertyDescription | phoneLink"></div>
</section>
```

```scss
.content-section::after {
  content: '';
  display: block;
  clear: both;
}

/* Mobil (default): galeria deasupra, descrierea dedesubt — TASK-42 */
.media-column { margin-bottom: 24px; }

/* Desktop: galeria flotează pe dreapta */
@media (min-width: 56.25rem) {
  .media-column {
    float: right;
    width: 55%;
    margin-left: 32px;
    margin-bottom: 24px;
  }
}
```

**Cum funcționează wrap-around-ul**: float-ul scoate elementul din flux. Restul conținutului (descrierea) curge natural pe lățimea rămasă (pe stânga floatului). Când conținutul depășește înălțimea floatului, continuă pe **toată lățimea containerului** dedesubt. Acesta este comportament CSS nativ — nu necesită JavaScript sau logică suplimentară. `clear: both` pe pseudo-element `::after` se asigură că secțiunile următoare nu sunt afectate de float.

### 7. Galeria pe desktop

Aspect-ul galeriei se schimbă de la 4:3 (mobil) la **16:10** pe desktop — mai cinematic, valorifică lățimea galeriei:

```scss
@media (min-width: 56.25rem) {
  .gallery {
    aspect-ratio: 16 / 10;
    border-radius: 10px;
  }
  .gallery-nav {
    width: 42px;
    height: 42px;
    font-size: 22px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.18);
  }
  .gallery-nav:hover {
    transform: translateY(-50%) scale(1.08);
  }
  .gallery-nav.prev { left: 14px; }
  .gallery-nav.next { right: 14px; }
  .gallery-counter {
    bottom: 14px; right: 14px;
    font-size: 12px;
    padding: 5px 12px;
  }
}
```

### 8. Thumbnail strip pe desktop

Pe mobil, 4 thumb-uri 1:1. Pe desktop, **4 thumb-uri 4:3** sub galerie (lățime mai mare → poze ușor mai detaliate):

```scss
@media (min-width: 56.25rem) {
  .thumb-strip {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 10px;
  }
  .thumb-strip .thumb {
    aspect-ratio: 4 / 3;
    border-radius: 5px;
  }
  .thumb-strip .thumb:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
  .thumb-strip .thumb.active {
    outline-offset: 2px;
  }
}
```

### 9. Descrierea

Pe desktop, descrierea curge în jurul galeriei. **Nu** are `max-width` constrâns ca pe mobil — lățimea o determină floatul (în coloana stânga curge la `100% - 55% - 32px` ≈ 41% din container; sub galerie curge full-width).

```scss
@media (min-width: 56.25rem) {
  .property-description {
    line-height: 1.75;
    font-size: 1.0625rem;
    max-width: none;             /* override-ează 40rem-ul din TASK-42 */
    margin: 0;
  }
  .property-description ul {
    padding-left: 1.6rem;
  }
  .property-description li {
    margin: 0 0 0.5em;
  }
  .property-description a.phone {
    border-bottom: 1px solid currentColor;
    padding-bottom: 1px;
  }
}
```

### 10. Hover states pe desktop

Pe mobil nu se aplică (nu există hover real). Pe desktop, adăugați:

```scss
@media (min-width: 56.25rem) {
  .back-btn:hover {
    background: #E9DFC9;
    transform: translateY(-1px);
  }
  .back-btn:active { transform: translateY(0); }

  .gallery-nav:hover {
    transform: translateY(-50%) scale(1.08);
  }

  .thumb-strip .thumb:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
}
```

### 11. Breakpoint și ordine media queries

Folosiți `@media (min-width: 56.25rem)` (= 900px) consistent — același prag ca în SCSS-ul existent (acolo era `max-width: 56.25rem` invers). Toate stilurile mobile-first sunt default; desktop-ul le suprascrie.

**Ordinea în fișierul SCSS**:
1. Variabile (`$beige`, `$navy`, etc.)
2. Stiluri mobile (default)
3. `@media (min-width: 56.25rem)` cu overrides desktop

## Fișiere afectate

- `src/app/property-details/property-details.component.scss` — adăugare media query desktop, overrides pentru fiecare element vizual
- `src/app/property-details/property-details.component.html` — adăugare al doilea `<button class="back-btn back-btn--inline">` în `title-row`; marker class-uri pentru afișare condițională

**NU se modifică în TS**: nicio logică nouă (nu este nevoie). Dacă alegeți varianta "două butoane în DOM", al doilea buton apelează aceeași metodă `goBackToProperties()`.

**NU se modifică** (neschimbat):
- `src/app/menu/`, footer
- `src/app/service/seo.service.ts`
- `src/app/pipes/phone-link.pipe.ts`
- Logica GSAP din `goToSlide()` — funcționează identic pe desktop
- Logica de loading photos batch — neschimbată

## Efort

3 ore (overrides CSS + responsive testing la 3 breakpoints).

## Note de implementare

- **SSR safety**: layout-ul este pur CSS. Float-uri și media queries sunt rendat corect SSR-side fără probleme.
- **Float și SEO**: motoarele de căutare parsează DOM-ul, nu CSS-ul. Ordinea source-ului (chip → title → accent → media-column → description) este logică și citită corect — fie pe desktop fie pe mobil.
- **Galeria float**: când `<img>`-ul nu se încarcă, fundalul gri (`background: #f0f0f0`) este vizibil pe spațiul rezervat de aspect-ratio. UX bun.
- **Wrap-around testing**: pentru a vedea efectul activ, testați pe o proprietate cu descriere lungă (>10 bullets) sau adăugați manual bullets în descrierea HTML din baza de date pentru un test temporar.
- **Hover effects**: activate doar via media query `min-width: 56.25rem`. Pe tablete cu touch+pointer (iPad Pro etc.) browser-ul va activa hover-urile pe tap — comportament acceptabil.
- **Accesibilitate**: `flex-wrap: wrap` pe `title-row` previne ca butonul să fie tăiat la viewports înguste (entre 720px și 900px). În cazul wrap-ului, butonul coboară sub titlu — neintenționat dar acceptabil.
- **YouTube section pentru Milostea**: rămâne la sfârșitul template-ului ca acum (`*ngIf="propertyType === 0"`). Va fi refactorizată în task-ul pentru video desktop.

## Întrebări deschise

- **Lățimea galeriei**: 55% (default). Alternativ 50% (echilibru perfect) sau 60% (galeria dominantă). Decizia finală: 55% — testat în mockup, descrierea cu 5 bullets încape vizibil la stânga.
- **Două instanțe back-btn vs CSS Grid mutare**: implementarea recomandată folosește două instanțe + media query display. CSS Grid `grid-template-areas` ar fi mai elegant dar adaugă complexitate la layout. Dacă owner-ul preferă Grid, e acceptabil.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pe desktop (≥ 900px), pagina `/property/:id/:slug` are containerul `max-width: 1080px` cu padding `40px 32px 56px`
- [x] #2 Chip categorie ("Teren de vânzare" / "Casă de vânzare") apare la fel ca pe mobil, dar cu `padding: 7px 16px` și `letter-spacing: 2.5px`
- [x] #3 Titlul (H1) și butonul "Înapoi" stau pe același rând (`.title-row` cu `flex-direction: row, justify-content: space-between, align-items: center`)
- [x] #4 Butonul "Înapoi" din rândul titlului este vizibil pe desktop și ascuns pe mobil; cel de la sfârșitul paginii este invers
- [x] #5 Liniuța accent are `margin: 22px 0 28px` pe desktop (vs `1rem 0` pe mobil)
- [x] #6 Galeria flotează pe dreapta la `width: 55%, margin-left: 32px` pe desktop; pe mobil rămâne full-width (TASK-42)
- [x] #7 Galeria are `aspect-ratio: 16/10` pe desktop (vs 4:3 pe mobil)
- [x] #8 Săgețile de navigare sunt 42×42px pe desktop (vs 38×38px pe mobil), cu hover scale 1.08
- [x] #9 Counter-ul are font 12px și padding `5px 12px` pe desktop
- [x] #10 Thumb-urile au aspect 4:3 pe desktop (vs 1:1 pe mobil), gap 8px, hover lift -2px
- [x] #11 Descrierea curge pe stânga galeriei pe desktop și **wrap-uiește sub galerie când depășește înălțimea galeriei** (verificat manual cu o descriere lungă temporară)
- [x] #12 La viewport < 900px, layout-ul revine la stacked mobil (TASK-42) — fără overlap, fără overflow orizontal
- [x] #13 Header-ul (menubar PrimeNG) și footer-ul aplicației rămân neschimbate
- [x] #14 Pagina rămâne SSR-safe (verificat cu `npm run dev:ssr` + `curl http://localhost:4000/property/...`)
- [x] #15 Secțiunea YouTube hardcodată pentru `propertyType === 0` rămâne funcțională (neatinsă în acest task)
- [x] #16 Verificare vizuală: comparație lângă `.mockups/property-desktop.html` în Chrome DevTools la 1280px și 1440px — diferențe vizuale nesemnificative
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementat ca @media (min-width: 56.25rem) overrides peste baza TASK-42 în același fișier SCSS. Container max-width: 1080px, padding 40px 32px 56px. Title-row flex row cu back-btn--inline (instanță separată) pe dreapta; back-action--bottom ascuns pe desktop. Media-column float: right; width: 55%; margin-left: 32px, descrierea curge natural pe stânga și wrap-uiește sub galerie când e mai lungă (clear: both pe ::after). Galerie 16:10, nav 42px cu hover scale 1.08, thumbs 4:3 cu hover lift -2px. property-description max-width: none + line-height 1.75 / font 1.0625rem. SSR-safe (pur CSS). Build:browser trece fără erori.
<!-- SECTION:FINAL_SUMMARY:END -->
