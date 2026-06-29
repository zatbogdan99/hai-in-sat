---
id: TASK-MANUAL-3
title: Re-rulează PageSpeed și capturează lab + field metrics
status: To Do
assignee: []
created_date: '2026-05-07 08:06'
updated_date: '2026-06-17 15:04'
labels:
  - seo
  - performance
  - monitoring
dependencies: []
documentation:
  - ../../seo-audit-output/FULL-AUDIT-REPORT.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

În auditul SEO inițial (2026-05-07) PageSpeed Insights API a returnat 429 (cota zilnică globală a proiectului anonim Google epuizată). Secțiunea Performance din `FULL-AUDIT-REPORT.md` a fost completată inferential pe baza dimensiunii resurselor, fără date Lighthouse efective sau CrUX field data.

E necesar să capturăm un baseline real ca să măsurăm impactul TASK-2 / TASK-4 / TASK-7 / TASK-14 / TASK-15 (cele cu impact perf).

## Cum

**Variantă rapidă (fără cont Google):**
1. Deschide https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fxn--hai-n-sat-t5a.ro%2F
2. Rulează pentru Mobile și Desktop.
3. Salvează:
   - Lighthouse scores: Performance, Accessibility, Best Practices, SEO
   - Core Web Vitals (LCP, INP, CLS) — atât lab cât și field (CrUX) dacă există
   - Top opportunities și diagnostics

**Variantă cu API key (recurent):**
1. Configurează Google API key (PageSpeed Insights API + Chrome UX Report API enabled).
2. `setx GOOGLE_API_KEY "..."` în PowerShell.
3. `python C:/Users/Bogd/.claude/skills/seo/scripts/pagespeed_check.py https://xn--hai-n-sat-t5a.ro/ --strategy both --json > seo-audit-output/pagespeed-baseline-$(date +%F).json`

**Repetă** după ce livrezi TASK-2/4/7/14/15 ca să măsori delta.

## Output

Fișier `seo-audit-output/PERFORMANCE-BASELINE.md` cu:
- Date capturare (timestamp)
- Mobile + Desktop scores
- Lab metrics: FCP, LCP, TBT, SI, CLS, Speed Index
- Field metrics (CrUX): LCP p75, INP p75, CLS p75 — dacă site-ul are trafic suficient pentru CrUX. Dacă nu, notează „insufficient data".
- Top 10 opportunities cu estimated savings
- Captură de ecran a raportului PSI ca dovadă

## Efort

30 min pentru rulare manuală; 1 oră pentru API key + script.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Există fișier `seo-audit-output/PERFORMANCE-BASELINE.md` cu data, scoruri Lighthouse mobile + desktop
- [ ] #2 Capturi atât lab metrics (FCP, LCP, TBT, CLS, Speed Index) cât și field metrics (din CrUX) sau notă explicită că field data nu e disponibilă
- [ ] #3 Top 10 opportunities listate cu estimated savings (KB sau ms)
- [ ] #4 Updatat secțiunea Performance din `FULL-AUDIT-REPORT.md` cu numărul real, înlocuind valorile inferred
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid (deliverable de masurare). Nu exista seo-audit-output/PERFORMANCE-BASELINE.md. De rulat PageSpeed dupa deploy-ul SSR + Node22 + hero re-encodat (task-7) ca sa avem baseline real post-imbunatatiri.

SUPERSEDED in mare parte: auditul nou 2026-06-12 (seo-audit-2026-06-12/findings/performance.md + crawl/) a capturat deja metrici reale lab (LCP 7,1s anunt mobil, 29,6s /properties; TTFB warm 1,4s / cold 5-29s). Scopul principal (baseline real de performanta) e indeplinit. Ramane optional doar actualizarea vechiului FULL-AUDIT-REPORT.md. Recomand inchiderea/arhivarea ca superseded - confirma tu.
<!-- SECTION:NOTES:END -->
