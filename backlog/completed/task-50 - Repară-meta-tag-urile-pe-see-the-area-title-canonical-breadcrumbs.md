---
id: TASK-50
title: Repară meta tag-urile pe /see-the-area (title, canonical, breadcrumbs)
status: Done
assignee: []
created_date: '2026-06-12 16:08'
updated_date: '2026-06-12 16:08'
labels:
  - seo
  - on-page
  - quick-win
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/technical.md
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Crawl-ul auditului 2026-06-12 arată că `/see-the-area` e singura pagină din sitemap care NU își setează meta-urile pe rută — moștenește totul din template-ul `index.html`:
- **title duplicat** cu homepage („Hai în Sat – Case și terenuri de vânzare în Oltenia de sub Munte"),
- **canonical greșit**: `<link rel="canonical" href="https://hai-în-sat.ro/">` → pagina se declară singură duplicat al homepage-ului; **Google nu o va indexa pe URL-ul propriu** (pagină SEO-moartă),
- meta description duplicată cu homepage,
- **fără BreadcrumbList** (singura pagină fără — restul au),
- bonus din audit conținut: are și 2× H1 (se tratează unitar în TASK-119).

Pagina e o galerie foto regională („Vezi zona") — exact genul de pagină care poate prinde căutări de tip „Oltenia de sub Munte imagini/peisaje".

## Cum

În componenta rutei `/see-the-area` (vezi `src/app/app.routes.ts` pentru maparea componentă), în `ngOnInit`, după modelul celorlalte pagini statice (ex. `about-us`):

1. `seo.updatePageMeta({ title: 'Vezi zona – Peisaje din Oltenia de sub Munte | Hai în Sat', description: '<150-160 caractere despre galerie: sate, munte, Horezu, Polovragi...>', canonical: 'https://hai-în-sat.ro/see-the-area', ogImage: <o imagine reprezentativă din galerie> })`
2. `seo.setBreadcrumbs([{ Acasă, / }, { 'Vezi zona', /see-the-area }])`
3. Verifică că `SeoService` setează corect și og:title/og:description/og:url pe valori specifice paginii.

## Fișiere afectate

- componenta pentru ruta `see-the-area` (`src/app/...`)
- (verificare) `src/app/service/seo.service.ts`

## Efort

S (sub 1 oră).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `curl https://xn--hai-n-sat-t5a.ro/see-the-area` (HTML brut SSR) conține `<title>` UNIC, diferit de homepage, ≤60 caractere, cu termenii zonei
- [ ] #2 Canonical-ul din HTML brut este `https://hai-în-sat.ro/see-the-area` (self-canonical), nu `/`
- [ ] #3 Meta description unică (nu cea din index.html), 120–160 caractere
- [ ] #4 JSON-LD `BreadcrumbList` prezent: Acasă → Vezi zona, cu ultimul item = canonical-ul paginii
- [ ] #5 og:title / og:description / og:url specifice paginii în HTML brut
- [ ] #6 Re-crawl după deploy: pagina nu mai apare ca „titlu duplicat" și „canonical mismatch" (comparativ cu `seo-audit-2026-06-12/crawl/inventory.csv`)
<!-- AC:END -->
