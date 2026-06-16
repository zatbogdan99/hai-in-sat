---
id: TASK-54
title: Restructurează pagina de anunț — șablon 300+ cuvinte cu preț vizibil
status: To Do
assignee: []
created_date: '2026-06-12 16:12'
updated_date: '2026-06-12 16:12'
labels:
  - seo
  - content
  - conversion
  - sxo
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/content.md
  - ../../../../seo-audit-2026-06-12/findings/sxo.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Anunțurile au azi **88–143 cuvinte totale** (30–80 distinctive), formate ca 5 bullet-uri (Locație/Suprafață/Preț/Telefon). Analiza SERP a auditului (findings/sxo.md, mismatch #1) arată că Google premiază pe TOATE interogările tranzacționale testate anunțuri de **300–600 cuvinte cu secțiuni structurate**; iar cumpărătorul de imobil rural așteaptă ~15 informații (acte, utilități, acces, distanțe) din care anunțurile oferă 4–5. Screenshot-ul mobil din audit arată și că **prețul nu e vizibil** pe unele anunțuri — pentru cumpărător „preț ascuns = telefon nedat".

Există model complet rescris (title + meta + H1 + structură H2 + text exemplu) în `seo-audit-2026-06-12/findings/content.md`.

## Cum

**1. Template nou `property-details` (frontend):**
- Deasupra fold-ului: H1 descriptiv („Teren intravilan 9.600 mp — Cerna, Vâlcea"), **preț vizibil** (total + €/mp), suprafață, localitate, CTA telefon.
- Paragraf-rezumat de 2-3 fraze (citabil, self-contained: ce, unde, cât, particularitatea).
- Secțiuni H2: „Descrierea proprietății", „Utilități și acces", „Acte și situație juridică", „Distanțe" (oraș, drum național, atracții), „Despre satul X" (2-3 fraze + link spre pagina satului — TASK-55).
- Hartă (embed static sau leaflet) cu locația aproximativă.
- CTA sticky pe mobil (buton „Sună acum").

**2. Date noi (backend + formular admin):** câmpuri structurate pentru: utilități (apă/curent/gaz/canalizare — checkbox-uri), situație juridică (CF, intravilan/extravilan), front stradal, acces (asfalt/pietruit), distanțe cheie, text descriptiv liber (minim încurajat 150 cuvinte). Formularul `/add-property` le cere la creare; pentru cele 14 existente se completează manual retroactiv.

**3. Fallback inteligent:** anunțurile fără câmpurile noi încă completate afișează ce există, fără secțiuni goale.

Sinergie: după acest task, meta description se generează din paragraful-rezumat (fără telefoane — TASK-52), iar schema primește câmpurile structurate (TASK-10).

## Fișiere afectate

- `src/app/property-details/*` (template + componentă)
- `src/app/add-property/*` (câmmpuri noi formular)
- Backend: `PropertyDTO` + model Mongo (câmpuri noi) — repo java
- `src/app/service/seo.service.ts` (meta description din rezumat)

## Efort

L (3–5 zile cu backend + completarea retroactivă a datelor pentru inventarul existent).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Șablonul nou afișează: H1 descriptiv cu suprafață+localitate, preț total și/sau €/mp VIZIBIL above-fold, paragraf-rezumat, minimum 3 secțiuni H2 din lista de mai sus
- [ ] #2 Fiecare anunț PUBLICAT după acest task are ≥300 cuvinte în HTML-ul SSR (verificabil cu crawler-ul de audit, coloana word_count)
- [ ] #3 Cele 14 anunțuri existente sunt completate retroactiv la ≥250 cuvinte cu secțiunile noi (sau marcate explicit pentru completare cu deadline în notes)
- [ ] #4 Formularul admin cere câmpurile structurate noi (utilități, acte, acces, distanțe) la adăugare; validare minimă pe descriere
- [ ] #5 CTA telefon sticky pe mobil funcțional (tel: link), hartă prezentă pe anunțurile cu localizare
- [ ] #6 Meta description se generează din rezumat (120–160 caractere, fără telefon) — nu mai e trunchiată din bullet-uri
- [ ] #7 Niciun anunț nu afișează secțiuni goale pentru date lipsă (fallback corect)
<!-- AC:END -->
