---
id: TASK-123
title: Curăță și completează schema RealEstateAgent
status: To Do
assignee: []
created_date: '2026-05-07 07:59'
updated_date: '2026-07-27'
labels:
  - seo
  - schema
  - local
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Schema `RealEstateAgent` din `src/index.html` este 80% bună, dar are:

1. **areaServed prea larg**: include „România" — diluează semnalul de relevanță locală pentru o agenție regională.
2. **postalCode lipsă**: `PostalAddress` nu are `postalCode` (Horezu = 245800).
3. **priceRange = `€€`**: două caractere euro non-standard. Google preferă `$$` / `$$$` (1-4 simboluri $) sau range numeric (`€500,000-€2,000,000`).
4. **email cu IDN**: `contact@hai-în-sat.ro` este invalid per RFC pentru clienți care nu suportă SMTPUTF8/EAI. Folosește forma ASCII: `contact@xn--hai-n-sat-t5a.ro`.

## Cum

În `src/index.html`, blocul JSON-LD `RealEstateAgent`:

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "...": "...",
  "email": "contact@xn--hai-n-sat-t5a.ro",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Str. Tudor Vladimirescu",
    "addressLocality": "Horezu",
    "addressRegion": "Vâlcea",
    "postalCode": "245800",
    "addressCountry": "RO"
  },
  "areaServed": [
    {"@type":"Place","name":"Horezu, Vâlcea","geo":{"@type":"GeoCoordinates","latitude":45.1472,"longitude":24.0033}},
    {"@type":"Place","name":"Polovragi, Gorj"},
    {"@type":"Place","name":"Costești, Vâlcea"},
    {"@type":"Place","name":"Vaideeni, Vâlcea"},
    {"@type":"Place","name":"Baia de Fier, Gorj"},
    {"@type":"Place","name":"Cerna, Vâlcea"},
    {"@type":"Place","name":"Oltenia de sub Munte"}
  ]
}
```

**DECIS (2026-07-27): se sterg AMANDOUA** — si „București", si „România". `areaServed` ramane exact lista de 7 locuri din blocul de mai sus (Horezu cu `geo`, Polovragi, Costești, Vaideeni, Baia de Fier, Cerna, Oltenia de sub Munte). Nu pastra Bucuresti „ca audienta sursa" — `areaServed` inseamna zona SERVITA, nu de unde vin cumparatorii.

Note suplimentare (verificare 2026-07-06, blocul e la `index.html:33-82`):
- `telephone` e deja corect (`+40728140628`, linia 42) — nu-l atinge; doar aliniat cu TASK-118.
- `sameAs` există (Facebook/Instagram/TikTok, liniile 75-79) — după TASK-MANUAL-4 (GBP) se va adăuga acolo și URL-ul profilului Google Business.
- **Consecvența email-ului în restul site-ului**: `mailto:contact@hai-în-sat.ro` (forma IDN) apare în `contact-us.component.html:91` și în dialogul Contact din `app.component.html`. Cele două forme sunt ACELAȘI domeniu (unicode vs punycode), dar unii clienți de mail eșuează pe forma unicode. La schimbarea email-ului din schema pe forma ASCII, schimbă și `mailto:`-urile pe ASCII (textul AFIȘAT poate rămâne cu diacritice).

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/index.html` (bloc JSON-LD `RealEstateAgent`, liniile 33-82)
- `src/app/contact-us/contact-us.component.html` + `src/app/app.component.html` (doar `mailto:` → forma ASCII)

## Efort

30 min.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. https://validator.schema.org/ pe `https://hai-în-sat.ro/` — `RealEstateAgent` fara erori critice.
2. Google Rich Results Test pe aceeasi pagina.
3. Trimite un e-mail de test la `contact@xn--hai-n-sat-t5a.ro` si confirma ca ajunge (forma ASCII e acelasi domeniu ca varianta cu diacritice, dar merita verificat o data).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/index.html`, blocul JSON-LD `RealEstateAgent` (azi liniile 33-82): `address.postalCode` = `"245800"`
- [ ] #2 `priceRange` foloseste un format acceptat de Google — `"$$"` (azi e `"€€"`, doua caractere euro, nestandard)
- [ ] #3 `email` din schema e in forma ASCII: `contact@xn--hai-n-sat-t5a.ro`
- [ ] #4 Link-urile `mailto:` de pe site folosesc si ele forma ASCII: `contact-us.component.html` (azi linia ~91) si dialogul Contact din `app.component.html`. Textul AFISAT poate ramane cu diacritice — se schimba doar valoarea din `href`
- [ ] #5 `git grep "mailto:contact@hai-" src/` returneaza 0 rezultate (nicio forma unicode ramasa intr-un `mailto:`)
- [ ] #6 `areaServed` contine EXACT cele 7 locuri din descriere si nu mai contine nici „România", nici „București"
- [ ] #7 Intrarea pentru Horezu pastreaza `geo` cu `latitude: 45.1472` si `longitude: 24.0033`
- [ ] #8 `telephone` ramane `+40728140628` (azi linia 42 — deja corect, nu-l atinge; e aliniat cu TASK-118)
- [ ] #9 `sameAs` ramane cu cele trei retele existente (azi liniile 75-79) — profilul Google Business se adauga abia dupa TASK-MANUAL-4, nu aici
- [ ] #10 JSON-ul din blocul `<script type="application/ld+json">` ramane VALID dupa editare: implementatorul a extras blocul si a rulat un parser (`python -c "import json,sys; json.load(...)"`), lipind rezultatul in `## Implementation Notes`
- [ ] #11 Implementatorul a rulat protocolul SSR local si a confirmat ca schema apare in HTML-ul brut: `curl -s http://localhost:4000/ | grep -c "RealEstateAgent"` ≥ 1
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. index.html:36-81 RealEstateAgent inca are: priceRange '€€' (nestandard), fara postalCode, areaServed inca include 'Bucuresti' si 'Romania' generic, email contact@hai-în-sat.ro (IDN, nu ASCII). (openingHours scos din scope 2026-06-28 — nu exista program bine definit.)

Cross-ref: se completeaza cu TASK-118 (unificare NAP/telefon). (TASK-56 — E-E-A-T about-us, cod postal vizibil in body — a fost mutat in wont-do.) TASK-123 = curatenia campurilor schema RealEstateAgent (priceRange/postalCode/areaServed/email ASCII); de aliniat telefonul oficial cu decizia din TASK-118.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Nota despre „București" oferea doua variante („dropati-l" / „pastrati-l ca audienta sursa") → DECIS: se sterge, ca si „România". `areaServed` e fixat la 7 intrari enumerate.
2. AC-ul vechi #1 (validator.schema.org) si #3 (Google Rich Results) cer unelte externe → mutate in `## Verificare post-deploy (owner)`; in AC a ramas o verificare care chiar se poate automatiza: JSON-ul parseaza fara eroare.
3. Adaugat AC pe `mailto:`-uri, care in varianta veche erau doar o nota in descriere, nu un criteriu.

`openingHours` ramane in afara scope-ului (scos 2026-06-28 — nu exista program bine definit).
<!-- SECTION:NOTES:END -->
