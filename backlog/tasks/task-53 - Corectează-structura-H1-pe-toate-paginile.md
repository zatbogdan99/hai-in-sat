---
id: TASK-53
title: Corectează structura H1 pe toate paginile
status: To Do
assignee: []
created_date: '2026-06-12 16:11'
updated_date: '2026-06-12 16:11'
labels:
  - seo
  - on-page
  - content
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Inventarul auditului 2026-06-12 (`seo-audit-2026-06-12/crawl/inventory.csv`, coloana h1_count):

| Pagină | H1 | Problema |
|---|---|---|
| `/under-the-mountain` | **0** | fără heading principal |
| `/contact-us` | **0** | fără heading principal |
| `/village-of-the-month` | **3** | H1 multiplu |
| `/homes` | **2** | H1 multiplu |
| `/see-the-area` | **2** | H1 multiplu |
| `/about-us` | **2** | H1 multiplu |
| `/` | 1 | OK ca număr, dar „E timpul să te întorci la liniște" nu conține NICIUN termen de căutare |

Cauza probabilă a H1-urilor duble (per audit conținut): template-urile randează simultan varianta desktop ȘI varianta mobilă a aceluiași heading (două elemente, ascunse alternativ prin CSS) — Googlebot le vede pe amândouă în DOM.

## Cum

1. **Paginile cu 0 H1**: adaugă H1 descriptiv — `/under-the-mountain`: „Oltenia de sub Munte — regiunea" (cu termeni regionali); `/contact-us`: „Contactează Hai în Sat — agenție imobiliară în Horezu".
2. **Paginile cu H1 multiplu**: păstrează UN singur element `<h1>` și fă responsive prin clase CSS (font-size pe breakpoint), nu prin elemente duplicate. Unde al doilea H1 e alt mesaj (nu duplicat responsive), retrogradează-l la `<h2>`.
3. **Homepage**: fă H1-ul să conțină termenii de căutare — ex. `<h1>Case și terenuri de vânzare în Oltenia de sub Munte</h1>` cu sloganul „E timpul să te întorci la liniște" ca subtitlu (`<p class="hero-tagline">` sau `<h2>`). Alternativ păstrează sloganul vizual mare și pune termenii în H1 — decizia de design rămâne, dar H1-ul semantic trebuie să conțină termenii.
4. Verifică ierarhia: fără sărituri H1→H3 fără H2 pe paginile editate.

## Fișiere afectate

- Template-urile componentelor: under-the-mountain, contact-us, village-of-the-month, homes, see-the-area, about-us, new-landing-page (homepage)

## Efort

M (jumătate de zi — e mai mult grijă la CSS responsive decât cod).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fiecare pagină din sitemap are EXACT un `<h1>` în HTML-ul brut SSR (verificare automată: re-rulează crawler-ul din `seo-audit-2026-06-12/crawl/crawl.py` și compară coloana h1_count — toate = 1)
- [ ] #2 `/under-the-mountain` și `/contact-us` au H1 descriptiv în română cu termenii relevanți
- [ ] #3 H1-ul homepage conține cel puțin „case", „terenuri" sau „Oltenia de sub Munte" (termeni de căutare), iar sloganul rămâne vizibil ca subtitlu
- [ ] #4 Variantele desktop/mobile ale aceluiași heading sunt UN singur element cu CSS responsive, nu elemente duplicate
- [ ] #5 Designul nu regresează vizual pe mobil și desktop (verificare manuală pe 390px și 1366px)
<!-- AC:END -->
