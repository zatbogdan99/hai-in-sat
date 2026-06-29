---
id: TASK-56
title: Întărește E-E-A-T pe about-us — echipă, CUI, poveste, dovezi
status: To Do
assignee: []
created_date: '2026-06-12 16:14'
updated_date: '2026-06-12 16:14'
labels:
  - seo
  - content
  - trust
  - eeat
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Auditul de conținut (findings/content.md, finding HIGH #8): `/about-us` are 211 cuvinte și **zero credențiale verificabile** — niciun om cu nume și chip, fără CUI/date de firmă vizibile în body (există doar în JSON-LD, invizibil pentru utilizator), fără poveste, fără portofoliu de tranzacții, fără testimoniale. Pentru un site care intermediază tranzacții de zeci de mii de euro, Quality Rater Guidelines cere exact aceste semnale de încredere; lipsa lor plafonează tot site-ul (E-E-A-T e evaluat la nivel de site pentru teme YMYL — iar imobiliarele sunt YMYL).

Bonus AI (findings/geo.md G6): LLM-urile ponderează autorul/entitatea — un „despre noi" solid crește șansa de citare a întregului site.

## Cum

1. **Persoane reale**: minim o persoană cu nume complet, fotografie reală (nu stock), rol și 2-3 fraze de bio („cine sunt, de ce Oltenia de sub Munte"). Pozele profesionale dar autentice.
2. **Date de firmă vizibile în text**: S.C. CORUXMAN IMPEX S.R.L., CUI, nr. Reg. Com., adresa Str. Tudor Vladimirescu, Horezu — în body-ul paginii (nu doar JSON-LD) și în footer sitewide.
3. **Povestea** (200–300 cuvinte): de când, de ce, ce face diferit agenția (specializare exclusivă pe rural Oltenia de sub Munte = unghiul unic).
4. **Dovezi**: cifre reale dacă există („X proprietăți intermediate din 2024", „prezenți în 6 comune"), presă/parteneriate când apar (TASK-59 / link building).
5. **Cross-link**: secțiune contact cu telefonul oficial (TASK-19) + link spre GBP/social.
6. Țintă: pagina ajunge la 500+ cuvinte cu substanță, H1 unic (TASK-21 repară dublura).

Notă: conținutul cere input de la owner (nume, poze, poveste, CUI public) — blochează pe colectarea materialelor, nu pe cod.

## Fișiere afectate

- `src/app/about-us/*` (sau componenta echivalentă)
- footer sitewide (date firmă)
- `src/assets/` (foto echipă)

## Efort

M (2-3 ore cod + materialele de la owner).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /about-us conține minim o persoană reală cu nume, fotografie și rol
- [ ] #2 Datele firmei (denumire, CUI, Reg. Com., adresă completă cu cod poștal 245800) sunt vizibile ca TEXT în pagină și în footer-ul sitewide
- [ ] #3 Pagina are ≥500 cuvinte cu poveste/diferențiator, fără umplutură generică
- [ ] #4 Telefonul afișat = cel oficial din TASK-19; link-uri funcționale spre profilurile sociale și (după TASK-59) spre GBP
- [ ] #5 H1 unic pe pagină; title/meta description actualizate să reflecte „agenție imobiliară în Horezu / Oltenia de sub Munte"
- [ ] #6 Orice cifră publicată („X tranzacții") e reală și confirmată de owner — nimic inventat
<!-- AC:END -->
