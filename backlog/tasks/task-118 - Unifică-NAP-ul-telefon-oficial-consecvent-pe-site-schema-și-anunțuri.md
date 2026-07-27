---
id: TASK-118
title: Unifică NAP-ul — telefon oficial consecvent pe site, schema și anunțuri
status: To Do
assignee: []
created_date: '2026-06-12 16:10'
updated_date: '2026-07-27'
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

M (jumătate de zi). Decizia de business e deja luata (vezi punctele 1 si 3) — nu mai e nimic de intrebat.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Dupa deploy, apasa pe fiecare link `tel:` de pe telefon (contact desktop si mobil, cardurile din `/properties`, dialogul Contact din footer) si confirma ca formeaza numarul asteptat. Verifica in Search Console, dupa cateva saptamani, ca description-urile afisate in SERP nu mai contin numere de telefon.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Numarul oficial apare in forma E.164 `+40728140628` in JSON-LD `RealEstateAgent` din `src/index.html` (azi linia 42 — deja corect, doar de confirmat ca nu s-a stricat) si in `src/llms.txt`, cu O SINGURA forma de scriere in tot fisierul
- [ ] #2 `contact-us.component.html`, varianta desktop (`.large-screen`, span-urile literă-cu-literă de la liniile ~53-62): ultimele doua span-uri sunt `2` si `8`, nu `5` si `0` — numarul VIZIBIL devine `0728140628`, identic cu `href="tel:0728140628"` de la linia ~51
- [ ] #3 `git grep "0728140650" src/` returneaza 0 rezultate
- [ ] #4 Exista helperul `stripPhones(text: string): string` in `src/app/utils/` (fisier nou), care aplica regexul `/\+?4?0[\s.\-]?7(?:[\s.\-]?\d){8}/g` — patternul tolerant la spatii, puncte si cratime. NU folosi varianta simpla `(\+4)?0?7\d{8}`, care rateaza formele cu spatii
- [ ] #5 `stripPhones` e aplicat in TREI locuri: (a) `property-details.component.ts` la generarea meta description (azi ~linia 131), (b) acelasi fisier la `JSON-LD ...description` (azi ~linia 138), (c) `properties.component.ts` in `getImageAlt()` (azi ~linia 344) — alt-ul imaginilor e text indexabil
- [ ] #6 `contact-us.component.ts:34`: meta description NU mai contine niciun numar de telefon
- [ ] #7 Body-ul vizibil al anunturilor NU e modificat: pipe-ul `phoneLink` din `property-details.component.html` ramane exact cum e, numerele proprietarilor raman afisate, FARA eticheta noua si fara schimbare vizuala (decizie owner 2026-06-28)
- [ ] #8 `app.component.html` (~linia 221, dialogul Contact din footer-ul desktop): numarul afisat primeste link `tel:` spre numarul oficial
- [ ] #9 Toate link-urile `tel:` din `src/` duc la numarul oficial: `git grep "tel:" src/` arata doar `tel:0728140628` (sau `tel:+40728140628`) — cu exceptia numerelor proprietarilor din cardurile de anunt, care raman cum sunt
- [ ] #10 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes` rezultatul acestei verificari pe TOATE rutele statice + o pagina de anunt: `curl -s http://localhost:4000/<ruta> | grep -o '<meta name="description"[^>]*>'` — niciun rezultat nu contine cifre de telefon
- [ ] #11 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Task-ul era deja bine decis (numar oficial fixat 2026-06-28, comportamentul anunturilor fixat tot atunci). Modificari:
1. Helperul `stripPhones` era „optional dar recomandat" → devine OBLIGATORIU, ca sa nu ajunga acelasi regex copiat in trei locuri cu trei variante subtil diferite.
2. AC-ul vechi #1 cerea numarul si pe „/about-us" si in „header/footer" fara sa spuna unde anume in cod → inlocuit cu fisiere si linii verificabile.
3. AC-ul vechi #3 („verificare pe toate cele 22 pagini, grep pe HTML brut") presupunea crawl pe productie → devine protocolul SSR local pe `http://localhost:4000`.
4. „include decizia de business" din Efort a fost scos — nu mai exista decizie deschisa.
<!-- SECTION:NOTES:END -->
