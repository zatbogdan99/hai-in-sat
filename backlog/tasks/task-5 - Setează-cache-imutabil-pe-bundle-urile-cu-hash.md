---
id: TASK-5
title: Setează cache imutabil pe bundle-urile cu hash
status: To Do
assignee: []
created_date: '2026-05-07 07:54'
updated_date: '2026-07-06'
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

**Context verificat (2026-07-06):** în producție, JS/CSS/imaginile sunt servite STATIC de App Engine prin handlerele din `app.yaml` (bypass Node) — deci headerele de cache se setează în `app.yaml`, pe handlere. (`express.static(distFolder, {maxAge: '1y'})` din `server.ts:37` contează doar la rulare locală prin Node; nu-l folosi ca soluție de producție. Poți adăuga `immutable: true` acolo doar pentru consistență locală.)

În `hai-in-sat/hai-in-sat/app.yaml`, adaugă handler dedicat pentru fișiere cu hash de 16 hex **ÎNAINTE de handler-ul generic de asseturi existent** (cel cu `url: /(.*\.(js|css|map|...))$` — ordinea handlerelor contează, primul match câștigă):

```yaml
- url: /(.+\.[0-9a-f]{16}\.(?:js|css))$
  static_files: dist/hai-in-sat/browser/\1
  upload: dist/hai-in-sat/browser/.+\.[0-9a-f]{16}\.(?:js|css)$
  secure: always
  http_headers:
    Cache-Control: "public, max-age=31536000, immutable"
```

(Atenție la cale: output-ul build-ului e `dist/hai-in-sat/browser/`, ca la handlerele existente.)

Pentru imaginile din `/assets` (nume stabile: `poza_landing1.avif` etc.), adaugă `http_headers` cu cache de 30 zile (`max-age=2592000`) pe handler-ul `static_dir: dist/hai-in-sat/browser/assets` existent.

HTML-ul (randat SSR de Node) NU e atins de acest task — politica lui de cache o stabilește TASK-11 (azi nu are niciun `Cache-Control`). Important e ca HTML-ul să NU primească din greșeală cache lung.

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
- [ ] #4 `curl -I` pe `/` (HTML-ul SSR) NU are `Cache-Control` cu max-age lung (fie lipsește, fie ≤600s; politica finală e a TASK-11)
- [ ] #5 App Engine handlers ordonate corect: handler-ul cu hash + immutable apare ÎNAINTE de handler-ul generic de asseturi din `app.yaml`, iar asseturile ne-hash-uite își păstrează comportamentul
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. server.ts:26-28 serveste static cu express.static(maxAge 1y) -> seteaza max-age=31536000 dar FARA flag-ul immutable; HTML-ul SSR (res.send) nu are Cache-Control explicit. app.yaml nu are http_headers de cache pe handlere. De adaugat immutable pe assets cu hash si no-store pe HTML SSR.

Cross-ref: NU e duplicat cu TASK-11/TASK-13 - sunt 3 straturi distincte de caching: TASK-5 = assets cu hash (JS/CSS) immutable; TASK-11 = HTML-ul SSR (TTL scurt); TASK-13 = Brotli pe assets. Se completeaza, se pot implementa impreuna in server.ts.
<!-- SECTION:NOTES:END -->
