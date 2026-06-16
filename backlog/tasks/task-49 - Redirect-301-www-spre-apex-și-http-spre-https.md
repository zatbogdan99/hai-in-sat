---
id: TASK-49
title: Redirect 301 www→apex și http→https
status: To Do
assignee: []
created_date: '2026-06-12 16:07'
updated_date: '2026-06-12 16:07'
labels:
  - seo
  - technical
  - infra
  - quick-win
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/technical.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Auditul 2026-06-12 a verificat live:
- `https://www.xn--hai-n-sat-t5a.ro/` → **200 OK fără redirect** — site-ul există pe două host-uri; Google vede conținut duplicat (canonical-ul mitigează parțial, dar împarte semnalele de link).
- `http://xn--hai-n-sat-t5a.ro/` → **302** spre https (redirectul implicit GAE) — 302 e „temporar" și nu consolidează autoritatea; corect e **301**.

## Cum

Un singur middleware Express în `src/server.ts`, ÎNAINTE de servirea statică și de catch-all (rulează pentru toate cererile care ajung la Node):

```ts
server.use((req, res, next) => {
  const host = req.headers.host ?? '';
  const proto = req.headers['x-forwarded-proto'] ?? 'https'; // GAE setează x-forwarded-proto
  const canonicalHost = 'xn--hai-n-sat-t5a.ro';
  if (host !== canonicalHost || proto !== 'https') {
    return res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
  }
  next();
});
```

Note:
- Pe GAE Standard, TLS se termină la Google Frontend — folosește `x-forwarded-proto`, nu `req.secure`.
- Verifică în GCP Console că `www.hai-în-sat.ro` e mapat ca custom domain (altfel www nu ajunge deloc la aplicație — dacă nu e mapat și totuși răspunde 200, vine de pe certificat wildcard + mapare implicită; după mapare corectă middleware-ul îl normalizează).
- Același middleware va prelua și redirectul ASCII→IDN din TASK-8 când domeniul ASCII va exista (un singur loc pentru canonicalizarea de host).
- Sinergie cu TASK-6: HSTS cu `includeSubDomains` are sens DOAR după ce www redirecționează corect.

## Fișiere afectate

- `src/server.ts`

## Efort

S (1-2 ore cu tot cu verificare post-deploy).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `curl -sI http://xn--hai-n-sat-t5a.ro/` → `301` cu `Location: https://xn--hai-n-sat-t5a.ro/`
- [ ] #2 `curl -sI https://www.xn--hai-n-sat-t5a.ro/` → `301` cu `Location: https://xn--hai-n-sat-t5a.ro/`
- [ ] #3 Path-ul și query string-ul se păstrează: `curl -sI "https://www.xn--hai-n-sat-t5a.ro/properties?type=land"` → `Location: https://xn--hai-n-sat-t5a.ro/properties?type=land`
- [ ] #4 Lanțul e de UN singur hop spre forma canonică (http+www → direct https+apex, nu 2 redirecturi înlănțuite) — acceptabil maxim 2 dacă GAE forțează întâi https
- [ ] #5 Niciun redirect loop: `curl -sIL https://xn--hai-n-sat-t5a.ro/` se termină cu 200 pe primul răspuns
- [ ] #6 Asseturile statice servite direct de GAE (bypass Node) rămân funcționale pe host-ul canonic
<!-- AC:END -->
