---
id: TASK-45
title: DESIGN Pagină proprietate desktop — versiune cu video
status: Done
assignee: []
created_date: '2026-05-13 13:30'
updated_date: '2026-05-15 20:55'
labels:
  - design
  - ux
  - desktop
  - property-details
  - video
dependencies:
  - TASK-43
  - TASK-44
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Pentru proprietățile cu tur video, pe desktop avem spațiu suficient să afișăm **video și galerie foto în două coloane separate**, ceea ce dă fiecărui medium spațiul lui și permite utilizatorului să vizualizeze ambele simultan. Spre deosebire de mobil — unde videoul este primul slide al galeriei (TASK-43) din cauza lățimii limitate — pe desktop videoul este o **secțiune independentă**, paralelă cu galeria foto.

**Scope**: doar versiunea desktop **cu video**.

**Referință vizuală**: `.mockups/property-desktop-video.html`.

## Pre-requisite

- **TASK-43** finalizat — frontend-ul are deja câmpul `videoUrl` pe `PropertyDTO`, lazy loading logic, și backend-ul expune câmpurile noi
- **TASK-44** finalizat — layout-ul desktop fără video și base styling-ul pentru `media-row`-uri sunt deja implementate

## Cum

### 1. Header și footer — neschimbate

Identic cu task-urile precedente. Nu se ating `src/app/menu/` sau componenta de footer.

### 2. Diferența-cheie față de TASK-43 (mobil cu video)

Pe **mobil**, videoul intră în array-ul `slides[]` ca primul element (în același carusel cu pozele).
Pe **desktop**, videoul **nu** intră în `slides[]`. Galeria conține doar poze, iar videoul este randat într-o secțiune `<aside>` separată.

**Recomandare implementare**: păstrați un singur model pe componentă (`slides: GallerySlide[]` din TASK-43) și folosiți **media queries CSS** pentru a controla layout-ul. Pe desktop, primul slide (video) este afișat în secțiunea dedicată videoclipului, iar pozele rămân în carusel — gestionat prin DOM duplicat sau prin `*ngIf` pe breakpoint.

**Alternativă (mai curată)**: în component, separați videoul de poze:

```ts
videoSlide: GallerySlide | null = null;
photoSlides: GallerySlide[] = [];

ngOnInit() {
  // ...
  if (prop.videoUrl) {
    this.videoSlide = { type: 'video', src: prop.videoUrl, poster: prop.videoPoster || prop.thumbnail, alt: '...' };
  }
  // photos populate photoSlides via loadPhotosBatch
}
```

Apoi în template:

```html
<!-- Desktop: video standalone -->
<aside class="video-column" *ngIf="videoSlide">
  <video [src]="videoSlide.src" [poster]="videoSlide.poster" preload="none" controls></video>
</aside>

<!-- Galerie (poze, NU include videoul pe desktop) -->
<div class="gallery">
  <ng-container *ngFor="let slide of photoSlides; let i = index">
    <!-- ... -->
  </ng-container>
</div>
```

**Pe mobil**, slide-ul video se concatenează la începutul arrayului care alimentează galeria — comportamentul TASK-43. Implementarea poate fi:

```ts
get gallerySlides(): GallerySlide[] {
  if (this.isMobile && this.videoSlide) {
    return [this.videoSlide, ...this.photoSlides];
  }
  return this.photoSlides;
}
```

Cu `isMobile` calculat dintr-un `BreakpointObserver` din Angular CDK. **SSR-safe**: în SSR, `isMobile` poate fi `false` by default (acceptabil — pe primul render server, layout-ul desktop este randat, iar pe hidratare se ajustează la mobil dacă viewport-ul e mic).

**Alternativă fără JS pentru mobile detection**: randați **ambele structuri** în DOM și folosiți CSS `display: none` pe breakpoint pentru a ascunde varianta nepotrivită. Costul: HTML duplicat, dar zero JS pentru responsive.

Decideți cu owner-ul taskului care abordare e preferată. **Recomandare**: a doua variantă (CSS-only switch), pentru simplitate și SSR safety.

### 3. Rândul media — grid 2 coloane

```html
<section class="media-row">
  <!-- Video player stânga -->
  <aside class="video-column" *ngIf="videoSlide">
    <div class="video-wrapper">
      <video #videoEl
             [src]="videoSlide.src"
             [poster]="videoSlide.poster"
             preload="none"
             playsinline
             controls
             (play)="onVideoPlay()"
             (pause)="onVideoPause()"></video>
    </div>
  </aside>

  <!-- Galerie dreapta -->
  <div class="gallery">
    <img [src]="photoSlides[currentIndex]?.src" [alt]="photoSlides[currentIndex]?.alt" />
    <button class="gallery-nav prev" (click)="prevSlide()">‹</button>
    <button class="gallery-nav next" (click)="nextSlide()">›</button>
    <div class="gallery-counter" *ngIf="photoSlides.length">
      {{ currentIndex + 1 }} / {{ photoSlides.length }}
    </div>
  </div>
</section>
```

```scss
@media (min-width: 56.25rem) {
  .media-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 14px;
  }
}
```

Pe mobil, `media-row` rămâne în layout-ul TASK-43 (single column, video ca prim slide în carusel).

### 4. Aspect ratio 16:9 pentru ambele coloane

Pe desktop cu video, atât video-wrapper cât și gallery folosesc `aspect-ratio: 16/9`. Acesta este o **diferență** față de TASK-44 (desktop fără video, care folosea 16:10). Motivul: videoul este nativ 16:9, deci pentru paritate vizuală cu galeria, ambele primesc 16:9.

```scss
@media (min-width: 56.25rem) {
  .video-wrapper {
    position: relative;
    aspect-ratio: 16 / 9;
    background: #1a1a1a;
    border-radius: 10px;
    overflow: hidden;
  }
  .video-wrapper video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .gallery {
    aspect-ratio: 16 / 9;   /* override față de TASK-44 (16:10) */
  }
}
```

**Notă**: pozele 4:3 vor fi crop-uite ușor mai mult în 16:9 vs 16:10. Acceptabil. Dacă owner-ul preferă consistență strictă, putem folosi 16:10 și acceptăm letterboxing minor pe video — dar 16:9 este recomandarea.

### 5. Poster și buton play (fallback la `<video poster>`)

Folosiți atributul nativ `poster` pe `<video>` element. Înainte ca utilizatorul să apese play, poster-ul (imagine statică) este vizibil. Native browser controls afișează automat un buton de play centrat — **nu este nevoie de overlay custom** ca în mockup.

Mockup-ul are un overlay custom pentru demonstrație vizuală. În implementare, lăsați browser-ul să randeze controlul nativ. Dacă owner-ul preferă un overlay custom (pentru consistență vizuală cu marca), atunci:

```html
<div class="video-wrapper">
  <video #videoEl ... style="display: none;"></video>  <!-- ascuns inițial -->
  <img class="video-poster" [src]="videoSlide.poster" />
  <button class="play-overlay" (click)="playVideo()">
    <span class="play-btn">▶</span>
  </button>
</div>
```

Cu logică TS:

```ts
playVideo() {
  const video = this.videoEl.nativeElement;
  video.style.display = 'block';
  this.posterVisible = false;
  video.play();
}
```

**Decizie recomandată**: folosiți `<video controls poster>` nativ — minimal cod, accesibil out-of-the-box, comportament familiar utilizatorilor.

### 6. Thumb strip — full-width sub rândul media, 6 thumbs

Pe desktop fără video (TASK-44), thumbs erau 4 sub galeria floatată. Pe desktop cu video, galeria este 50% width, thumbs migrează la **full-width sub** rândul media, cu 6 thumbs:

```scss
@media (min-width: 56.25rem) {
  .thumb-strip {
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    margin-top: 0;       /* spațiul vine din margin-bottom la media-row */
    margin-bottom: 48px;
  }
  .thumb-strip .thumb {
    aspect-ratio: 4 / 3;
    border-radius: 6px;
  }
}
```

**Comportamentul thumb-urilor**: click pe thumb → `goToSlide(i)` schimbă imaginea principală din galerie. **Thumb-urile nu reprezintă videoul** pe desktop (videoul are propriul player vizibil în coloana stângă). Deci doar pozele apar ca thumb-uri.

### 7. Descrierea — aliniată cu videoclipul

Descrierea este sub thumb strip, **aliniată la marginea stângă a videoclipului** și are aceeași lățime ca video-column (50% minus jumătatea gap-ului):

```scss
@media (min-width: 56.25rem) {
  .property-description {
    max-width: calc(50% - 12px);  /* 50% din container minus jumătate din gap-ul de 24px */
    margin: 0;                     /* nu centrată; aliniată la stânga */
    line-height: 1.8;
    font-size: 1.0625rem;
  }
}
```

Pe mobil, override (TASK-43 + TASK-44 base):

```scss
@media (max-width: 56.25rem) {
  .property-description {
    max-width: none;
    margin: 0 0 28px;
  }
}
```

### 8. Title-row și back-btn

Identice cu TASK-44 — titlul stânga, butonul "Înapoi" pe dreapta, pe același rând.

### 9. Eliminare YouTube hardcodat pentru Milostea

Identic cu TASK-43 — secțiunea `<app-youtube-player>` pentru `propertyType === 0` se elimină complet. Proprietatea Milostea primește `videoUrl` în baza de date și este afișată automat de noul mecanism.

## Fișiere afectate

- `src/app/property-details/property-details.component.html` — adăugare `<aside class="video-column">` în `media-row`, randare condiționată cu `*ngIf="videoSlide"`
- `src/app/property-details/property-details.component.scss` — overrides desktop pentru `media-row`, `video-wrapper`, `gallery` (16:9 vs 16:10), `thumb-strip` (6 thumbs full-width), `property-description` (max-width calc(50% - 12px))
- `src/app/property-details/property-details.component.ts` — split între `videoSlide` și `photoSlides`, pause-on-slide-change, eliminare import `YoutubePlayerComponent`

**NU se modifică în DTO**: câmpurile `videoUrl` și `videoPoster` au fost deja adăugate în TASK-43.

**NU se modifică** (neschimbat):
- `src/app/menu/`, footer
- `src/app/youtube-player/` — neutilizat de detalii dar rămâne în repo
- Backend Java — câmpurile sunt deja expuse de TASK-43

## Efort

4 ore (frontend) — split model, layout grid desktop, responsive testing.

## Note de implementare

- **SSR safety**: `<video preload="none" poster="...">` este SSR-safe; nu face requests în server-side render.
- **Sincronizare video pe mobil vs desktop**: pe mobil videoul e slide 1 din galerie (TASK-43). Pe desktop, videoul e standalone. Asigurați-vă că pauza video-ului la schimbarea slide-ului (TASK-43) **NU** se aplică pe desktop unde videoul e independent — verificați logica `videoElements?.forEach(...)` să fie scoped corect.
- **Pause-on-navigate-away**: când utilizatorul apasă `›` în galerie (poze), videoul **NU** trebuie pauzat (e standalone, neutilizat de galerie). Doar dacă utilizatorul derulează în jos sau părăsește pagina, videoul continuă să ruleze — comportament standard.
- **CORS**: vezi nota din TASK-43 — bucket-ul GCS trebuie să servească cu `Access-Control-Allow-Origin: *`.
- **Performanță**: cu `preload="none"`, descărcarea videoului începe doar după click pe play. Verificați în Chrome DevTools că `*.mp4` nu apare în Network tab până la interacțiunea utilizatorului.
- **Lazy loading thumbs**: dacă o proprietate are 30+ poze, primele 6 thumb-uri afișate sunt fine. Pentru "Vezi toate (N)" — feature pentru un task viitor.

## Întrebări deschise

- **Layout când proprietatea NU are video pe desktop**: ar trebui automat să se cadă la layout-ul TASK-44 (float right, no grid). Verificați că `*ngIf="videoSlide"` pe video-column și CSS condițional (folosind `.media-row.has-video`) face fallback corect.
- **Aspect ratio 16:9 vs 16:10**: dacă designerii viitori vor preferea consistență strictă între cele două versiuni desktop (cu și fără video), poate face sens să mutăm și TASK-44 la 16:9. Decizie de luat post-implementare după review vizual.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pe desktop (≥ 900px), proprietățile cu `videoUrl` afișează video pe stânga (50%) și galerie foto pe dreapta (50%), grid cu gap 24px
- [x] #2 Atât video-wrapper cât și galeria au `aspect-ratio: 16/9` pe desktop
- [x] #3 Pe desktop, videoul **NU** este primul slide din galerie — galeria conține doar poze; videoul are coloana sa dedicată
- [x] #4 Pe mobil (< 900px), comportamentul rămâne cel din TASK-43: video ca prim slide în galerie
- [x] #5 Thumb strip este full-width sub rândul media, cu 6 thumb-uri 4:3 pe desktop
- [x] #6 Descrierea este sub thumb strip, aliniată la marginea stângă a videoclipului, cu `max-width: calc(50% - 12px)` și `margin: 0`
- [x] #7 Pe desktop, schimbarea slide-ului în galerie (poze) NU afectează playback-ul video-ului
- [x] #8 Videoul are `preload="none"` — fișierul `.mp4` se descarcă doar după click pe play (verificat în DevTools Network)
- [x] #9 Pentru proprietăți fără `videoUrl`, pagina cade la layout-ul TASK-44 (float right) — videoul standalone nu este randat
- [x] #10 Title-row, chip categorie, accent line, back-btn — identice cu TASK-44
- [x] #11 Codul YouTube hardcodat pentru `propertyType === 0` este eliminat (sau confirmat eliminat din TASK-43)
- [x] #12 Header-ul și footer-ul aplicației rămân neschimbate
- [x] #13 Pagina rămâne SSR-safe (`npm run dev:ssr` + `curl` returnează HTML brut cu `<video>` element corect)
- [x] #14 Verificare vizuală: comparație lângă `.mockups/property-desktop-video.html` în Chrome DevTools la 1280px și 1440px — diferențe vizuale nesemnificative
- [x] #15 Verificare responsive: la 1024px (zona de tranziție), layout-ul desktop e activ; la 768px, layout-ul mobil e activ; tranziția între ele e fluentă
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementat ca branch CSS-only paralel cu mobile-with-video. videoSlide și photoSlides separate în component; pe desktop video este standalone (aside.video-column cu .video-wrapper aspect 16:9), galeria photo este alături (16:9 override față de TASK-44 16:10) într-un .media-row grid 1fr 1fr gap 24px. Thumb strip full-width 6 coloane 4:3 sub media-row. Descrierea cu max-width: calc(50% - 12px) aliniată stânga la video column. Mutual exclusivity: .mobile-with-video display:block default + display:none pe desktop; .media-row + .thumb-strip--video-desktop display:none default + display:grid pe desktop. Photo-track ref shared între no-video gallery și desktop-with-video gallery (mutual exclusive prin *ngIf pe propertyVideoUrl), deci o singură pereche prevSlide/nextSlide/goToSlide. Playback-ul video standalone nu e afectat de navigarea galeriei (pauseMobileVideos vizează doar mobileVideoElements via @ViewChildren). Hardcoded YouTube section eliminată complet.
<!-- SECTION:FINAL_SUMMARY:END -->
