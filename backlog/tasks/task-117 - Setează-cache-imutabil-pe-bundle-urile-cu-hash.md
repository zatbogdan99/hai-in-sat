---
id: TASK-117
title: Setează cache imutabil pe bundle-urile cu hash
status: To Do
assignee: []
created_date: '2026-05-07 07:54'
updated_date: '2026-07-27'
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

**Context verificat (2026-07-06):** în producție, JS/CSS/imaginile sunt servite STATIC de App Engine prin handlerele din `app.yaml` (bypass Node) — deci headerele de cache se setează în `app.yaml`, pe handlere. (`express.static(distFolder, {maxAge: '1y'})` din `server.ts:37` contează doar la rulare locală prin Node; nu-l folosi ca soluție de producție. **DECIS: adaugă totuși `immutable: true` acolo**, ca headerele locale să fie identice cu cele din producție.)

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

HTML-ul (randat SSR de Node) NU e atins de acest task — politica lui de cache o stabilește TASK-116 (azi nu are niciun `Cache-Control`). Important e ca HTML-ul să NU primească din greșeală cache lung.

## Verificat 2026-07-27 — formatul hash-ului

Regexul de 16 hexazecimale e CORECT, confirmat pe un build real:

```
dist/hai-in-sat/browser/main.769d0c413edb7d52.js
dist/hai-in-sat/browser/runtime.56ac8f824c932b24.js
dist/hai-in-sat/browser/polyfills.24b942ea274d948b.js
dist/hai-in-sat/browser/styles.2286c2804fb6a4bf.css
dist/hai-in-sat/browser/76.61a0c91c454f3090.js
```

Exact 16 caractere `[0-9a-f]`, iar patternul prinde si chunk-urile lazy numerotate (`76.<hash>.js`). Nu re-inventa regexul.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/app.yaml` (handler nou + `http_headers` pe `/assets`)
- `hai-in-sat/hai-in-sat/src/server.ts` (linia ~37 — `immutable: true` pe `express.static`)

## Efort

1 oră.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Headerele din `app.yaml` **nu se pot testa local**: local, asseturile sunt servite de `express.static` din Node, in productie de handlerele GAE (bypass Node). De aceea corectitudinea `app.yaml` se verifica prin lectura, iar efectul real abia dupa deploy:

```bash
curl -sI https://xn--hai-n-sat-t5a.ro/main.<hash>.js
curl -sI https://xn--hai-n-sat-t5a.ro/styles.<hash>.css
curl -sI https://xn--hai-n-sat-t5a.ro/assets/poza_landing1.avif
curl -sI https://xn--hai-n-sat-t5a.ro/
```

Astepti: primele doua → `Cache-Control: public, max-age=31536000, immutable`; a treia → `max-age=2592000`; ultima (HTML SSR) → FARA cache lung.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `app.yaml` contine un handler nou cu `url: /(.+\.[0-9a-f]{16}\.(?:js|css))$`, `static_files: dist/hai-in-sat/browser/\1`, `upload: dist/hai-in-sat/browser/.+\.[0-9a-f]{16}\.(?:js|css)$`, `secure: always` si `http_headers` cu `Cache-Control: "public, max-age=31536000, immutable"`
- [ ] #2 Handler-ul nou apare la un numar de linie MAI MIC decat handler-ul generic existent `- url: /(.*\.(js|css|map|ico|png|jpg|jpeg|avif|svg|woff|woff2|ttf|eot|xml|txt|json))$` (azi linia 42) — la App Engine primul handler care potriveste castiga
- [ ] #3 Handler-ul `- url: /assets` cu `static_dir: dist/hai-in-sat/browser/assets` (azi liniile 22-24) a primit `http_headers` cu `Cache-Control: "public, max-age=2592000"`
- [ ] #4 Handler-ul `- url: /.*` cu `script: auto` (azi liniile 48-50) ramane NEATINS si NU primeste `http_headers` — App Engine le ignora pe handlerele `script:`, iar politica de cache pe HTML-ul SSR e a TASK-116
- [ ] #5 `src/server.ts` linia ~37: `express.static(distFolder, { maxAge: '1y' })` a primit si `immutable: true`
- [ ] #6 `app.yaml` ramane YAML valid si NU a capatat linia `service:` (vezi CLAUDE.md — deploy-ul merge la `default`, cu `--project` explicit). Implementatorul a rulat `python -c "import yaml; yaml.safe_load(open('app.yaml'))"` si a lipit rezultatul in `## Implementation Notes`
- [ ] #7 Implementatorul a rulat `npm run build:browser` si a lipit in `## Implementation Notes` iesirea `ls dist/hai-in-sat/browser/*.js dist/hai-in-sat/browser/*.css`, ca dovada ca numele reale de fisiere potrivesc regexul de 16 hexazecimale din handler
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. server.ts:26-28 serveste static cu express.static(maxAge 1y) -> seteaza max-age=31536000 dar FARA flag-ul immutable; HTML-ul SSR (res.send) nu are Cache-Control explicit. app.yaml nu are http_headers de cache pe handlere. De adaugat immutable pe assets cu hash si no-store pe HTML SSR.

Cross-ref: NU e duplicat cu TASK-116/TASK-13 - sunt 3 straturi distincte de caching: TASK-117 = assets cu hash (JS/CSS) immutable; TASK-116 = HTML-ul SSR (TTL scurt); TASK-13 = Brotli pe assets. Se completeaza, se pot implementa impreuna in server.ts.
Revizuire 2026-07-27 (pregatire pentru pipeline): AC-urile erau `curl` pe productie. Rescrise ca verificari de lectura pe `app.yaml` (ordinea handlerelor conteaza si e verificabila prin numarul liniei) + o validare de build ca regexul de 16 hex chiar potriveste numele generate de Angular. Headerele GAE NU se pot verifica local — `curl`-urile de productie au fost mutate in `## Verificare post-deploy (owner)`.

DECIZIE owner 2026-07-27: `immutable: true` se adauga si la `express.static` din `server.ts`, nu doar in `app.yaml` — nu mai e optional.
<!-- SECTION:NOTES:END -->
