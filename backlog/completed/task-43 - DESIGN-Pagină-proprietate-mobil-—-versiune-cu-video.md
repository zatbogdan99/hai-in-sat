---
id: TASK-43
title: DESIGN Pagină proprietate mobil — versiune cu video
status: Done
assignee: []
created_date: '2026-05-13 12:30'
updated_date: '2026-05-15 20:54'
labels:
  - design
  - ux
  - mobile
  - property-details
  - video
dependencies:
  - TASK-42
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Unele proprietăți vor avea atașat un **tur video** (stocat în Google Cloud Storage, bucket public). Pe pagina `/property/:id/:slug` (mobil), videoclipul trebuie integrat **ca primul slide din galeria existentă**, nu ca secțiune separată. Comportamentul așteptat: utilizatorul deschide pagina, vede ca prim slide un poster cu buton de play; dacă apasă play se redă videoul inline, dacă apasă săgeata `›` trece la prima poză. Pentru proprietățile fără video, galeria începe direct cu prima poză (vezi TASK-42).

**Scope**: doar versiunea mobil. Desktop intră în task separat.

**Referință vizuală**: `.mockups/property-mobile-video.html` (varianta cu video) și `.mockups/property-mobile.html` (varianta fără video, pentru comparație).

## Pre-requisite

**TASK-42 trebuie finalizat înainte**. Acest task adaugă suport pentru video peste structura nouă a galeriei. Dacă TASK-42 nu a fost încă implementat, finalizați-l mai întâi.

## Cum

### 1. Câmp `videoUrl` pe `PropertyDTO`

Adăugați un câmp opțional pe DTO și pe modelul Mongo din backend-ul Java:

```ts
// src/app/dto/property.dto.ts
export interface PropertyDTO {
  id?: string;
  name: string;
  description: string;
  type: PropertyType;
  thumbnail: string;
  photos?: string[];
  sortOrder?: number;
  videoUrl?: string;          // ← NOU: URL public din bucket GCS, ex: "https://storage.googleapis.com/hai-in-sat-videos/milostea.mp4"
  videoPoster?: string;       // ← NOU OPȚIONAL: URL poster image (frame extras din video). Dacă lipsește, folosiți `thumbnail`.
}
```

**Backend (Java/Spring)**: adăugați aceleași două câmpuri pe entitatea `Property` și pe endpoint-urile `GET /properties` și `GET /properties/:id`. Decizia de încărcare a fișierului video în bucket este out-of-scope pentru acest task — frontend-ul presupune că URL-ul există deja.

### 2. Logică în component

În `property-details.component.ts`:

```ts
interface GallerySlide {
  type: 'image' | 'video';
  src: string;
  poster?: string;   // doar pentru video
  alt: string;
}

slides: GallerySlide[] = [];

// În loadPropertyDetails, după ce primiți prop:
if (prop.videoUrl) {
  this.slides.push({
    type: 'video',
    src: prop.videoUrl,
    poster: prop.videoPoster || prop.thumbnail,
    alt: `${propertyTypeLabel}: ${prop.name} — tur video`
  });
}
// Apoi în loadPhotosBatch, când primiți pozele:
const photoSlides = resp.photos.map((src, idx) => ({
  type: 'image' as const,
  src: src.trim(),
  alt: `${propertyTypeLabel}: ${name} - Imagine ${offset + idx + 1}`
}));
this.slides = [...this.slides, ...photoSlides];
```

`images: any[]` actual se înlocuiește cu `slides: GallerySlide[]`. Toate referințele la `images` din template și TS se redenumesc.

### 3. Template — randare condiționată per slide

În `property-details.component.html`, în loop-ul de slide-uri:

```html
<div class="gallery">
  <div #carouselTrack class="carousel-track">
    <div *ngFor="let slide of slides; let i = index"
         class="gsap-carousel-slide"
         [class.active]="i === currentIndex">

      <!-- IMAGE slide -->
      <img *ngIf="slide.type === 'image'"
           [src]="slide.src" [alt]="slide.alt" class="slide-media" />

      <!-- VIDEO slide -->
      <ng-container *ngIf="slide.type === 'video'">
        <video #videoEl
               class="slide-media slide-video"
               [src]="slide.src"
               [poster]="slide.poster"
               preload="none"
               playsinline
               controls
               (play)="onVideoPlay(i)"
               (pause)="onVideoPause(i)"></video>
      </ng-container>
    </div>
  </div>

  <button class="gallery-nav prev" (click)="prevSlide()" aria-label="Anterior">‹</button>
  <button class="gallery-nav next" (click)="nextSlide()" aria-label="Următor">›</button>

  <div class="gallery-counter" *ngIf="slides.length">
    {{ currentIndex + 1 }} / {{ slides.length }}
  </div>
</div>
```

### 4. SCSS pentru slide-uri media

```scss
.slide-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.slide-video {
  background: #000;       /* letterbox negru când aspect-ul nu se potrivește perfect */
  object-fit: contain;    /* video nu se decupează — show entire frame */
}
```

**Aspect-ul galeriei**: `aspect-ratio: 4 / 3` (același ca TASK-42). Videoclipurile 16:9 vor avea benzi negre subțiri sus/jos, ceea ce este acceptabil. Nu se schimbă aspect-ul pentru a păstra consistența cu pozele.

### 5. Lazy load + pauzare la schimbare slide

```ts
@ViewChildren('videoEl') videoElements!: QueryList<ElementRef<HTMLVideoElement>>;

goToSlide(index: number): void {
  // pauzează orice video care rulează
  this.videoElements?.forEach(ref => {
    if (!ref.nativeElement.paused) {
      ref.nativeElement.pause();
    }
  });

  // ... restul logicii GSAP existente
}
```

`preload="none"` pe `<video>` garantează că fișierul `.mp4` nu se descarcă la încărcarea paginii — doar poster-ul (imaginea statică). Descărcarea pornește la primul click pe play.

### 6. Thumbnail strip — primul thumb cu indicator video

```html
<div class="thumb-strip" *ngIf="slides.length > 1">
  <div *ngFor="let slide of slides.slice(0, 4); let i = index"
       class="thumb"
       [class.active]="i === currentIndex"
       [class.video-thumb]="slide.type === 'video'"
       (click)="goToSlide(i)">
    <img [src]="slide.type === 'video' ? slide.poster : slide.src" alt="" />
  </div>
</div>
```

SCSS pentru indicator video pe thumbnail (triunghi alb cu dim deasupra pozei):

```scss
.thumb-strip .thumb.video-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
}
.thumb-strip .thumb.video-thumb::before {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 0; height: 0;
  border-left: 10px solid #fff;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  z-index: 2;
}
.thumb-strip .thumb { position: relative; }   /* necesar pentru ::after/::before */
```

### 7. Counter inclusiv video

`{{ currentIndex + 1 }} / {{ slides.length }}` — videoul contează ca slide 1, deci pentru o proprietate cu 1 video + 12 poze counter-ul afișează "1 / 13" pe video, "2 / 13" pe prima poză etc. **NU se afișează badge sau text "VIDEO"** pe slide-ul video — playerul nativ este suficient ca semnal vizual.

### 8. Înlocuire YouTube hardcodat pentru Milostea

Componenta actuală conține:
```html
<div *ngIf="propertyType === 0" class="video-container large-screen">
  <app-youtube-player [videoId]="'rhuyNfSvz0s'" ...></app-youtube-player>
</div>
<div *ngIf="propertyType === 0" class="small-screen">
  <app-youtube-player [videoId]="'rhuyNfSvz0s'" ...></app-youtube-player>
</div>
```

Acestea se elimină complet. Proprietatea Milostea va primi `videoUrl` în baza de date (după ce videoul e încărcat în bucket), iar mecanismul nou îl va afișa automat ca prim slide în galerie.

**Consecințe**:
- `YoutubePlayerComponent` poate fi păstrat în repo dacă mai e folosit altundeva, dar importul din `property-details.component.ts` se elimină.
- `task-14 - Lazy-load-YouTube-iframe-API-doar-pe-rute-cu-video.md` din backlog devine **obsolet** — videoul nu mai e YouTube. Marcați-l ca won't-do sau actualizați-l să reflecte noua sursă (GCS bucket). Recomandare: mutați task-14 în `backlog/wont-do/` cu o notă de tipul "înlocuit de noua arhitectură video din TASK-43".

### 9. Header și footer — neschimbate

Identic cu TASK-42: nu se ating nici `src/app/menu/`, nici componenta de footer.

## Fișiere afectate

- `src/app/property-details/property-details.component.html` — randare condiționată `<img>` / `<video>` per slide
- `src/app/property-details/property-details.component.scss` — stiluri pentru `.slide-video`, thumbnail video indicator
- `src/app/property-details/property-details.component.ts` — model `GallerySlide`, `slides[]`, pauzare video pe goToSlide, eliminare import `YoutubePlayerComponent`
- `src/app/dto/property.dto.ts` — câmpuri noi `videoUrl?: string; videoPoster?: string;`

**Backend (alt repo `java.hai-in-sat`)**:
- Entitatea `Property` — câmpuri noi `videoUrl`, `videoPoster`
- DTO de răspuns pe `GET /properties` și `GET /properties/:id` — expun aceleași câmpuri

**Backlog**:
- `backlog/tasks/task-14 - Lazy-load-YouTube-iframe-API-doar-pe-rute-cu-video.md` — mutat în `wont-do/` sau actualizat

**NU se modifică** (neschimbat):
- `src/app/menu/`, footer
- `src/app/youtube-player/` — rămâne în repo neutilizat de pagina detalii
- `src/app/service/seo.service.ts`

## Efort

5 ore (frontend) + 1-2 ore (backend Java — adăugare câmpuri DTO + endpoint).

## Note de implementare

- **SSR safety**: `<video>` element fără `autoplay` este SSR-safe. `preload="none"` previne orice request HTTP în render-ul server-side.
- **GSAP**: animația cross-fade existentă funcționează identic pe `<video>` ca pe `<img>` — animă wrapper-ul, nu conținutul. Singura adaptare: pauzează videoul activ înainte de tranziție.
- **Performanță**: `preload="none"` + poster image = zero bandwidth video pe load inițial. Asset-ul GCS se descarcă doar la primul click pe play. Verificați în Chrome DevTools Network tab.
- **Cache și CORS**: bucket-ul GCS trebuie să servească fișierul cu header `Access-Control-Allow-Origin: *` (sau `https://hai-în-sat.ro`) ca să permită playback inline. Detaliu de configurare bucket, out-of-scope pentru frontend.
- **Format video**: recomandat MP4 H.264 + AAC (compatibilitate maximă mobile Safari + Chrome). Bitrate ~2-4 Mbps pentru tur video imobiliar la 1080p. Dimensiune fișier sub 50 MB pentru un video de 1-2 minute.
- **Fallback fără JS**: `<video>` rendezează corect SSR cu poster; user-ul fără JavaScript vede poster-ul static. Nu e nevoie de fallback dedicat.
- **Accesibilitate**: `<video>` cu `controls` are deja keyboard navigation nativ (space = play/pause, săgețile = seek). Adăugați `aria-label="Tur video — {{ propertyName }}"` pe elementul video pentru screen readers.

## Întrebări deschise

- **Multiple videoclipuri per proprietate?** Modelul actual (`videoUrl: string`) presupune **maxim unul**. Dacă în viitor o proprietate va avea 2-3 videoclipuri (tur exterior, tur interior, drona), trebuie schimbat la `videoUrls: string[]` și un loop care le adaugă pe toate ca slide-uri la început. **Decizie**: pentru MVP, `videoUrl: string` (max 1 video). Re-evaluat la cerere.
- **Thumbnail-ul video** — automat din video sau manual upload? Pentru MVP, manual: admin-ul încarcă și fișierul video și un poster JPG/AVIF separat. Generare automată cu `ffmpeg` server-side intră într-un task separat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `PropertyDTO` are câmpurile `videoUrl?: string` și `videoPoster?: string`, expuse de backend pe `GET /properties/:id`
- [x] #2 Când `prop.videoUrl` este setat, primul slide din galerie este un `<video>` cu poster (din `videoPoster` sau fallback `thumbnail`)
- [x] #3 Când `prop.videoUrl` lipsește, galeria începe direct cu prima poză (comportament identic cu TASK-42)
- [x] #4 Video are `preload="none"` — fișierul `.mp4` NU se descarcă până când utilizatorul nu apasă play (verificat în Chrome DevTools Network)
- [x] #5 La navigarea către alt slide cu `‹` / `›` / thumbnail / swipe, dacă videoul rula, se pauzează automat
- [x] #6 Counter-ul afișează poziția slide-ului video ca `1 / N` unde N = nr_poze + 1 (sau N = nr_poze dacă nu e video)
- [x] #7 Primul thumbnail (când există video) afișează un triunghi ▶ alb peste un dim semi-transparent
- [x] #8 NU există badge "VIDEO" sau text pe slide-ul video — doar player-ul nativ și butonul de play
- [x] #9 Aspect-ratio galerie rămâne 4:3, identic cu varianta fără video; videoclipurile 16:9 letterboxează cu fundal negru
- [x] #10 Animația GSAP de cross-fade funcționează identic pe slide-uri video și image
- [x] #11 Codul YouTube hardcodat pentru `propertyType === 0` este eliminat din `property-details.component.html` și `.ts`
- [x] #12 `task-14` din backlog este mutat în `wont-do/` sau actualizat pentru a reflecta noua sursă (GCS)
- [x] #13 Header-ul (menubar) și footer-ul aplicației rămân neschimbate
- [x] #14 Pagina rămâne SSR-safe (`npm run dev:ssr` + `curl` returnează HTML brut cu `<video>` element corect, fără erori)
- [x] #15 Verificare vizuală: comparație lângă `.mockups/property-mobile-video.html` în Chrome DevTools la 390px — diferențe vizuale nesemnificative
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementat împreună cu TASK-45 într-un singur pass în property-details.component. Model GallerySlide nou (type: image|video, src, poster, alt); videoSlide derivat din prop.videoUrl, photoSlides populat din getPhotos batch, mobileSlides = [videoSlide, ...photoSlides] precomputat în rebuildMobileSlides() (evită getter pe ciclu de CD). Carusel mobile cu video randat condiționat (img vs video element cu preload=none playsinline controls). Pauza GSAP păstrată; pauseMobileVideos() invocat la goToMobileSlide via @ViewChildren mobileVideoEl. Thumb video-indicator pseudo-elements (::before triunghi alb + ::after dim 35%). Eliminat YoutubePlayerComponent import, BuyEnum, propertyType — secțiunea hardcodată *ngIf propertyType===0 dispărută. PropertyDTO.videoUrl populat de backend din GCS (task-46). task-14 mutat în wont-do/.
<!-- SECTION:FINAL_SUMMARY:END -->
