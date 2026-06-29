---
id: TASK-MANUAL-2
title: 'Verifică domeniul în GSC și Bing Webmaster, submitează sitemap'
status: To Do
assignee: []
created_date: '2026-05-07 08:05'
updated_date: '2026-06-17 15:04'
labels:
  - seo
  - monitoring
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fără verificare GSC + sitemap submit explicit nu avem vizibilitate pe:
- Câte URL-uri sunt indexate vs descoperite vs excluse
- Erori de crawl, soft 404 detectate de Google
- Impressions/clicks/CTR/position pe queries
- Mobile usability issues
- Core Web Vitals din field data

Fără asta, audituri viitoare lucrează orbește. Cost: 1 oră.

## Cum

1. **Google Search Console** (https://search.google.com/search-console):
   - Adaugă proprietate de tip „Domain" pentru `hai-in-sat.ro` și `xn--hai-n-sat-t5a.ro` (ambele forme — Google le tratează ca proprietăți distincte chiar și cu redirect).
   - Verifică prin DNS TXT record (preferat) sau HTML file upload.
   - În Sitemaps, submitează: `https://xn--hai-n-sat-t5a.ro/sitemap.xml`
   - În Settings → Indexing crawler, verifică status.

2. **Bing Webmaster Tools** (https://www.bing.com/webmasters): import direct din GSC sau add și verify separat. Bing oferă date complementare + IndexNow.

3. **Activare IndexNow** (Bing/Yandex): la fiecare add-property sau update significant, trimite ping IndexNow. `SeoService` poate avea metoda `notifyIndexNow(url[])`. Cheie API se obține de la Bing Webmaster.

4. După verificare, configurează `python C:/Users/Bogd/.claude/skills/seo/scripts/google_auth.py` cu credențiale Service Account → audituri viitoare au date GSC live (`/seo google` skill).

## Notă

Nu necesită modificări în repo decât pentru IndexNow (opțional). Restul e config în consolele Google/Bing.

## Fișiere afectate (opțional, doar pentru IndexNow)

- `src/app/service/seo.service.ts` (metoda `notifyIndexNow`)
- (eventual) backend Java emite ping IndexNow la create/update property

## Efort

1 oră pentru GSC+Bing setup. +2-4 ore pentru IndexNow integration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Domeniul `xn--hai-n-sat-t5a.ro` este verificat în Google Search Console
- [ ] #2 Sitemap submitat în GSC, status = Success, URLs discovered ≥ 22
- [ ] #3 Domeniul este verificat și în Bing Webmaster Tools
- [ ] #4 În GSC se văd prima dată impressions/clicks (chiar dacă valori mici la început)
- [ ] #5 (Opțional) IndexNow API key configurat în deploy + ping trimis la primul add-property test
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid (config in consolele Google/Bing, nu cod). Nu exista metoda notifyIndexNow in SeoService si niciun ping IndexNow in backend. Restul = actiuni externe (verificare GSC/Bing, submit sitemap).

Cross-ref: complementar cu noul TASK-59 - TASK-21 = Search Console (Google/Bing Webmaster) + submit sitemap + IndexNow; TASK-59 = Google Business Profile + Bing PLACES + citations. Produse Bing diferite (Webmaster vs Places).
<!-- SECTION:NOTES:END -->
