---
id: TASK-137
title: 'Unifică tipografia paragrafelor: mărime, distanță între rânduri și paragrafe'
status: Done
assignee: []
created_date: '2026-10-29 23:10'
updated_date: '2026-10-29 23:59'
labels:
  - frontend
  - ui
  - typography
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Toate paragrafele de text de pe site au același font, aceeași mărime, aceeași distanță între rânduri și aceeași distanță între paragrafe. Referința este textul „De ce Oltenia de sub Munte?” de pe `/under-the-mountain` (`.why__text` din `under-the-mountain.component.scss`):

| Proprietate | Valoare de referință |
|---|---|
| font | `var(--font-base)` (Libre Baskerville) |
| mărime | `clamp(1rem, 1.6vw, 1.3rem)`: 16 px sub ~1000 px lățime, 20,8 px pe desktop lat |
| distanță între rânduri | `line-height: 1.9` |
| distanță între paragrafe | `margin: 0 0 1rem 0` pe fiecare `p` |
| aliniere | stânga, `letter-spacing` și `word-spacing` normale |

## Decizii owner (2026-10-29)

- Referința de mai sus se aplică peste tot, **și pe telefon**. Excepțiile locale pe mobil (16,8 px, 20 px) dispar.
- Spațiul dintre cuvinte pare diferit doar din cauza mărimii fontului: nicăieri nu există `text-align: justify`. Se egalizează odată cu mărimea. Nu se adaugă `word-spacing` artificial.
- **În scope:** homepage „Cu ce ne ocupăm”, `/under-the-mountain` (ambele secțiuni de text), `/village-of-the-month` („Prezentarea satului”), `/sate/*` (paragrafe și liste), descrierea anunțului pe `/property/...` și textul dialogurilor Politica de confidențialitate, Termenii și condițiile, Politica de cookies. Owner-ul a lăsat ultimele două la recomandare; au fost incluse pentru că sunt paragrafe de text.
- **În afara scope-ului:** titlurile, textele din hero și bannere (de exemplu `.desc` de pe homepage, sloganul de pe `village-of-the-month`), citatul „Pastilă pentru suflet”, butoanele, chip-urile, formularele, footerul, paginile admin și rezumatul de pe cardurile din `/properties`. Acesta din urmă a fost exclus la recomandare: e un fragment de card, iar mărirea lui ar schimba grila.

## Starea găsită (2026-10-29, desktop lat)

| Zonă | Selector | Mărime | Rând | Între paragrafe |
|---|---|---|---|---|
| `/under-the-mountain` „De ce…” (referință) | `.why__text` | clamp(1rem, 1.6vw, 1.3rem) | 1.9 | 1rem |
| `/under-the-mountain` a doua secțiune | `.feel__text` | clamp(…, 1.35rem); mobil 1.05rem | 1.9 | 1rem |
| Homepage „Cu ce ne ocupăm” | `.about__text` | clamp(…, 1.35rem); mobil 1.05rem | 1.8 | 1rem |
| `/village-of-the-month` | `.text-style` + `m-0` | 1.1rem | implicit (~1.24) | `<br><br>` într-un singur `<p>` |
| `/sate/*` | `.info-page-bg p`, `.text-style`, `.polovragi-paragraph(-2)`, `.horezu-paragraph`, `.horezu-note`, `.features-list li`, `.horezu-note-list li`, toate cu `m-0` | 1.5625rem (25 px); mobil 1.25rem | 1.6–1.7 | 0,25–0,5rem sau 0 |
| Descrierea anunțului | `.property-description` (+ `--video`) | 1rem; desktop 1.0625rem | 1.7–1.8 | (text `pre-wrap`) |
| Dialogurile legale | `.dialog-scroll p.mb-5` în `app.component.html` | implicit PrimeNG | implicit | 2rem (`mb-5`) |

Cauze importante:
- **`m-0` din PrimeFlex înseamnă `margin: 0 !important`.** Pe `village-of-the-month` și `/sate/*` anulează orice distanță între paragrafe. Trebuie scos de pe paragrafele de text, altfel distanța standard nu se aplică. Același lucru pentru `mb-5` din dialoguri.
- **Pe `village-of-the-month`, paragrafele sunt un singur `<p>` cu `<br><br>`**, duplicat în ramurile `.large-screen` și `.small-screen`, pentru fiecare dintre cele 3 sate. Fiecare `<br><br>` devine graniță între `<p>`-uri separate. Un `<br>` simplu din text rămâne: e o rupere de rând a autorului. Textul nu se modifică.

## Abordare

1. **Tokenuri globale** în `src/styles.scss`, în `:root`, lângă `--font-base`:
   ```scss
   --text-body-size: clamp(1rem, 1.6vw, 1.3rem);
   --text-body-line-height: 1.9;
   --text-paragraph-gap: 1rem;
   ```
2. Fiecare zonă din scope folosește tokenurile în SCSS-ul componentei ei: `font-family: var(--font-base)`, `font-size: var(--text-body-size)`, `line-height: var(--text-body-line-height)`, iar paragrafele au `margin: 0 0 var(--text-paragraph-gap)`. `.why__text` trece și el pe tokenuri, ca referința să nu mai poată diverge.
3. Se șterg valorile vechi și override-urile de mobil pentru aceste zone, nu doar se suprascriu. Așa scad și SCSS-urile `info-page` și `under-the-mountain`, aflate aproape de bugetul de eroare de 10 KB. În `under-the-mountain.component.scss`, regula `.card-info p` e cod mort: `.card-info` nu apare în template-ul componentei. Se poate șterge.
4. **Listele din `/sate/*`:** `li` folosește aceeași mărime și același rând. Lista are deasupra și dedesubt aceeași distanță ca un paragraf. Distanța dintre itemi rămâne mică, ca acum.
5. **Descrierea anunțului:** doar mărimea și rândul. Textul e `white-space: pre-wrap` din API, deci paragrafele lui vin din linii goale. `max-width: 40rem` rămâne, pentru lungimea rândului.
6. **Dialogurile legale:** `.dialog-scroll p` primește tokenurile, iar `mb-5` se înlocuiește cu distanța standard. Titlurile scrise ca `<p><b>…</b></p>` rămân paragrafe, cu aceeași distanță.

## Fișiere afectate (orientativ)

- `src/styles.scss` (tokenuri)
- `src/app/under-the-mountain/under-the-mountain.component.scss`
- `src/app/new-landing-page/new-landing-page.component.scss`
- `src/app/village-of-the-month/village-of-the-month.component.html` + `.scss`
- `src/app/info-page/info-page.component.html` + `.scss`
- `src/app/property-details/property-details.component.scss`
- `src/app/app.component.html` + `.scss` (dialogurile legale)
- `scripts/test-browser-regression.cjs` (verificarea automată, AC #6)

## Suprapuneri

TASK-136 modifică tot `under-the-mountain.component.scss` (butonul Pauză/Redare), cu același buget de 10 KB. TASK-134 șterge `/about-us`: pagina nu intră aici.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `src/styles.scss` definește în `:root` `--text-body-size: clamp(1rem, 1.6vw, 1.3rem)`, `--text-body-line-height: 1.9` și `--text-paragraph-gap: 1rem`. Toate zonele din scope, inclusiv `.why__text`, le folosesc. Nu rămân valori proprii de `font-size` sau `line-height` pentru paragrafele din scope, nici pe mobil.
- [x] #2 Pe `/village-of-the-month`, în ambele ramuri (desktop și mobil) și pentru toate cele 3 sate, fiecare `<br><br>` a devenit graniță între `<p>`-uri separate. Textul e identic cu cel dinainte (aceleași cuvinte, aceeași ordine).
- [x] #3 Paragrafele de text din scope nu mai au clasele PrimeFlex `m-0` sau `mb-*` și nici `style="font-size…"` inline.
- [x] #4 Pe `/sate/*`, paragrafele și itemii de listă au mărimea și rândul standard. Distanța dintre paragrafe și din jurul listelor este `--text-paragraph-gap`.
- [x] #5 Descrierea anunțului (cu și fără video) și textul celor 3 dialoguri legale au mărimea și rândul standard. Dialogurile au distanța standard între paragrafe.
- [x] #6 `scripts/test-browser-regression.cjs` verifică automat, la 1440 și la 390 px, pe `/`, `/under-the-mountain`, `/village-of-the-month`, o pagină `/sate/*`, o pagină de anunț și dialogul „Politica de confidențialitate” deschis, că toate paragrafele din scope au același `font-family`, același `font-size`, `line-height` = 1.9 × `font-size` și `margin-bottom` = 16 px. Toleranța e de ±0,5 px. Excepția e descrierea anunțului (`pre-wrap`), unde se verifică doar fontul și rândul.
- [x] #7 Elementele din afara scope-ului (titluri, hero, citatul „Pastilă pentru suflet”, butoane, formulare, cardurile din `/properties`, footer) arată ca înainte. Se verifică prin capturi înainte/după.
- [x] #8 `npm run build` trece fără erori de buget. Nicio componentă nu trece de 10 KB, iar `angular.json` nu e modificat. `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec, fără teste `fdescribe`/`fit`/`xdescribe`/`xit`.
- [x] #9 Capturile înainte/după la 1440, 390 și 320 px pentru toate zonele din scope sunt documentate în `## Implementation Notes`, fără scroll orizontal și fără text tăiat.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Deschide pe rând `/under-the-mountain`, `/village-of-the-month`, o pagină de sat și un anunț, pe desktop și pe telefon. Textul paragrafelor arată la fel peste tot.

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Commit `f049b5b`. Măsurat automat în regresie: la 1440 px, 57 de paragrafe pe 7 pagini au 20,8 px Libre Baskerville, rând 39,52 px (1,9×), 16 px până la paragraful următor; la 390 px, 44 de paragrafe au 16 px / 30,4 px. Dialogurile Termenii și condițiile și Politica de cookies au fost verificate separat (20,8 / 39,52 px). Pe `village-of-the-month` cele 6 blocuri au fost transformate în `<p>`-uri separate, cu textul verificat identic cuvânt cu cuvânt. Scoase: 21 de `m-0` de pe paragrafele din `/sate/*` și 11 `mb-5` din dialoguri. În `/sate/*`, ultimul paragraf dintr-un card sau dintr-o coloană nu mai adaugă spațiu dedesubt (`p:last-child`). Regula moartă `.card-info*` din `under-the-mountain.component.scss` a fost ștearsă. Punctele galeriei (`li` interne PrimeNG) nu sunt text și sunt excluse din verificare.

Validare finală 2026-10-29 pe build-ul final (branch `claude/pensive-heisenberg-2m6ix7`): `npm run build` PASS, fără erori de buget (info-page sub pragul de avertisment, under-the-mountain 8,92 KB, properties 9,32 KB neschimbat); `npm run test:ci` 133/133; `npm run test:ssr` 26/26; `npm run test:ssr:http` PASS: „redirect, static assets, SEO phones, 28 sitemap headings and incoming links, 16 discovered properties; 128 HTTP responses checked”, minimum 5 href-uri interne distincte pe fiecare rută. Regresia din browser (`scripts/test-browser-regression.cjs`, 1440/390/320 px + telefon orizontal + layout sate la 1280/1440) 55 PASS, 0 FAIL. Capturi înainte/după: 91 de pagini (7 ecrane: 1920, 1440, 1280, 1000, 390, 320, 844×390 × 13 pagini), 0 scroll orizontal, 0 erori JavaScript. Verificări suplimentare în browser real: 8/8 PASS. Fără merge și fără deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Paragrafele din toate zonele din scope folosesc tokenurile globale (16→20,8 px, rând 1,9, 1rem între paragrafe), inclusiv pe telefon; verificare automată pe 6 pagini și în dialoguri. Fără merge și fără deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
