---
id: TASK-MANUAL-1
title: Înregistrează domeniul ASCII hai-in-sat.ro și redirect 301
status: To Do
assignee: []
created_date: '2026-05-07 07:57'
updated_date: '2026-07-06'
labels:
  - seo
  - domain
  - brand-protection
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
> ⛔ **WONT-DO (decizie owner, 2026-07-06):** amânat — costul înregistrării domeniului ASCII la rotld nu se justifică momentan. De reevaluat când bugetul permite. **Notă tehnică:** TASK-4 (redirect 301 www→apex și http→https) NU depinde de acest task — middleware-ul lui normalizează ORICE host non-canonic, deci merge înainte fără nicio modificare; dacă domeniul ASCII va fi cumpărat vreodată, redirectul ASCII→IDN va funcționa automat prin același middleware, fără muncă suplimentară.

> ⚠️ **TASK MANUAL (owner) — fără cod în repo.** Constă în acțiuni externe: achiziție domeniu la registrar, configurare DNS, mapare custom domain în GCP Console, verificare în GSC. Redirectul efectiv ASCII→IDN NU se face aici — l-ar trata middleware-ul de canonicalizare host din `src/server.ts` (TASK-4 — planificat, încă NEIMPLEMENTAT la 2026-07-06), care va prelua automat orice host non-canonic odată ce domeniul ASCII e mapat. Pipeline-ul de cod NU poate „implementa" acest task; rămâne pentru owner. De rulat după/împreună cu TASK-4.

## De ce

Domeniul curent este IDN: `hai-în-sat.ro` (Unicode), serializat ca `xn--hai-n-sat-t5a.ro` (punycode). Forma ASCII `hai-in-sat.ro` NU se rezolvă DNS (NXDOMAIN). Mulți utilizatori români tastează fără diacritice (mai ales pe tastaturi mobile setate pe English layout) — acești utilizatori NU pot ajunge pe site.

În plus:
- **Brand protection**: oricine poate cumpăra `hai-in-sat.ro` și impersona brandul.
- **SEO marginal**: Google poate trata cele două domenii separat dacă cineva le cumpără; canonicalizare incertă.

## Cum

1. Înregistrează `hai-in-sat.ro` la rotld.ro (registrar oficial .ro) sau intermediar (Hostico, GoDaddy.ro etc.). Cost: ~25 EUR/an.
2. Configurează DNS: A/AAAA records către IP App Engine sau CNAME către `ghs.googlehosted.com` (dacă folosești App Engine custom domain).
3. În Google Cloud Console (App Engine → Custom Domains), adaugă `hai-in-sat.ro` ca domeniu mapped la același service. Verifică DNS challenge.
4. **Redirect 301 ASCII→IDN: NU se configurează aici.** Middleware-ul de canonicalizare host din `src/server.ts` (TASK-4) redirectează deja orice host non-canonic (inclusiv `hai-in-sat.ro`) spre `https://xn--hai-n-sat-t5a.ro`, păstrând path-ul — odată ce domeniul ASCII e mapat în GCP, redirectul funcționează automat. NU adăuga un handler separat în `app.yaml`.
5. Direcția canonică rămâne IDN (`xn--hai-n-sat-t5a.ro`) — vezi Recomandare. (A schimba canonicul pe ASCII ar însemna update în tot codul — JSON-LD, sitemap.xml, OG, `BASE_URL` din `seo.service.ts` și `generate-sitemap.js` — și NU se face în acest task.)

## Recomandare

Păstrează IDN ca formă canonică (rebranding ar fi muncă mai mare), redirectează ASCII → IDN.

## Fișiere afectate

- (nimic în repo dacă păstrezi IDN; tot lucru pe DNS și App Engine console)
- Dacă schimbi canonical pe ASCII: `src/app/service/seo.service.ts`, `scripts/generate-sitemap.js`, `src/index.html` JSON-LD, `src/sitemap.xml` (regenerat).

## Efort

2 ore (achiziție domeniu, DNS, redirect) + 1-2 zile timp de propagare DNS.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 DNS lookup pe `hai-in-sat.ro` returnează IP valid (App Engine)
- [ ] #2 `curl -I https://hai-in-sat.ro/` returnează HTTP 301 cu `Location: https://xn--hai-n-sat-t5a.ro/`
- [ ] #3 `curl -I https://hai-in-sat.ro/properties` returnează 301 cu `Location: https://xn--hai-n-sat-t5a.ro/properties` (path păstrat)
- [ ] #4 Certificat SSL valid pe `hai-in-sat.ro` (managed prin App Engine)
- [ ] #5 Google Search Console: `hai-in-sat.ro` adăugat ca proprietate și verificat (pentru a urmări dacă apar impresii pe forma ASCII)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid (tine de DNS/registrar, nu de cod). Nota: CORS-ul backend (SecurityConfig.java:69-77) accepta deja pattern-urile https://hai-in-sat.ro si *.hai-in-sat.ro, deci forma ASCII e pregatita server-side; lipseste doar inregistrarea domeniului + redirect 301. Canonical ramane IDN peste tot in cod.

Cross-ref: redirectul efectiv e tratat de noul TASK-4 (acelasi middleware server.ts) - TASK-4 spune explicit ca preia si ASCII->IDN cand domeniul ASCII exista. TASK-8 ramane pentru inregistrarea domeniului ASCII (DNS/registrar) + GSC. De facut dupa/impreuna cu TASK-4.
<!-- SECTION:NOTES:END -->
