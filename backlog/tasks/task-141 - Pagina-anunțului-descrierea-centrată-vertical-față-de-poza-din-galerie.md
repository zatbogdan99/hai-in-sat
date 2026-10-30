---
id: TASK-141
title: 'Pagina anunțului: descrierea centrată vertical față de poza din galerie'
status: To Do
assignee: []
created_date: '2026-10-30 11:30'
labels:
  - frontend
  - ui
  - layout
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Pe pagina unui anunț (`/property/:id/:slug`; după TASK-143, `/proprietati/:id/:slug`), pe desktop, descrierea din stânga stă pe centrul pozei din galeria de lângă ea, nu lipită de partea de sus.

## Decizie owner (2026-10-30)

- E vorba de **pagina anunțului**. În lista din `/properties` (modul „listă”) textul e deja centrat față de poza mică (`align-items: center` pe `.property-list-item`), deci lista nu se schimbă.
- Dacă descrierea e mai înaltă decât poza, începe sus, aliniată cu marginea de sus a pozei, și continuă în jos.

## Starea de acum

`property-details.component.html`, varianta fără video (`.content-section`): `aside.media-column` (galeria `.gallery` plus banda de miniaturi `.thumb-strip`), urmată de `.property-description`. Pe desktop (`@media (min-width: 56.25rem)`), `.media-column` e `float: right; width: 55%`, deci descrierea curge în stânga de sus în jos și, dacă e lungă, continuă și sub galerie.

## Scope

- Doar varianta **fără video**, pe desktop (de la 56,25rem / 900 px).
- Descrierea e centrată vertical față de **poza principală** (`.gallery`), nu față de galerie plus miniaturi. Când e mai înaltă decât poza, începe la marginea de sus a pozei.
- Banda de miniaturi rămâne lipită sub poză, fără gol nou între poză și miniaturi, indiferent cât de lungă e descrierea.
- Lățimile coloanelor rămân cele de acum (galeria 55%, 32 px între coloane). Ce se pierde: la descrieri foarte lungi, textul nu mai continuă sub galerie, ci rămâne în coloana lui.
- Galeria de pe server (înainte să se încarce pozele, cu banda de miniaturi provizorie) nu face textul să sară: centrarea se raportează la cutia galeriei, care are deja raport fix.

## În afara scope-ului

- Varianta **cu video** (`.media-row` + `.below-media-row`): acolo descrierea stă sub video, nu lângă o poză.
- Telefonul (sub 900 px): galeria și textul sunt unul sub altul.
- Lista și grila din `/properties`.

## Fișiere afectate

- `src/app/property-details/property-details.component.scss` (eventual `.html`)
- `scripts/test-browser-regression.cjs` (verificarea automată)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 La 1440 și 1280 px, pentru un anunț fără video cu descriere scurtă (mai joasă decât poza), centrul vertical al `.property-description` e la cel mult 4 px de centrul vertical al `.gallery`.
- [ ] #2 Pentru un anunț cu descriere mai înaltă decât poza, marginea de sus a descrierii e aliniată (±2 px) cu marginea de sus a pozei, iar textul nu e tăiat.
- [ ] #3 În ambele cazuri, banda de miniaturi începe imediat sub poză, cu același spațiu ca acum (±1 px), fără gol nou.
- [ ] #4 Varianta cu video și varianta de telefon (390, 320 px) arată la fel ca înainte de task (capturi înainte/după).
- [ ] #5 Nu apare scroll orizontal și nu apar suprapuneri la 1000, 1280, 1440 și 1920 px.
- [ ] #6 `scripts/test-browser-regression.cjs` verifică AC #1–#3 cu date fictive: un anunț cu descriere scurtă și unul cu descriere lungă.
- [ ] #7 `npm run build` trece fără eroare de buget. `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec, fără `fdescribe`/`fit`/`xdescribe`/`xit`.
- [ ] #8 Capturile înainte/după sunt documentate în `## Implementation Notes`.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe desktop, deschide un anunț fără video: descrierea stă la mijlocul pozei din dreapta.
