---
id: TASK-139
title: Ecran de încărcare (schelet animat) pentru caruselul de sate și galeriile satelor
status: To Do
assignee: []
created_date: '2026-10-30 10:30'
labels:
  - frontend
  - ui
  - performance
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Pe internet lent, caruselul de sate de pe `/under-the-mountain` și galeriile de pe paginile `/sate/:slug` arată de la început o stare clară de încărcare, la mărimea finală. Nu mai apar zone goale, carduri uriașe sau elemente care sar când se încarcă pozele.

## Decizie owner (2026-10-30)

- **Schelet animat:** fiecare card din carusel și fiecare poză din galerie apare imediat ca un dreptunghi gri, cu o lumină care trece peste el (shimmer), la mărimea finală. Poza apare peste el când s-a descărcat. Textul paginii rămâne vizibil tot timpul.
- Nu se folosește un ecran de încărcare pe toată pagina și nici un spinner care acoperă conținutul.
- Micșorarea pozelor, care e cauza principală a încărcării lente, e în **TASK-140**.

## Ce se vede azi (reprodus 2026-10-30)

Simulare cu Playwright, la 1440×900, pe o rețea de 1,6 Mbps și 150 ms latență (CDP `Network.emulateNetworkConditions`), cu serverul SSR local și date fictive:

- **`/under-the-mountain`:** Swiper nu se inițializează nici după 60 s, pentru că bundle-ul JS (5,3 MB) se descarcă în paralel cu ~20 MB de poze. Până atunci, `swiper-container` neinițializat arată cardurile unul sub altul, pe toată lățimea. Întâi apare un card alb care umple ecranul, apoi poza originală întreagă (4000×6000 px).
- **`/sate/horezu`:** galeria de sus stă goală 15–30 s. Se văd doar săgețile, aproape invizibile, și punctele.
- **Poza din secțiunea a doua** nu are spațiu rezervat. Textul de lângă ea se mută când poza se încarcă.

## Scope

1. **Caruselul înainte de inițializarea Swiper.** Doar din CSS, aplicat și pe HTML-ul SSR. Până la `initialize()`, `.discover__cards` are aceeași geometrie ca după inițializare: 3 carduri pe un rând peste 640 px și 1 card centrat la 640 px și mai puțin. Restul cardurilor sunt ascunse (`overflow: hidden`), fără listă verticală.
   - Componenta marchează starea „inițializat” (de exemplu o clasă pe `.discover__cards`, setată după `initialize()`), iar regulile pre-init se aplică doar fără ea.
   - Pe desktop, Swiper pornește cu `initialSlide: 1`, centrat, deci arată cardurile 0–2, la fel ca rândul pre-init. Nu trebuie să existe niciun salt vizibil.
   - Pe telefon, cardul centrat inițial e indexul 1 (Polovragi). Rândul pre-init arată același card; dacă nu se poate, documentează saltul.
2. **Schelet pe poza fiecărui card.** `.discover-card__img` are deja raport fix (4/3). Până se încarcă poza, cutia arată scheletul animat, iar titlul și „Mai multe” sunt vizibile. După încărcare, poza apare (o tranziție de cel mult 200 ms e permisă) și animația se oprește. Nu rămâne nicio animație activă în spatele unei poze încărcate.
3. **Galeria de pe paginile de sat** (desktop `.large-screen` și telefon `.small-screen`). Cutia `.gallery-open` (raport 45/33,5) arată scheletul până se încarcă poza curentă. La trecerea la o poză încă nedescărcată, scheletul apare din nou. Săgețile, punctele și deschiderea pe tot ecranul funcționează și în timpul încărcării.
4. **Poza din secțiunea a doua** (`.horezu-image`, `.polovragi-image` și variantele per sat). Spațiul final e rezervat înainte de încărcare, iar scheletul stă în spațiul ei. Textul de lângă și de sub ea nu se mută când apare poza. Rezervarea se face prin atributele `width`/`height` reale ale pozei, adăugate în datele din `PhotoService` (atenție la `max-height` din CSS), sau prin `aspect-ratio`, păstrând încadrarea de acum.
5. **Galeria pe tot ecranul.** Cât timp se încarcă poza mare, pe masca întunecată apare un indicator de încărcare centrat (schelet sau spinner discret), nu un ecran negru gol.
6. **Mișcare redusă:** cu `prefers-reduced-motion: reduce`, scheletul e static (gri), fără animație.
7. **Robustețe:**
   - O poză încărcată înainte de hidratare (evenimentul `load` deja trecut) e detectată după hidratare (`img.complete && img.naturalWidth > 0`), ca scheletul să nu rămână blocat.
   - La eroare de încărcare (`error`) scheletul dispare și rămâne un fundal neutru, nu o animație infinită.
8. **Accesibilitate:** scheletul e decorativ (`aria-hidden="true"` dacă e un element separat) și nu se anunță. Opțional: `aria-busy="true"` pe carusel sau galerie cât timp se încarcă.
9. **Stiluri comune:** stilul scheletului (culori, `@keyframes`) se definește o singură dată, global în `src/styles.scss` (de exemplu o clasă `.skeleton`), și se reutilizează. SCSS-urile componentelor rămân sub eroarea de 10 KB: `under-the-mountain` e la ~8,75 KB. `angular.json` nu se modifică.

## Fișiere afectate (orientativ)

- `src/styles.scss` (scheletul comun)
- `src/app/under-the-mountain/under-the-mountain.component.{html,scss,ts,spec.ts}`
- `src/app/info-page/info-page.component.{html,scss,ts,spec.ts}`
- `src/app/service/photo-service.ts` (dimensiunile pozelor, dacă se folosesc atributele `width`/`height`)
- `scripts/test-browser-regression.cjs` (verificarea pe rețea lentă)

## În afara scope-ului

- Micșorarea pozelor și `srcset`: **TASK-140**.
- Reducerea bundle-ului JS (5,3 MB), care întârzie inițializarea Swiper: TASK-130.
- Alte pagini (`/village-of-the-month`, `/properties`, pagina de anunț, care are deja schelet propriu pentru galerie).

## Suprapuneri

TASK-140 modifică aceleași `<img>`-uri (`src`/`srcset`, dimensiuni). Se implementează după acest task și face rebase pe el.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pe rețea limitată (1,6 Mbps, 150 ms, prin CDP), la 1440, 390 și 320 px, `/under-the-mountain` arată la 3 s și la 8 s rândul de carduri în geometria finală: 3 carduri pe desktop, 1 pe telefon, fiecare cu schelet în locul pozei. Nu apare lista verticală. Înălțimea `.discover__cards` înainte și după inițializarea Swiper diferă cu cel mult 10%.
- [ ] #2 Pe desktop, cardurile vizibile înainte și după inițializare sunt aceleași (aceeași ordine, fără salt). Pe telefon, comportamentul e documentat în Implementation Notes.
- [ ] #3 Scheletul fiecărui card dispare când poza s-a încărcat. După încărcare, cutia pozei nu mai are animații active (`getAnimations().length === 0`).
- [ ] #4 Pe `/sate/*` (desktop și telefon), cutia galeriei arată scheletul până se încarcă poza curentă. Trecerea la o poză nedescărcată arată din nou scheletul. Săgețile, punctele și deschiderea pe tot ecranul funcționează în timpul încărcării.
- [ ] #5 Poza din secțiunea a doua are spațiul rezervat: poziția titlului sau a paragrafului de lângă ea și a celui de sub ea se schimbă cu cel mult 2 px între „înainte de încărcare” și „după încărcare”, la 1440 și la 390 px.
- [ ] #6 Galeria pe tot ecranul arată un indicator de încărcare centrat până se încarcă poza.
- [ ] #7 Cu `prefers-reduced-motion: reduce`, scheletul e static, fără animație.
- [ ] #8 Pe rețea normală nu rămâne niciun schelet blocat, inclusiv pentru pozele încărcate înainte de hidratare. La o poză care dă eroare, scheletul dispare.
- [ ] #9 După ce totul s-a încărcat, caruselul și paginile de sat arată la fel ca înainte de task. Se verifică prin capturi pe rețea normală la 1440, 390 și 320 px.
- [ ] #10 Testele unitare acoperă detectarea `load`/`complete`/`error`. `scripts/test-browser-regression.cjs` (sau un script nou din `scripts/`) verifică AC #1, #3, #4 și #5 pe rețea limitată.
- [ ] #11 `npm run build` trece fără eroare de buget, fără modificări în `angular.json`. `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec, fără `fdescribe`/`fit`/`xdescribe`/`xit`.
- [ ] #12 Capturile pe rețea limitată (la 3, 8, 15 și 30 s), înainte și după, la 1440 și 390 px, sunt documentate în `## Implementation Notes`.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe telefon, cu internet slab (sau Chrome DevTools → Network → „Slow 4G”), deschide `/under-the-mountain` și o pagină de sat. Cât timp se încarcă, caruselul și galeria arată scheletul în locul pozelor, nu zone goale sau poze uriașe.
