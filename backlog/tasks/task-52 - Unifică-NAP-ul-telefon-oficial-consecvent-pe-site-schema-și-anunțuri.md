---
id: TASK-52
title: Unifică NAP-ul — telefon oficial consecvent pe site, schema și anunțuri
status: To Do
assignee: []
created_date: '2026-06-12 16:10'
updated_date: '2026-06-12 16:10'
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

1. **Decizie de business (cu ownerul)**: care e numărul public oficial unic? (probabil +40 728 140 628). Toate aparițiile sitewide (header/footer/contact/llms.txt/schema) folosesc EXACT acest număr, în format E.164 în schema (`+40728140628`) și formatat uman în UI („0728 140 628").
2. **Repară contact-us**: elimină/înlocuiește `0728140650` din body (caută în componenta de contact și în bara socială).
3. **Anunțuri — decizie**: fie (a) se afișează DOAR numărul agenției pe anunțuri (recomandat pentru business + NAP), fie (b) telefonul proprietarului rămâne dar e etichetat explicit („Contact proprietar:") și **scos din meta description și din JSON-LD** (rămâne doar în body vizibil). Implementare: la generarea meta description în `seo.service.ts`/componente, strip pe pattern telefon (`(\+4)?07\d{8}`) din textul sursă.
4. **llms.txt**: aliniază formatul numărului cu decizia.
5. Verifică `tel:` links — toate spre numărul oficial (sau cel etichetat).

## Fișiere afectate

- componenta contact-us (numărul greșit din body)
- `src/app/property-details/*` + `src/app/service/seo.service.ts` (strip telefon din meta/JSON-LD)
- `src/llms.txt` (sau locația lui în assets), `src/index.html` (dacă apare formatare diferită)

## Efort

M (jumătate de zi; include decizia de business).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Un singur număr oficial decis și documentat în implementation notes; apare identic (E.164 în schema, format uman în UI) pe: header/footer, /contact-us, /about-us, JSON-LD RealEstateAgent, llms.txt
- [ ] #2 Pagina /contact-us nu mai conține `0728140650` (sau numărul e cel oficial peste tot)
- [ ] #3 Nicio meta description de pe site nu conține numere de telefon (verificare pe toate cele 22 pagini, grep pe HTML brut)
- [ ] #4 JSON-LD `RealEstateListing.description` fără telefoane (sincron cu TASK-10 AC#8)
- [ ] #5 Dacă se păstrează telefonul proprietarului în body: e etichetat explicit „Contact proprietar" și e distinct vizual de contactul agenției
- [ ] #6 Toate link-urile `tel:` de pe site duc la numărul corect conform deciziei
<!-- AC:END -->
