---
id: TASK-20
title: Adaugă reviews și AggregateRating schema
status: To Do
assignee: []
created_date: '2026-05-07 08:05'
updated_date: '2026-06-17 15:04'
labels:
  - seo
  - schema
  - social-proof
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fără semnal de social proof în SERP. Concurenții (imobiliare.ro, OLX) folosesc rating star-uri în rich results. Pentru o agenție regională micro, testimoniale autentice de la clienți reali (cu permisiune) sunt diferențiator real.

## Cum

1. Colectează 5-15 testimoniale de la clienți care au cumpărat prin Hai în Sat. Include: nume (cu acord), localitate, scurtă poveste 2-3 propoziții, opțional rating 1-5.
2. Creează componenta `Testimonials` și o secțiune pe `/about-us` sau pagină dedicată `/testimoniale`.
3. Markup JSON-LD pe `RealEstateAgent` în `src/index.html`:

```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "reviewCount": "12",
  "bestRating": "5",
  "worstRating": "1"
},
"review": [
  {
    "@type": "Review",
    "author": {"@type":"Person","name":"<Nume>"},
    "reviewRating": {"@type":"Rating","ratingValue":"5","bestRating":"5"},
    "reviewBody": "<text testimonial>",
    "datePublished": "<ISO date>"
  }
]
```

4. Cere acord scris de la fiecare client înainte de publicare.

Nu inventa rating-uri, nu reutiliza testimoniale fictive — Google penalizează review schema spam.

## Conformitate

Schema review/aggregateRating este permisă pe `LocalBusiness`/`RealEstateAgent` (verificat). NU e nevoie de `FAQPage` (care e restricționat la guvern/healthcare începând cu Aug 2023).

## Fișiere afectate

- `src/app/components/testimonials/*` (de creat) sau extindere `/about-us`
- `src/index.html` (`aggregateRating` + `review` în JSON-LD `RealEstateAgent`)

## Efort

Variabil — depinde de timp pentru colectare consimțământ și redactare. 2-4 ore pentru implementare tehnică odată ce conținutul e disponibil.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cel puțin 5 testimoniale autentice colectate cu acord scris al clienților
- [ ] #2 Pagina cu testimoniale (sau secțiune `/about-us`) afișează review-urile cu nume, localitate, text
- [ ] #3 JSON-LD `RealEstateAgent` extins cu `aggregateRating` (calculate corect) și array `review[]`
- [ ] #4 Google Rich Results Test confirmă schema validă fără warnings critice
- [ ] #5 Niciun rating sau text inventat — totul confirmat cu sursă
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. index.html RealEstateAgent nu are aggregateRating/review. Blocat in principal de colectarea testimonialelor reale cu acord (AC#1) - nu e o problema de cod.

Cross-ref: se leaga de noul TASK-56 (E-E-A-T - colectare testimoniale pe about-us) si TASK-59 (recenzii Google/GBP). TASK-20 = markup-ul JSON-LD review/aggregateRating; sursa de testimoniale reale vine din TASK-56/59. Markup-ul se face dupa ce exista testimoniale reale.
<!-- SECTION:NOTES:END -->
