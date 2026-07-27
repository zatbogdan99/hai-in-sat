---
id: TASK-113
title: Redirect 301 www→apex și http→https
status: To Do
assignee: []
created_date: '2026-06-12 16:07'
updated_date: '2026-07-27'
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
- Pe GAE Standard, TLS se termină la Google Frontend — folosește `x-forwarded-proto`, nu `req.secure`. Atenție: header-ul poate fi teoretic `string | string[]` — normalizează cu `String(...)` sau ia primul element.
- **Unde exact în `server.ts` (verificat 2026-07-06):** structura curentă e `server.get('*.*', express.static(...))` (linia ~37) urmată de catch-all-ul SSR `server.get('*', ...)` (linia ~42, cu timeout + error handler din TASK-47 — LIVRAT). Middleware-ul de redirect se pune cu `server.use(...)` ÎNAINTE de amândouă. Nu atinge logica de timeout/503 existentă.
- În PRODUCȚIE, asseturile statice (js/css/imagini) sunt servite direct de GAE prin handlerele din `app.yaml` și NU trec prin Node — deci redirectul de host se aplică efectiv doar rutelor HTML (exact ce contează pentru SEO). Nu încerca să acoperi asseturile.
- Verifică în GCP Console că `www.hai-în-sat.ro` e mapat ca custom domain (altfel www nu ajunge deloc la aplicație — dacă nu e mapat și totuși răspunde 200, vine de pe certificat wildcard + mapare implicită; după mapare corectă middleware-ul îl normalizează).
- Același middleware ar prelua automat și redirectul ASCII→IDN dacă domeniul ASCII ar fi vreodată înregistrat (TASK-MANUAL-1 — mutat în **wont-do**, decizie owner 2026-07-06: cost neasumat momentan). **TASK-113 NU depinde de acel task** — normalizează orice host non-canonic care ajunge la aplicație.
- Sinergie cu TASK-114: HSTS cu `includeSubDomains` are sens DOAR după ce www redirecționează corect.
- Ordinea middleware-urilor când se vor implementa și TASK-114/TASK-116 (toate în `server.ts`): 1) redirect host/proto (acesta), 2) security headers (TASK-114), 3) cache SSR (TASK-116), 4) render.

## Fișiere afectate

- `src/server.ts`

## Efort

S (1-2 ore).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy (vezi `AGENTS.md`). Dupa merge si deploy manual:

```bash
curl -sI http://xn--hai-n-sat-t5a.ro/
curl -sI https://www.xn--hai-n-sat-t5a.ro/
curl -sI "https://www.xn--hai-n-sat-t5a.ro/properties?type=land"
curl -sIL https://xn--hai-n-sat-t5a.ro/
```

Astepti: primele trei → `301` cu `Location` pe forma canonica, cu path si query pastrate; ultima → se termina in `200`, fara hop suplimentar si fara bucla.

Doua lucruri de verificat manual in GCP Console:
1. `www.hai-în-sat.ro` e mapat ca **custom domain** pe proiectul `phrasal-period-415315` — altfel cererea catre www nu ajunge deloc la aplicatie si middleware-ul n-are ce normaliza.
2. Asseturile statice (servite direct de GAE, bypass Node) raspund in continuare 200 pe host-ul canonic.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/server.ts` contine un middleware inregistrat cu `server.use(...)`, plasat ÎNAINTE de `server.get('*.*', express.static(...))` (azi linia ~37) si de catch-all-ul `server.get('*', ...)` (azi linia ~42) — verificabil prin numarul liniei
- [ ] #2 Middleware-ul defineste constanta `CANONICAL_HOST = 'xn--hai-n-sat-t5a.ro'` (forma **punycode** — headerul `Host` soseste punycode, niciodata unicode) si redirectioneaza cu `res.redirect(301, ...)`; codul `301` apare literal in cod, nu 302
- [ ] #3 Tinta redirectului se construieste ca `` `https://${CANONICAL_HOST}${req.originalUrl}` `` — `req.originalUrl` (pastreaza path + query string), NU `req.path` si NU `req.url`
- [ ] #4 Protocolul se citeste din `req.headers['x-forwarded-proto']` si e normalizat pentru tipul `string | string[]` (ex. `Array.isArray(p) ? p[0] : p`); `req.secure` NU apare in cod (TLS se termina la Google Frontend, `req.secure` ar fi mereu false)
- [ ] #5 Conditia e `host !== CANONICAL_HOST || proto !== 'https'`, iar ramura care nu redirectioneaza apeleaza `next()` — pe host canonic + https NU se redirectioneaza, deci nu exista bucla
- [ ] #6 Diff-ul NU modifica handler-ul `server.get('*', ...)` existent (timeout de render 25 s + raspuns 503 prin `SSR_RENDER_STATE`, livrat de TASK-47) si nici error handler-ul de la linia ~68
- [ ] #7 Implementatorul a rulat protocolul SSR local (vezi `backlog/docs/verificare-locala-ssr.md`) si a lipit iesirea in `## Implementation Notes`: `curl -sI -H "Host: www.xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" "http://localhost:4000/properties?type=land"` → 301 cu `Location: https://xn--hai-n-sat-t5a.ro/properties?type=land`; `curl -sI -H "Host: xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: http" http://localhost:4000/` → 301; `curl -sI -H "Host: xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" http://localhost:4000/` → **NU** 301
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline): AC-urile erau formulate ca `curl` pe domeniul de PRODUCTIE — imposibil de verificat de pipeline, care se opreste la PR fara deploy. Rescrise ca verificari statice pe `src/server.ts` + protocolul SSR local pe `http://localhost:4000` (cu headere `Host`/`X-Forwarded-Proto` simulate). Verificarile pe productie au fost mutate in sectiunea `## Verificare post-deploy (owner)` din descriere.

Ordinea middleware-urilor in `server.ts`, cand se implementeaza si TASK-114/TASK-116, ramane: 1) redirect host/proto (acest task), 2) security headers (TASK-114), 3) cache SSR (TASK-116), 4) render.
<!-- SECTION:NOTES:END -->
