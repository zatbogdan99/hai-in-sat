---
id: TASK-5
title: Setează cache imutabil pe bundle-urile cu hash
status: To Do
assignee: []
created_date: '2026-05-07 07:54'
updated_date: '2026-06-17 15:03'
labels:
  - seo
  - performance
  - infra
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fișierele `runtime.*.js`, `main.*.js`, `polyfills.*.js`, `styles.*.css` au nume cu hash de conținut (immutable prin design Angular CLI). Sunt servite cu `Cache-Control: public, max-age=600` — vizitatorii revalidează la fiecare 10 minute. Penalizare directă pe LCP la vizitele recurente.

Cea mai mare îmbunătățire de performance la cel mai mic efort.

## Cum

În `hai-in-sat/hai-in-sat/app.yaml`, adaugă handler dedicat pentru fișiere cu hash de 16 hex înainte de catch-all:

```yaml
- url: /(.+\.[0-9a-f]{16}\.(?:js|css))
  static_files: dist/hai-in-sat/\1
  upload: dist/hai-in-sat/.+\.[0-9a-f]{16}\.(?:js|css)
  http_headers:
    Cache-Control: "public, max-age=31536000, immutable"
```

Pentru imagini din `/assets` cu nume stabile (`poza_landing1.avif`, etc.), adaugă cache de 30 zile (`max-age=2592000`) sau implementează versionare în nume (recomandat la modificări viitoare).

`index.html` trebuie să rămână cu cache scurt (`max-age=600` sau `no-cache`) — altfel update-urile Angular nu ajung niciodată la utilizatorii recurenți.

## Verificare

`curl -I https://xn--hai-n-sat-t5a.ro/main.<hash>.js` — header `Cache-Control` trebuie să fie `public, max-age=31536000, immutable`.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/app.yaml`

## Efort

1 oră (modificare + deploy + verificare).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `curl -I` pe `runtime.<hash>.js` returnează `Cache-Control: public, max-age=31536000, immutable`
- [ ] #2 `curl -I` pe `main.<hash>.js` returnează același header
- [ ] #3 `curl -I` pe `styles.<hash>.css` returnează același header
- [ ] #4 `curl -I` pe `/` (index.html) păstrează cache scurt (`max-age=600` sau `no-cache`)
- [ ] #5 App Engine handlers ordonate corect: hashed assets înainte de fallback la `index.html`
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. server.ts:26-28 serveste static cu express.static(maxAge 1y) -> seteaza max-age=31536000 dar FARA flag-ul immutable; HTML-ul SSR (res.send) nu are Cache-Control explicit. app.yaml nu are http_headers de cache pe handlere. De adaugat immutable pe assets cu hash si no-store pe HTML SSR.

Cross-ref: NU e duplicat cu TASK-11/TASK-13 - sunt 3 straturi distincte de caching: TASK-5 = assets cu hash (JS/CSS) immutable; TASK-11 = HTML-ul SSR (TTL scurt); TASK-13 = Brotli pe assets. Se completeaza, se pot implementa impreuna in server.ts.
<!-- SECTION:NOTES:END -->
