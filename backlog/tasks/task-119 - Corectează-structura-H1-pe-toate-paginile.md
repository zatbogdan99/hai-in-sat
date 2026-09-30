---
id: TASK-119
title: Corectează structura H1 pe toate paginile
status: Done
assignee:
  - '@codex'
created_date: '2026-06-12 16:11'
updated_date: '2026-09-30 09:03'
labels:
  - seo
  - on-page
  - content
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Inventarul auditului 2026-06-12 (`seo-audit-2026-06-12/crawl/inventory.csv`, coloana h1_count):

| Pagină | H1 | Problema |
|---|---|---|
| `/under-the-mountain` | **0** | fără heading principal |
| `/contact-us` | **0** | fără heading principal |
| `/village-of-the-month` | **3** | H1 multiplu |
| `/homes` | **2** | H1 multiplu |
| `/see-the-area` | **2** | H1 multiplu |
| `/about-us` | **2** | H1 multiplu |
| `/` | 1 | OK ca număr, dar „E timpul să te întorci la liniște" nu conține NICIUN termen de căutare |

Cauza CONFIRMATĂ în cod (2026-07-06): template-urile randează simultan varianta desktop (`.large-screen`) ȘI varianta mobilă (`.small-screen`) a aceluiași heading — două elemente în DOM, ascunse alternativ prin CSS. Googlebot le vede pe amândouă.

## Cum — cu locațiile exacte (verificate 2026-07-06)

1. **Paginile cu 0 H1**:
   - `/under-the-mountain` (`under-the-mountain.component.html`) — **DECIS de owner (2026-07-27):** headingul existent „De ce Oltenia de sub Munte?" (azi `<h2>`, linia ~25) devine `<h1>`, cu stilul vizual PASTRAT identic prin CSS (muta regulile de stil de pe `h2` pe noul `h1`, sau adauga o clasa). Zero schimbare vizuala pe pagina.

     In ACELASI timp: **sterge blocul de hero comentat de la liniile 1-7**, impreuna cu TODO-ul „mie mi se pare urat fara titlu" — owner-ul a confirmat ca nu mai e de actualitate. Nu-l reactiva.
   - `/contact-us` (`contact-us.component.html`): nu are NICIUN heading pe desktop (doar SVG + social); pe mobil are `<h2>Contactează-ne și hai în sat!</h2>` (linia ~72). Adaugă UN `<h1>` („Contactează Hai în Sat — agenție imobiliară în Horezu") vizibil în ambele layout-uri (element unic + CSS responsive).
2. **Paginile cu H1 multiplu** — păstrează UN singur `<h1>` per pagină, restul devin `<h2>`/`<h3>`; unde dublarea e doar desktop/mobil, folosește UN element cu clase CSS responsive:
   - `/village-of-the-month` (`village-of-the-month.component.html`): H1 „Satul {{title}}" (linia ~8) + H1 „Prezentarea satului" (linia ~22, id `card-info-title`) + dublurile din varianta small-screen. Păstrează „Satul {{title}}" ca H1; „Prezentarea satului" → `<h2>`.
   - `/homes` (`form-page.component.html`): H1 duplicat desktop/mobil la liniile 9 și 71 — iar varianta mobilă e FĂRĂ diacritice („cauti", „gasim"). Unifică într-un singur element (cu diacritice corecte).
   - `/see-the-area` (`see-the-area.component.html`): H1-uri la liniile ~6, 18, 37 (desktop) și ~64, 76, 93 (mobil) — „Haide să vezi zona" ×2 + „Cumpără"/„Închiriază" ×2. Păstrează „Haide să vezi zona" ca unic H1; „Cumpără"/„Închiriază" → `<h2>`.
   - `/about-us` (`about-us.component.html`): H1 „Despre noi" duplicat la liniile 16 (desktop) și 37 (mobil) → un singur element.
3. **Homepage — SCOS DIN SCOPE (decizie owner 2026-07-27).** `new-landing-page.component.html:4` NU se atinge. H1-ul ramane „E timpul să te întorci la liniște", desi nu contine termeni de cautare — owner-ul a decis ca sloganul ramane cum e. Nu-l rescrie, nu-l completa cu subtitlu, nu propune alternative.

   (Pagina are oricum EXACT un `<h1>`, deci nu incalca regula structurala urmarita de acest task.)
4. Verifică ierarhia: fără sărituri H1→H3 fără H2 pe paginile editate.
5. NU atinge: `/properties` (are deja exact 1 H1 „Case și terenuri") și `/property/:id/:slug` (H1 = numele proprietății). Componentele `see-the-area-buy/rent` sunt copii activi ai paginii `/see-the-area`: headingurile lor devin H2 și păstrează stilurile actuale. `home-page` rămâne în afara scope-ului; `/info-page` este tratată în TASK-122.

## Fișiere afectate

- `src/app/under-the-mountain/under-the-mountain.component.html` (+ .scss), `src/app/contact-us/contact-us.component.html` (+ .scss), `src/app/village-of-the-month/village-of-the-month.component.html`, `src/app/home-form-page/form-page.component.html`, `src/app/see-the-area/see-the-area.component.html`, `src/app/about-us/about-us.component.html`, `src/app/see-the-area-buy/see-the-area-buy.component.html` (+ .scss), `src/app/see-the-area-rent/see-the-area-rent.component.html` (+ .scss)

## Efort

M (jumătate de zi — e mai mult grijă la CSS responsive decât cod).

## Verificare vizuală locală (cerere owner 2026-09-30)

Face parte din acceptare: capturi înainte/după la 390px și 1366px, plus pragurile layouturilor modificate. Excepții intenționate: noul H1 Contact și diacriticele formularului. Implementarea se oprește la PR; deploy-ul rămâne exclusiv în sarcina omului.

Deschide fiecare pagina modificata pe **390 px** (mobil) si **1366 px** (desktop) si confirma ca nimic nu s-a mutat vizual. Unificarea variantelor desktop/mobil intr-un singur element cu CSS responsive e singura parte a task-ului cu risc vizual real — acolo te uiti.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `/under-the-mountain`: headingul „De ce Oltenia de sub Munte?" (azi `<h2>`, linia ~25) e acum `<h1>`, cu aceleasi reguli de stil aplicate (fara schimbare vizuala), iar blocul de hero comentat de la liniile 1-7 impreuna cu TODO-ul aferent sunt STERSE din fisier
- [x] #2 `/contact-us` (`contact-us.component.html`): exista UN `<h1>` — „Contactează Hai în Sat — agenție imobiliară în Horezu" — vizibil in AMBELE layout-uri, ca UN SINGUR element cu CSS responsive (nu doua elemente ascunse alternativ). `<h2>Contactează-ne și hai în sat!</h2>` de la linia ~72 ramane `<h2>` (nu se sterge, nu se promoveaza)
- [x] #3 `/village-of-the-month`: „Satul {{title}}" (linia ~8) ramane singurul `<h1>`; „Prezentarea satului" (linia ~22, id `card-info-title`) devine `<h2>`; dublurile din varianta small-screen sunt unificate in acelasi element
- [x] #4 `/homes` (`form-page.component.html`): H1-ul duplicat de la liniile 9 si 71 devine UN singur element cu CSS responsive, iar textul foloseste diacritice corecte („cauți", „găsim") — varianta mobila le pierduse
- [x] #5 `/see-the-area`: „Haide să vezi zona" ramane singurul `<h1>`; „Cumpără" si „Închiriază" (azi `<h1>` la liniile ~18, ~37, ~76, ~93) devin `<h2>`; dublurile desktop/mobil sunt unificate
- [x] #6 `/about-us`: „Despre noi" e UN singur element (azi duplicat la liniile 16 si 37)
- [x] #7 `new-landing-page.component.html` NU e modificat — homepage-ul e scos din scope prin decizie owner
- [x] #8 `/properties` si `/property/:id/:slug` NU sunt modificate (au deja exact 1 H1)
- [x] #9 Pe paginile editate nu exista salturi de nivel (H1 → H3 fara H2 intre ele)
- [x] #10 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes` numaratoarea de H1 pentru fiecare ruta din sitemap: `curl -s http://localhost:4000/<ruta> | grep -o "<h1" | wc -l` — rezultatul trebuie sa fie **exact 1** pe fiecare
- [x] #11 `npx ng test --watch=false --browsers=ChromeHeadless` trece
- [x] #12 Componentele copil active see-the-area-buy/rent folosesc H2 cu stilurile păstrate, inclusiv după selectarea Cumpără/Închiriază. home-page rămâne neatinsă; info-page rămâne la TASK-122.
- [x] #13 Comparație vizuală locală înainte/după pe cele șase pagini la 390px și 1366px, plus pragurile responsive relevante; fără regresii de layout în afara noului H1 Contact și diacriticelor homes.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Captureaza baseline browser pentru cele sase rute, desktop 1366px si mobil 390px, plus stari Cumpara/Inchiriaza. Pastreaza capturi si masuratori de layout pentru comparatie.
2. Unifica H1 desktop/mobil si promoveaza headingul existent under-the-mountain fara schimbarea stilurilor. Adauga H1 cerut pe Contact. Corecteaza si headingurile componentelor buy/rent active in see-the-area.
3. Verifica si ajusteaza CSS responsive pe capturi inainte/dupa, inclusiv puncte de ruptura; exceptii vizuale intentionate: H1 nou Contact si diacriticele homes.
4. Build/teste/SSR: exact un H1 pe rutele sitemap, ierarhie, starile interactive si regresiile existente. Review independent si corectarea blocantelor.
5. Dovezi in backlog, commit si PR. Fara dev-pipeline, merge sau deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZII owner:
1. **Homepage-ul e scos din scope.** H1-ul „E timpul să te întorci la liniște" ramane neschimbat, desi nu contine termeni de cautare. Punctul 3 din „Cum" si AC-ul vechi #3 au fost eliminate. Nu redeschide subiectul fara o cerere explicita.
2. **`/under-the-mountain`**: se promoveaza H2-ul existent in H1, cu stil pastrat — NU se reactiveaza hero-ul comentat. In plus, blocul comentat de la liniile 1-7 si TODO-ul lui se sterg (owner: „nu mai e de actualitate").

Ambiguitati eliminate: textele de H1 pentru `/contact-us` erau date ca exemplu („ex. ...") → fixate literal. AC-ul vechi #1 cerea re-rularea crawler-ului de audit pe productie → inlocuit cu numaratoarea de `<h1>` prin protocolul SSR local. AC-ul vechi #5 (regresie vizuala pe 390 px si 1366 px) → mutat in `## Verificare post-deploy (owner)`.

2026-09-30: owner autorizeaza implementarea directa si cere explicit verificare vizuala responsive inainte/dupa. Corectura acceptata: see-the-area-buy/rent sunt componente copil active, deci H1 lor intra in scope pentru starile Cumpara/Inchiriaza. info-page ramane la TASK-122. Verificarea vizuala locala devine parte a acceptarii, nu doar post-deploy.

Implementare și validare finală 2026-09-30:
- Un singur H1 comun în DOM pentru cele șase pagini, inclusiv ramurile responsive ascunse. Under-the-mountain promovează titlul existent; Contact primește H1 literal; homes folosește diacritice. Titlurile buy/rent și secțiunilor devin H2 cu fonturi/margini păstrate; consimțământul formularului este paragraf, cu stilul anterior.
- Despre noi păstrează animația desktop, limitată la breakpoint-ul existent și curățată la resize/destroy; GSAP este protejat pentru SSR.
- Corectată în timpul QA o diferență la 500px: headingul și formularul împart din nou grila originală. Geometria finală homes coincide cu baseline la 390, 500, 501 și 1366px (excepție textul cu diacritice).
- Verificare browser înainte/după: 6 rute × desktop 1366x900 / mobil 390x844; suplimentar homes500/501 și about1199/1200x844 +1366x599. About mobil390,1199 și desktop scund599 au capturi PNG identice cu baseline. Desktop about are geometrie identică după animație; resize live desktop→mobil afișează H1 cu opacity1 și fără transform rezidual. Contact deplasează uniform conținutul cu înălțimea noului H1 (114px desktop /154px mobil).
- Capturile/metricile sunt în C:/Users/Bogd/.codex/visualizations/2026/09/17/01a0ae34-4fba-7853-8334-f81961e14d8d/task119. Au fost recapturate fundalurile după build și încărcarea imaginilor. Pentru desktop about/village există și capturi viewport, deoarece fullPage poate modifica dimensiunile suprafeței capturate. Cadrele GSAP și încărcarea iframe-urilor YouTube nu sunt deterministe; geometria titlurilor a fost comparată separat. Video-urile nu sunt modificate.
- Navigare browser Olari→Racovița: titlul unic se actualizează. Introducerea textului și selectarea tipului de proprietate funcționează în formularul mobil. Ramurile separate ale formularului au deja limitarea de sincronizare vizuală a valorilor între desktop/mobil; nu s-a modificat logica formularului.
- Stările Cumpără/Închiriază/Înapoi sunt verificate cu componente copil reale în Karma. Butoanele din template-urile cardurilor see-the-area nu sunt afișate nici în baseline (PrimeTemplate neimportat); testul nu pretinde navigare UI pe aceste butoane. Overflow-ul desktop existent al cardurilor este neschimbat (scrollWidth1456 înainte/după). Aceste probleme preexistente nu sunt extinse în TASK-119.
- npm run build: PASS (browser+server); avertismentele SCSS existente rămân.
- npm run test:ci: 89/89 PASS. Testul nou buy/rent folosește actualizarea sincronă; așteptarea globală whenStable era nepotrivită pentru activitatea Swiper și a fost eliminată.
- npm run test:ssr: 26/26 PASS.
- SSR_CACHE_TEST_PORT=4120 npm run test:ssr:http: 105 răspunsuri verificate, PASS; server local cu fixture API, fără cereri API către producție. Port4000 este folosit deja; serverul utilizatorului a fost păstrat.
- Dovezi HTTP: C:/Users/Bogd/AppData/Local/Temp/hai-in-sat-ssr-cache-JkRWeX. Loguri build/Karma/HTTP în TEMP/task119-{build,karma-final,http-final}.log.
- Review independent cod și capturi finale: fără findings blocante; corecția grid500 reverificată.
- Homepage, properties, property-details, info-page, backend și ștergerea preexistentă a gitlink-ului .claude/worktrees/zealous-mclean-eca060 nu sunt incluse în modificare.

Numărătoare H1 din HTML SSR pe fiecare URL sitemap (parse5, incluzând ramuri CSS ascunse):
- /: 1 H1
- /properties: 1 H1
- /under-the-mountain: 1 H1
- /village-of-the-month: 1 H1
- /homes: 1 H1
- /see-the-area: 1 H1
- /about-us: 1 H1
- /contact-us: 1 H1
- /property/f6c006e4-092a-44d9-b194-cd3425327c5f/teren-de-vanzare-teren-cerna: 1 H1
- /property/48dab29f-43e0-4d0f-b3c1-8f7bfbc5f0d3/teren-de-vanzare-teren-racovita: 1 H1
- /property/f7c9ce67-f71a-4abe-b477-2785c0d0b880/teren-de-vanzare-teren-baia-de-fier: 1 H1
- /property/f0530ddd-4201-49f8-99d4-c76c5b2ee1de/teren-de-vanzare-teren-baia-de-fier: 1 H1
- /property/0f59588f-2e62-4160-ac96-fe88bee4f19d/teren-de-vanzare-teren-polovragi: 1 H1
- /property/fa222b08-b5a7-49af-8e55-68828522bd4b/teren-de-vanzare-teren-vaideeni: 1 H1
- /property/8641e495-162f-41a1-8847-09f6031cd676/teren-de-vanzare-teren-polovragi: 1 H1
- /property/8812ad88-028e-46dc-a127-348437baef28/teren-de-vanzare-teren-baia-de-fier: 1 H1
- /property/126495e7-a342-4868-8783-cc6f0a0a0dd7/teren-de-vanzare-teren-horezu-valcea: 1 H1
- /property/d32d0ad2-9f30-433a-b7b0-d03d3b85fa67/teren-de-vanzare-teren-romani-balanesti-horezu-valcea: 1 H1
- /property/eea36016-6c8d-497f-94f7-2cefe2e4a20d/teren-de-vanzare-teren-romani-taco-valcea: 1 H1
- /property/239d1876-0db7-4941-be29-ec822d54d56a/teren-de-vanzare-teren-vaideeni-zona-lunca-valcea: 1 H1
- /property/ce1b374c-c585-4174-8076-90767eb3ae0c/teren-de-vanzare-teren-vaideeni-in-vai-valcea: 1 H1
- /property/2850d7ba-af11-4412-a331-b6592586453d/teren-de-vanzare-teren-varful-roman-valcea: 1 H1
- /property/a8b5c304-aaac-42c5-9560-2ed6bf2ecccc/teren-de-vanzare-teren-de-vanzare-romani-intersectie-cu-dn67-valcea: 1 H1
- /property/d5662eb2-0936-403e-852d-ca8c0578b447/casa-de-vanzare-casa-in-horezu: 1 H1
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
H1 unic pe cele șase pagini, păstrând stilurile responsive și ierarhia secțiunilor inclusiv buy/rent. Validat prin comparații browser înainte/după, build, 89 teste Angular, 26 teste SSR și 105 verificări HTTP (24 URL sitemap, fiecare cu exact un H1). Review independent fără blocante. Livrare prin PR; fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
