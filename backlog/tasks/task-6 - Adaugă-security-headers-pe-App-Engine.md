---
id: TASK-6
title: Adaugă security headers pe App Engine
status: To Do
assignee: []
created_date: '2026-05-07 07:55'
updated_date: '2026-06-17 08:45'
labels:
  - seo
  - security
  - infra
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Response-ul curent are doar `Server: Google Frontend`, `Content-Type`, `Cache-Control`. Lipsesc complet:
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Impact direct pe ranking este mic, dar:
- Semnal de calitate/încredere (parte din Google Page Experience).
- Protecție utilizator: site-ul are formular de contact și login Firebase, deci clickjacking este risk real.
- Lighthouse Best Practices și securityheaders.com ajung la rating C/D.

## Cum

În `hai-in-sat/hai-in-sat/app.yaml`, adaugă în secțiunea handlers (sau `default_expiration`) `http_headers`:

```yaml
http_headers:
  Strict-Transport-Security: "max-age=31536000; includeSubDomains; preload"
  X-Content-Type-Options: "nosniff"
  X-Frame-Options: "SAMEORIGIN"
  Referrer-Policy: "strict-origin-when-cross-origin"
  Permissions-Policy: "geolocation=(), microphone=(), camera=()"
```

Pentru CSP, începe cu `Content-Security-Policy-Report-Only` (NU enforce!) ca să identifici toate sursele:

```yaml
  Content-Security-Policy-Report-Only: "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com; frame-src https://www.youtube.com;"
```

Monitorizează violations 1-2 săptămâni, ajustează, apoi schimbă în `Content-Security-Policy` enforced.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/app.yaml`

## Efort

2 ore (config) + 1-2 săptămâni monitoring CSP înainte de enforce.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `curl -I https://xn--hai-n-sat-t5a.ro/` returnează toate cele 5 header-e: HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- [ ] #2 https://securityheaders.com/?q=https://xn--hai-n-sat-t5a.ro/ returnează rating B sau mai bun
- [ ] #3 Aplicația funcționează corect: login Firebase, YouTube embed, fonturi Google, API call-uri spre backend Java toate trec fără erori în consolă
- [ ] #4 CSP-Report-Only setat (nu enforce) cel puțin 1 săptămână înainte de switch
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. Nici app.yaml nici server.ts nu seteaza vreun security header (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy). Cu SSR Express acum, varianta cea mai simpla e middleware in server.ts (ex. helmet) inainte de handlerul Angular.
<!-- SECTION:NOTES:END -->
