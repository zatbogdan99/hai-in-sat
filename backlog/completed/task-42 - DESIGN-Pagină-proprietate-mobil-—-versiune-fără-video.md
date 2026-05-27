---
id: TASK-42
title: DESIGN Pagină proprietate mobil — versiune fără video
status: Done
assignee: []
created_date: '2026-05-13 12:00'
updated_date: '2026-05-15 20:10'
labels:
  - design
  - ux
  - mobile
  - property-details
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Pagina actuală `/property/:id/:slug` are conținut "aruncat" pe telefon: span gri "Hai în sat" deasupra titlului (etichetă fără sens contextual), descriere imediat sub titlu, galerie sub descriere, săgeți de navigare separate centrat sub galerie, buton "Înapoi" text-only verde. Rezultatul vizual e dezorganizat. Acest task reorganizează layout-ul mobil într-o variantă minimalistă, consistentă cu paleta și tipografia restului aplicației (Libre Baskerville, navy `#042677`, beige `#F4EFE5`, verde închis `#1b3a2a`).

**Scope**: doar versiunea mobil **fără video**. Versiunea cu video și versiunea desktop intră în task-uri separate.

**Referință vizuală**: `.mockups/property-mobile.html` (deschideți în browser pentru comparație lângă implementare).

## Cum

### 1. Header și footer — neschimbate

Nu se modifică nici `src/app/menu/...`, nici componenta de footer. Restricționați modificările strict la `src/app/property-details/`.

### 2. Înlocuiți span-ul "Hai în sat" cu chip de categorie

În `property-details.component.html`, linia `<span>Hai în sat</span>` se înlocuiește cu un chip beige care afișează tipul proprietății în mod uppercase:

- `propertyType === 'land'` → `Teren de vânzare`
- `propertyType === 'house'` → `Casă de vânzare`

Stil chip (SCSS — clasă nouă `.category-chip`):
```scss
.category-chip {
  display: inline-block;
  background: #F4EFE5;
  color: #1b3a2a;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 9999px;
  margin-bottom: 14px;
}
```

Sursa adevărului pentru tip: `prop.type` din `PropertyDTO` (deja existent în component). Adăugați un getter sau o proprietate `categoryLabel: string` care întoarce string-ul corect.

### 3. Titlu și liniuță accent — neschimbate

Stilurile `.property-info h1` și `.property-info hr` rămân identice cu cele din SCSS-ul actual:
- H1: `font-size: clamp(2rem, 5vw, 3rem)`, weight default, color `#1e1e1e`
- HR: `width: 80px; height: 4px; background-color: #005baa; border: none; margin: 1rem 0;`

### 4. Reordonare conținut

Ordinea elementelor pe mobil devine (de sus în jos):

1. Chip categorie (`Teren de vânzare` / `Casă de vânzare`)
2. H1 titlu (`{{ propertyName }}`)
3. `<hr>` liniuță accent
4. Galerie (cu thumbnails dedesubt)
5. Descriere
6. Buton "Înapoi"

**Descrierea trebuie mutată DUPĂ galerie** (acum este înaintea ei).

### 5. Galerie cu navigare overlay și counter

Înlocuiește blocul `.carousel-wrapper` + `.carousel-controls` separate cu o galerie unde săgețile sunt overlay pe marginile pozei:

HTML:
```html
<div class="gallery">
  <img [src]="images[currentIndex].itemImageSrc" [alt]="images[currentIndex].alt" />
  <button class="gallery-nav prev" (click)="prevSlide()" aria-label="Imagine anterioară">‹</button>
  <button class="gallery-nav next" (click)="nextSlide()" aria-label="Imagine următoare">›</button>
  <div class="gallery-counter" *ngIf="images.length">
    {{ currentIndex + 1 }} / {{ images.length }}
  </div>
</div>
```

SCSS:
```scss
.gallery {
  position: relative;
  aspect-ratio: 4 / 3;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  margin: 20px 0 10px;
}
.gallery img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px; height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.92);
  border: none;
  box-shadow: 0 2px 10px rgba(0,0,0,0.18);
  cursor: pointer;
  font-size: 20px;
  color: #005baa;
  display: grid; place-items: center;
  line-height: 1; padding: 0;
}
.gallery-nav:active { transform: translateY(-50%) scale(0.95); }
.gallery-nav.prev { left: 10px; }
.gallery-nav.next { right: 10px; }
.gallery-counter {
  position: absolute;
  bottom: 12px; right: 12px;
  background: rgba(0,0,0,0.62);
  color: #fff;
  font-size: 11px;
  letter-spacing: 0.5px;
  padding: 5px 10px;
  border-radius: 9999px;
}
```

**Important**: trebuie păstrată animația GSAP existentă din `goToSlide()`. Decizia de implementare: poate trebui să adaptăm template-ul ca să rămână track-ul cu toate slide-urile poziționate absolut (`.gsap-carousel-slide`), iar navarea overlay (`.gallery-nav`) și counter-ul să fie copii ai aceluiași wrapper poziționat relativ. Alternativ, eliminați GSAP și animați cu un simplu `<img>` care își schimbă `src` la click — discutați cu owner-ul taskului înainte de a renunța la GSAP.

### 6. Bandă thumbnail-uri (4 pe rând pe mobil)

Sub galerie, adăugați o bandă de thumbnail-uri click-abile. Pe mobil afișați **maxim 4** (primele 4 sau o fereastră în jurul thumb-ului activ — la alegere; cel mai simplu: primele 4 + dacă există mai multe poze, ultimul thumb să fie un "+ N" overlay).

```html
<div class="thumb-strip" *ngIf="images.length > 1">
  <div *ngFor="let img of images.slice(0, 4); let i = index"
       class="thumb"
       [class.active]="i === currentIndex"
       (click)="goToSlide(i)">
    <img [src]="img.itemImageSrc" alt="" />
  </div>
</div>
```

```scss
.thumb-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 22px;
}
.thumb-strip .thumb {
  aspect-ratio: 1 / 1;
  background: #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
}
.thumb-strip .thumb.active {
  opacity: 1;
  outline: 2px solid #005baa;
  outline-offset: 1px;
}
.thumb-strip .thumb img {
  width: 100%; height: 100%;
  object-fit: cover;
}
```

### 7. Descriere — stil neschimbat, doar poziție nouă

Descrierea folosește `[innerHTML]="propertyDescription | phoneLink"` exact ca acum. Singura modificare este poziția în template (după galerie) și o ajustare minoră de stil:

```scss
.property-description {
  color: #111;
  line-height: 1.7;
  font-size: 1rem;
  overflow-wrap: anywhere;
  max-width: 40rem;
  margin: 0 0 28px;
}
```

Conținutul HTML din backend (deja conține `<ul><li>...`) rămâne neschimbat. Stilul listei (`list-style: disc`) este moștenit de la browser default sau de la `styles.scss` — verificați că `<ul>`-urile din `[innerHTML]` afișează cu buline pe mobil. Dacă nu, adăugați:

```scss
.property-description ul {
  list-style: disc;
  padding-left: 1.4rem;
  margin: 0;
}
.property-description li {
  margin: 0 0 0.35em;
}
```

### 8. Buton "Înapoi" — pill beige, instanță unică

Eliminați **ambele** instanțe actuale (`.back-button--header` și `.back-button--mobile`) și înlocuiți-le cu **un singur** buton centrat sub descriere, stilul pill beige.

HTML:
```html
<div class="back-action">
  <button type="button" class="back-btn" (click)="goBackToProperties()">
    <span aria-hidden="true">←</span> Înapoi la lista de proprietăți
  </button>
</div>
```

SCSS:
```scss
.back-action {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #F4EFE5;
  color: #1b3a2a;
  border: none;
  padding: 12px 22px;
  border-radius: 9999px;
  font-family: var(--font-base);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.back-btn:hover, .back-btn:active { background: #E9DFC9; }
```

**Fără separator deasupra**: nu adăugați `border-top` sau `<hr>`. Doar `margin-top: 12px` față de descriere.

### 9. PrimeNG `p-button` — eliminat din această zonă

Cele două instanțe existente folosesc `<p-button label="Înapoi la lista de proprietăți" ... styleClass="p-button-text">`. Acestea trec la `<button>` HTML nativ cu clasa `.back-btn`. Aceasta înseamnă că importul `Button` din `primeng/button` din `property-details.component.ts` poate fi eliminat dacă nu mai este folosit nicăieri în component (verificați).

### 10. Sectiunea YouTube hardcodată pentru `propertyType === 0`

În `property-details.component.html` există un `*ngIf="propertyType === 0"` care randează `<app-youtube-player [videoId]="'rhuyNfSvz0s'" ...>`. **Lăsați-o pentru moment exact unde este (la sfârșitul template-ului)**. Aceasta va fi refactorizată într-un task separat care implementează versiunea cu video pentru toate proprietățile (din bucket GCS).

### 11. Cleanup CSS

După implementare, în `property-details.component.scss` se pot elimina (în limita compatibilității cu desktop, care va fi tratat separat):
- `.carousel-wrapper`, `.carousel-track`, `.carousel-controls`, `.carousel-button` — dacă galeria nouă le înlocuiește complet
- `.back-button`, `.back-button--header`, `.back-button--mobile` și media query-urile asociate
- Adresa media query `@media (max-width: 56.25rem)` se reduce semnificativ — păstrați doar regulile care încă sunt necesare pentru mobil

**Atenție**: dacă desktop-ul refolosește același template, păstrați compatibilitatea până la finalizarea task-ului de desktop. Cel mai sigur: implementați noul layout ca default (mobil-first), iar desktop-ul își va adăuga modifiers proprii ulterior.

## Fișiere afectate

- `src/app/property-details/property-details.component.html` — rescris template-ul (reordonare, înlocuire structuri)
- `src/app/property-details/property-details.component.scss` — adăugare stiluri noi, curățare stiluri vechi
- `src/app/property-details/property-details.component.ts` — adăugare getter `categoryLabel`, posibilă eliminare import `Button` din PrimeNG
- `.mockups/property-mobile.html` — **referință**, nu se modifică

**NU se modifică**:
- `src/app/menu/...` (header) — neschimbat
- `src/app/footer/...` (footer) — neschimbat
- `src/app/service/seo.service.ts` — neschimbat
- `src/app/pipes/phone-link.pipe.ts` — neschimbat
- `src/app/youtube-player/...` — neschimbat (va fi atinsă într-un alt task pentru video)

## Efort

3 ore (implementare + verificare în Chrome DevTools mobile + curățare CSS).

## Note de implementare

- **SSR safety**: orice cod nou nu trebuie să atingă `window`/`document`/`localStorage` în `ngOnInit` fără gardă `isPlatformBrowser`. Click handlers (`(click)`) sunt safe — se atașează doar în browser.
- **GSAP**: dacă păstrați animația cross-fade pentru galerie, trebuie să fie compatibilă cu noua structură (un singur `<img>` vizibil + thumb-uri click-abile vs. track cu toate slide-urile absolute). Cel mai simplu: păstrați track-ul absolut și puneți `.gallery-nav` + `.gallery-counter` ca surori cu track-ul, în wrapper-ul `.gallery`.
- **Accesibilitate**: butoanele de navigare au `aria-label`; chip-ul "Teren de vânzare" nu necesită `role` special; thumb-urile activabile prin tastatură (`tabindex="0"` + handler `keydown.enter/space` — opțional dacă deja sunt `<button>`).
- **Performanță**: thumb-urile încarcă imagini reduse? Pe API-ul actual nu există variante thumbnail dedicate — folosesc același URL ca imaginea mare. Acceptabil pentru MVP; un task separat poate adresa thumbnails server-side.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Pe mobil (< 720px), pagina `/property/:id/:slug` afișează în ordine: chip categorie → titlu → liniuță accent → galerie → thumb-uri → descriere → buton "Înapoi"
- [x] #2 Chip categorie afișează `Teren de vânzare` pentru `prop.type === 'land'` și `Casă de vânzare` pentru `prop.type === 'house'`, cu fundal `#F4EFE5` și text `#1b3a2a`
- [x] #3 Stilul titlului (H1) și al liniuței accent (`<hr>` cu `#005baa`) este identic cu cel actual
- [x] #4 Galeria are aspect-ratio 4:3, border-radius 8px, săgeți rotunde 38px overlay pe margini, counter `X / Y` în colțul dreapta-jos
- [x] #5 Sub galerie apar maxim 4 thumbnail-uri pe rând, cu thumb-ul activ marcat cu outline `#005baa`
- [x] #6 Descrierea apare DUPĂ galerie (nu deasupra titlului ca acum) și păstrează stilul actual (bullets, phone link, color text)
- [x] #7 Există exact UN singur buton "Înapoi la lista de proprietăți", stil pill beige (`#F4EFE5` bg, `#1b3a2a` text), centrat, fără border-top sau `<hr>` deasupra
- [x] #8 Header-ul (menubar PrimeNG) și footer-ul aplicației rămân neschimbate (nici un fișier din `src/app/menu/` sau din componenta de footer nu este modificat)
- [x] #9 Funcția `goBackToProperties()` păstrează exact comportamentul actual (query params: page, size, type)
- [x] #10 Animația GSAP existentă din `goToSlide` continuă să funcționeze între poze (sau este înlocuită cu o tranziție echivalentă vizual)
- [x] #11 Pagina rămâne SSR-safe (testat cu `npm run dev:ssr` + `curl http://localhost:4000/property/...` — HTML brut conține titlul, descrierea, canonical, og:image)
- [x] #12 Secțiunea YouTube hardcodată pentru `propertyType === 0` rămâne funcțională (nu este eliminată în acest task)
- [x] #13 Verificare vizuală: comparație lângă `.mockups/property-mobile.html` în Chrome DevTools la lățime 390px — diferențe vizuale nesemnificative
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implementat mobile-first împreună cu TASK-44 în același pass. Modificări: property-details.component.{html,scss,ts}. Chip categorie beige, reordonare DOM (chip → titlu → hr → galerie → thumbs → descriere → back-btn), galerie 4:3 cu nav overlay 38px + counter pill, thumb-strip 4×1:1, back-btn pill beige unic centrat. GSAP păstrat prin .gallery-track absolute în .gallery. Eliminat PrimeNG Button. Adăugat propertyKind + categoryLabel getter pe component. white-space: pre-wrap menținut pe descriere ca să preserve newline-urile din DB.
<!-- SECTION:FINAL_SUMMARY:END -->
