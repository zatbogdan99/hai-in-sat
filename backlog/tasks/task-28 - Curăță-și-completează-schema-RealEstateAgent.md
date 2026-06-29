---
id: TASK-28
title: Curăță și completează schema RealEstateAgent
status: To Do
assignee: []
created_date: '2026-05-07 07:59'
updated_date: '2026-06-17 15:03'
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

Notă: drop „București" și „România" — acestea diluează semnalul. Dacă serviți București ca audiență sursă (cumpărători din capitală), păstrați-l ca `areaServed` dar nu adăugați „România" generic.
## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/index.html` (bloc JSON-LD `RealEstateAgent`)

## Efort

30 min.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 JSON-LD validator (validator.schema.org) confirmă schema `RealEstateAgent` fără erori critice
- [ ] #2 `address.postalCode = "245800"`
- [ ] #3 `priceRange` folosește format acceptat de Google (`$$` - `$$$$` sau range numeric cu valută)
- [ ] #4 `email` folosește formă ASCII (xn--hai-n-sat-t5a.ro)
- [ ] #5 `areaServed` nu mai conține entry generic „România"
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. index.html:36-81 RealEstateAgent inca are: priceRange '€€' (nestandard), fara postalCode, areaServed inca include 'Bucuresti' si 'Romania' generic, email contact@hai-în-sat.ro (IDN, nu ASCII). (openingHours scos din scope 2026-06-28 — nu exista program bine definit.)

Cross-ref: se completeaza cu TASK-19 (unificare NAP/telefon). (TASK-56 — E-E-A-T about-us, cod postal vizibil in body — a fost mutat in wont-do.) TASK-28 = curatenia campurilor schema RealEstateAgent (priceRange/postalCode/areaServed/email ASCII); de aliniat telefonul oficial cu decizia din TASK-19.
<!-- SECTION:NOTES:END -->
