---
id: TASK-21
title: Corectează structura H1 pe toate paginile
status: To Do
assignee: []
created_date: '2026-06-12 16:11'
updated_date: '2026-07-06'
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

Cauza CONFIRMATĂ în cod (2026-07-06): template-urile randează simultan varianta desktop (`.large-screen`) ȘI varianta mobilă (`.small-screen`) a aceluiași heading — două elemente în DOM, ascunse alternativ prin CSS. Googlebot le vede pe amândouă.

## Cum — cu locațiile exacte (verificate 2026-07-06)

1. **Paginile cu 0 H1**:
   - `/under-the-mountain` (`under-the-mountain.component.html`): există DEJA un hero cu H1 „Oltenia de sub Munte" COMENTAT la liniile 1–7 (cu TODO „mie mi se pare urat fara titlu"). Reactivează-l cu titlu descriptiv (ex. „Oltenia de sub Munte — sate autentice la poalele Carpaților") sau, dacă design-ul fără banner e preferat, pune H1 stilizat discret peste secțiunea „De ce Oltenia de sub Munte?" (azi H2, linia ~25).
   - `/contact-us` (`contact-us.component.html`): nu are NICIUN heading pe desktop (doar SVG + social); pe mobil are `<h2>Contactează-ne și hai în sat!</h2>` (linia ~72). Adaugă UN `<h1>` („Contactează Hai în Sat — agenție imobiliară în Horezu") vizibil în ambele layout-uri (element unic + CSS responsive).
2. **Paginile cu H1 multiplu** — păstrează UN singur `<h1>` per pagină, restul devin `<h2>`/`<h3>`; unde dublarea e doar desktop/mobil, folosește UN element cu clase CSS responsive:
   - `/village-of-the-month` (`village-of-the-month.component.html`): H1 „Satul {{title}}" (linia ~8) + H1 „Prezentarea satului" (linia ~22, id `card-info-title`) + dublurile din varianta small-screen. Păstrează „Satul {{title}}" ca H1; „Prezentarea satului" → `<h2>`.
   - `/homes` (`form-page.component.html`): H1 duplicat desktop/mobil la liniile 9 și 71 — iar varianta mobilă e FĂRĂ diacritice („cauti", „gasim"). Unifică într-un singur element (cu diacritice corecte).
   - `/see-the-area` (`see-the-area.component.html`): H1-uri la liniile ~6, 18, 37 (desktop) și ~64, 76, 93 (mobil) — „Haide să vezi zona" ×2 + „Cumpără"/„Închiriază" ×2. Păstrează „Haide să vezi zona" ca unic H1; „Cumpără"/„Închiriază" → `<h2>`.
   - `/about-us` (`about-us.component.html`): H1 „Despre noi" duplicat la liniile 16 (desktop) și 37 (mobil) → un singur element.
3. **Homepage** (`new-landing-page.component.html:4`): fă H1-ul să conțină termenii de căutare — ex. `<h1>Case și terenuri de vânzare în Oltenia de sub Munte</h1>` cu sloganul „E timpul să te întorci la liniște" ca subtitlu (`<p class="hero-tagline">` sau `<h2>`). Alternativ păstrează sloganul vizual mare și pune termenii în H1 — decizia de design rămâne, dar H1-ul semantic trebuie să conțină termenii.
4. Verifică ierarhia: fără sărituri H1→H3 fără H2 pe paginile editate.
5. NU atinge: `/properties` (are deja exact 1 H1 „Case și terenuri") și `/property/:id/:slug` (H1 = numele proprietății). Componentele ne-rutate (`home-page`, `see-the-area-buy/rent`, `info-page`) NU intră în acest task — soarta lor e tratată separat (curățenie cod mort, faza de review).

## Fișiere afectate

- `src/app/under-the-mountain/under-the-mountain.component.html` (+ .scss), `src/app/contact-us/contact-us.component.html` (+ .scss), `src/app/village-of-the-month/village-of-the-month.component.html`, `src/app/home-form-page/form-page.component.html`, `src/app/see-the-area/see-the-area.component.html`, `src/app/about-us/about-us.component.html`, `src/app/new-landing-page/new-landing-page.component.html`

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
