---
id: TASK-127
title: Adaugă favicon fallback PNG/ICO pe lângă AVIF
status: To Do
assignee: []
created_date: '2026-06-12 16:18'
updated_date: '2026-07-27'
labels:
  - seo
  - images
  - quick-win
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/visual.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`src/index.html` declară un singur favicon: `<link rel="icon" type="image/avif" href="assets/favicon.avif">`. Suportul AVIF pentru favicon e incomplet: Safari (toate versiunile relevante) nu îl afișează, iar pentru favicon-ul din rezultatele Google (mobile SERP) Google cere format suportat universal și mărime multiplu de 48px. Azi: tab fără icon în Safari și risc de favicon generic în SERP. (findings/visual.md V6)

## Stare REVERIFICATĂ (2026-07-27) — mai grav decât părea

Verificarea din 2026-07-06 spunea „infrastructura e gata, `src/favicon.ico` EXISTA". Fals. Fisierul exista, dar **NU e un fisier ICO**:

```
$ python -c "print(open('src/favicon.ico','rb').read()[:8])"
b'\x89PNG\r\n\x1a\n'
```

E un **PNG de 28×30 px, 948 bytes, redenumit `.ico`**. Consecinte: header-ul ICO e invalid (camp `type` = 18254 in loc de 1), nu contine mărimile 16/32/48, iar `app.yaml` il serveste cu `Content-Type` de icon. Deci trebuie REGENERAT, nu doar declarat.

Ce e totusi in regula si nu se atinge:
- `src/favicon.ico` e deja in `assets` din `angular.json` (ajunge in radacina build-ului) — verificat;
- `app.yaml` are deja handler dedicat pentru `/favicon.ico` (liniile 36-39) — verificat.

## Cum — DECIS de owner (2026-07-27)

1. Adauga `png-to-ico` in `devDependencies` (`yarn add --dev png-to-ico`; pachet mic, fara binare native). `sharp` exista deja (`^0.34.5`), dar NU stie sa scrie `.ico` — de aia e nevoie de al doilea pachet.
2. Scrie `scripts/generate-favicons.js`, care citeste **`src/assets/logo.avif`** ca sursa si produce:
   - `src/favicon.ico` — ICO real, multi-size: **16×16, 32×32, 48×48** (sharp redimensioneaza la PNG-uri in memorie, `png-to-ico` le impacheteaza);
   - `src/assets/favicon-48.png` — 48×48;
   - `src/assets/apple-touch-icon.png` — 180×180, pe fundal opac (Safari nu randeaza transparenta pe icoana de home screen).
3. Adauga in `package.json` scriptul `"generate-favicons": "node scripts/generate-favicons.js"` si ruleaza-l o data, comitand asset-urile generate. NU-l lega de `build` — se ruleaza manual, cand se schimba logo-ul (acelasi tipar ca `generate-sitemap`).
2. În `src/index.html` (lângă linia 173), înlocuiește declarația unică AVIF cu setul complet:
```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" href="assets/favicon-48.png" sizes="48x48">
<link rel="icon" type="image/avif" href="assets/favicon.avif"><!-- progressive enhancement -->
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
```
3. Nimic de făcut în `app.yaml`/`angular.json` — mapările există deja (verificat).

## Fișiere afectate

- `scripts/generate-favicons.js` (nou)
- `package.json` (devDependency `png-to-ico` + scriptul `generate-favicons`)
- `src/favicon.ico` (REGENERAT — azi e un PNG deghizat)
- `src/assets/favicon-48.png`, `src/assets/apple-touch-icon.png` (noi)
- `src/index.html` (linia ~173 — setul complet de declaratii)
- `angular.json`, `app.yaml` — **NU se modifica**, mapările exista deja

## Efort

S (1 oră).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. `curl -sI https://xn--hai-n-sat-t5a.ro/favicon.ico` → 200, `Content-Type: image/x-icon` sau `image/vnd.microsoft.icon`.
2. Deschide site-ul in **Safari** si in **Chrome** — icoana trebuie sa apara in tab in ambele (azi Safari nu afiseaza nimic).
3. Adauga site-ul pe ecranul principal pe iOS — trebuie sa apara `apple-touch-icon`, nu o captura de ecran.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `package.json` are `png-to-ico` in `devDependencies` si scriptul `"generate-favicons": "node scripts/generate-favicons.js"`; `yarn.lock` e regenerat prin `yarn install`
- [ ] #2 Exista `scripts/generate-favicons.js`, care citeste `src/assets/logo.avif` si scrie cele trei fisiere: `src/favicon.ico`, `src/assets/favicon-48.png`, `src/assets/apple-touch-icon.png`
- [ ] #3 `src/favicon.ico` regenerat e ICO VALID si multi-size. Implementatorul a rulat scriptul si a lipit in `## Implementation Notes` iesirea acestei verificari, care trebuie sa arate `tip: 1` si marimile 16, 32, 48: `python -c "import struct; d=open('src/favicon.ico','rb').read(); r,t,n=struct.unpack('<HHH',d[:6]); print('tip:',t,'imagini:',n); [print(d[6+i*16] or 256,'x',d[7+i*16] or 256) for i in range(n)]"`
- [ ] #4 `src/assets/apple-touch-icon.png` e 180×180 si are fundal opac (fara canal alfa transparent)
- [ ] #5 `src/index.html` (in jurul liniei 173) declara setul complet, in aceasta ordine: `<link rel="icon" href="/favicon.ico" sizes="32x32">`, `<link rel="icon" type="image/png" href="assets/favicon-48.png" sizes="48x48">`, `<link rel="icon" type="image/avif" href="assets/favicon.avif">`, `<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">`
- [ ] #6 Declaratia AVIF ramane, dar ULTIMA dintre cele de tip `icon` — progressive enhancement pentru browserele care o suporta
- [ ] #7 `angular.json` si `app.yaml` NU sunt modificate — `src/favicon.ico` e deja in lista de `assets`, iar handler-ul `/favicon.ico` exista deja (`app.yaml` liniile 36-39)
- [ ] #8 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Descoperire care schimba task-ul: `src/favicon.ico` **nu e ICO**, ci un PNG de 28×30 redenumit. Verificarea din 2026-07-06 („infrastructura e gata") era gresita — de aceea AC-ul vechi #1 (`Content-Type: image/x-icon`) parea indeplinit desi fisierul e invalid.

DECIZIE owner: se adauga `png-to-ico` si se genereaza ICO real din `src/assets/logo.avif`, prin script reproductibil (`scripts/generate-favicons.js`). Alternativele (doar PNG-uri, sau generare manuala de catre owner) au fost respinse.

AC-ul vechi #2 („favicon vizibil in tab pe Safari si Chrome — test manual") cere browsere reale → mutat in `## Verificare post-deploy (owner)`, inlocuit cu verificarea structurii binare a fisierului ICO, care e automatizabila.
<!-- SECTION:NOTES:END -->
