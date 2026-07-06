---
id: TASK-19
title: Unifică NAP-ul — telefon oficial consecvent pe site, schema și anunțuri
status: To Do
assignee: []
created_date: '2026-06-12 16:10'
updated_date: '2026-07-06'
labels:
  - seo
  - local
  - trust
  - content
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/local.md
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

NAP (Name, Address, Phone) inconsistent = semnal de neîncredere pentru Google local și pentru clienți. Auditul 2026-06-12 a găsit **trei straturi de inconsistență**:

1. **Chiar pe pagina de contact**: body-ul afișează `0728140650`, iar JSON-LD/footer au `+40728140628` — două numere diferite pe aceeași pagină.
2. **Anunțurile** afișează telefoane diferite per proprietate (`0763144967`, `0768915198`, `0728140650`...) — probabil proprietarii — fără nicio distincție vizuală/semantică față de numărul agenției; aceleași numere ajung și în **meta description** și în **JSON-LD `description`** (indexabile).
3. `llms.txt` publică `+40 728 140 628` — a treia formă de scriere.

Pe lângă confuzia Google, e și o problemă de business: clientul care sună proprietarul direct ocolește agenția.

## Cum

1. **Număr oficial — DECIS de owner (2026-06-28): `+40728140628`** (afișat uman „0728 140 628"). Toate aparițiile sitewide (header/footer/contact/llms.txt/schema RealEstateAgent) folosesc EXACT acest număr — E.164 în schema (`+40728140628`), format uman în UI („0728 140 628"). Atenție: forma greșită din body-ul de contact era `0728140650` (cu `650`, nu `628`) — de înlocuit.
2. **Repară contact-us — LOCALIZAT EXACT (verificat 2026-07-06):** în `contact-us.component.html`, varianta desktop (`.large-screen`), linia ~51: link-ul are `href="tel:0728140628"` (CORECT), dar numărul VIZIBIL e scris literă-cu-literă în `<span>`-uri separate (liniile ~53–62) și se termină în `...6-5-0` — adică afișează `0728140650`. Fix: schimbă ultimele două span-uri din `5`,`0` în `2`,`8`. Varianta mobilă (liniile ~87–90) e deja corectă (`0728140628`). ÎN PLUS: `contact-us.component.ts:34` — meta description conține „Telefon: 0728140628..." → scoate telefonul din meta description (AC#3 se aplică și numărului oficial).
3. **Anunțuri — DECIS de owner (2026-06-28):** numerele proprietarilor rămân afișate pe anunțuri EXACT ca acum — FĂRĂ etichetă nouă, FĂRĂ schimbare vizuală. Singura modificare (invizibilă pentru vizitatori): **scoaterea telefoanelor din `meta description` și din `JSON-LD`** — Google nu trebuie să indexeze numere conflictuale. Implementare: la generarea meta description și a `JSON-LD ...description` în `property-details.component.ts` (liniile ~131 și ~138 — acolo unde descrierea e deja trecută prin regex-ul de strip HTML), aplică și strip pe pattern telefon. Pattern RECOMANDAT, tolerant la spații/puncte/cratime între cifre: `/\+?4?0[\s.\-]?7(?:[\s.\-]?\d){8}/g` (prinde `0763144967`, `0763 144 967`, `+40 728 140 628`; patternul simplu `(\+4)?0?7\d{8}` ratează formele cu spații). (Body-ul vizibil NU se atinge — pipe-ul `phoneLink` din template rămâne cum e.)
4. **Alt text cu telefoane:** `properties.component.ts` — `getImageAlt()` (linia ~344) construiește alt-ul imaginilor din descriere → aplică același strip și acolo (alt-ul e text indexabil). Recomandat: helper comun `stripPhones(text)` în `src/app/utils/`, refolosit peste tot.
5. **llms.txt** (`src/llms.txt`, secțiunea Contact — folosește azi `+40 728 140 628`): aliniază formatul numărului cu decizia (o singură formă).
6. Verifică `tel:` links — toate spre numărul oficial: `contact-us.component.html` (ambele variante), `properties.component.html:134` + `properties.component.ts:306` (`callPhone`), iar în `app.component.html` (~linia 221, dialogul Contact din footer-ul desktop) numărul e afișat FĂRĂ link `tel:` — adaugă-l.

## Fișiere afectate

- `src/app/contact-us/contact-us.component.html` (span-urile literă-cu-literă ~53–62) + `contact-us.component.ts:34` (meta description)
- `src/app/property-details/property-details.component.ts` (strip telefon în meta + JSON-LD, ~131/~138)
- `src/app/properties/properties.component.ts` (`getImageAlt` ~344 — strip telefon din alt)
- `src/app/app.component.html` (dialogul Contact — adaugă `tel:`)
- `src/app/utils/` (helper `stripPhones` — de creat, opțional dar recomandat)
- `src/llms.txt`; `src/index.html` doar de VERIFICAT (schema RealEstateAgent are deja `+40728140628` corect la linia 42)

## Efort

M (jumătate de zi; include decizia de business).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Numărul oficial `+40728140628` (uman „0728 140 628") apare identic (E.164 în schema, format uman în UI) pe: header/footer, /contact-us, /about-us, JSON-LD RealEstateAgent, llms.txt
- [ ] #2 Pagina /contact-us nu mai conține `0728140650` (sau numărul e cel oficial peste tot)
- [ ] #3 Nicio meta description de pe site nu conține numere de telefon (verificare pe toate cele 22 pagini, grep pe HTML brut)
- [ ] #4 JSON-LD `RealEstateListing.description` fără telefoane (sincron cu TASK-29 AC#8)
- [ ] #5 Numerele proprietarilor rămân vizibile pe anunțuri ca acum, FĂRĂ etichetă nouă și fără schimbare vizuală (decizie owner); singura modificare e scoaterea lor din meta description / JSON-LD (vezi #3, #4)
- [ ] #6 Toate link-urile `tel:` de pe site duc la numărul corect conform deciziei
<!-- AC:END -->
