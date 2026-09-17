---
id: TASK-114
title: Adaugă security headers pe App Engine
status: Done
assignee:
  - '@codex'
created_date: '2026-05-07 07:55'
updated_date: '2026-09-17 12:31'
labels:
  - seo
  - security
  - infra
dependencies:
  - TASK-113
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

**Corecție de mecanism (verificat 2026-07-06):** HTML-ul e randat SSR de Node prin handler-ul `script: auto` din `app.yaml`, iar handlerele `script: auto` NU suportă `http_headers` — deci header-ele pe HTML se pun în **`src/server.ts`** (middleware Express), nu în app.yaml. `http_headers` din app.yaml rămân utile doar pentru asseturile statice (opțional; sinergic cu TASK-117).

> **DECIS de owner (2026-07-27):** middleware scris **manual**, FARA `helmet` — nicio dependenta noua in `package.json`. Se livreaza cele 5 headere + CSP in mod **Report-Only**. Trecerea CSP pe enforce NU face parte din acest task (vezi „Ce NU intra in scope" mai jos).

1. În `src/server.ts`, middleware devreme (după redirectul din TASK-113, înaintea catch-all-ului SSR):

```ts
server.use((req, res, next) => {
  res.set({
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });
  next();
});
```

2. Pentru CSP, începe cu `Content-Security-Policy-Report-Only` (NU enforce!) ca să identifici toate sursele:

```
default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
```

Note CSP (starea actuală a codului): `img-src data:` e OBLIGATORIU azi (pozele proprietăților sunt data:URI base64 — până la TASK-3); `font-src`/`style-src` cu domeniile Google Fonts sunt necesare până la TASK-15 (self-host); `script-src https://www.youtube.com` pentru iframe_api din index.html; `'unsafe-inline'` la script-src e cerut de scripturile inline din index.html (force-light-scheme + hash redirect). Monitorizează violations 1-2 săptămâni (consola browserului pe paginile-cheie), ajustează, apoi schimbă în `Content-Security-Policy` enforced.

3. HSTS cu `includeSubDomains` — abia DUPĂ ce TASK-113 (www→apex) e live, altfel www-ul nefuncțional pe https ar fi forțat. De aceea acest task are `dependencies: [TASK-113]`.

## Ce NU intra in scope (decizie owner 2026-07-27)

- **CSP enforced.** Se livreaza DOAR `Content-Security-Policy-Report-Only`. Fiind report-only, politica nu poate rupe nimic functional — de aceea acest task nu are criterii de regresie functionala pe CSP.
- **Monitorizarea violation-urilor** (1-2 saptamani, consola browserului pe paginile-cheie) e treaba owner-ului, dupa deploy. Vezi „Verificare post-deploy".
- **Trecerea pe enforce** se face intr-un task NOU, deschis de owner dupa monitorizare, cu politica ajustata pe baza violation-urilor reale. Nu-l anticipa aici.

Doua note de continut pentru politica CSP, valabile la 2026-07-27:
- `img-src ... data:` ramane **OBLIGATORIU** — pozele proprietatilor sunt inca base64 `data:URI`; TASK-3 (migrarea lor) e in `backlog/manual/`, deci nu se rezolva curand.
- domeniile Google Fonts raman **OBLIGATORII** in `style-src`/`font-src` — TASK-15 (self-host fonturi) e tot in `backlog/manual/`.

## Fișiere afectate

- `src/server.ts` (singurul fisier de cod modificat — headerele pe HTML-ul SSR)
- `package.json` — **NU se modifica** (fara `helmet`, fara alte dependente)
- `app.yaml` — **NU se modifica** in acest task (headerele pe handlerele statice sunt scope-ul TASK-117)

## Efort

2 ore.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

```bash
curl -sI https://xn--hai-n-sat-t5a.ro/
```

Apoi:
1. https://securityheaders.com/?q=https://xn--hai-n-sat-t5a.ro/ — astepti rating **B sau mai bun**.
2. Deschide in browser paginile-cheie (`/`, `/properties`, o pagina de anunt, `/login`, `/add-property`) cu consola deschisa si **noteaza violation-urile CSP** raportate de politica Report-Only. Login-ul Firebase, embed-ul YouTube, fonturile Google si apelurile spre backend trebuie sa functioneze — daca ceva apare ca violation, e o sursa lipsa din politica.
3. Dupa 1-2 saptamani de monitorizare, deschide un task NOU pentru trecerea pe `Content-Security-Policy` enforced, cu politica ajustata.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `src/server.ts` contine un middleware `server.use(...)` care seteaza prin `res.set({...})` exact aceste 5 headere, cu aceste valori: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- [x] #2 Al 6-lea header este `Content-Security-Policy-Report-Only` — numele contine literal `-Report-Only`; headerul `Content-Security-Policy` simplu (enforced) NU apare nicaieri in cod
- [x] #3 Politica CSP contine, pe langa restul directivelor din descriere, `data:` in `img-src` si domeniile `fonts.googleapis.com` / `fonts.gstatic.com` in `style-src` / `font-src` — sunt obligatorii cat timp TASK-3 si TASK-15 sunt in `backlog/manual/`
- [x] #4 Middleware-ul e plasat DUPA middleware-ul de redirect host/proto din TASK-113 si ÎNAINTE de catch-all-ul `server.get('*', ...)` — verificabil prin numarul liniei
- [x] #5 `package.json` NU e modificat: zero dependente noi, in special FARA `helmet` (decizie owner)
- [x] #6 `app.yaml` NU e modificat de acest task
- [x] #7 Logica de timeout/503 din TASK-47 (`SSR_RENDER_STATE`) si error handler-ul de la linia ~68 raman neatinse
- [x] #8 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit in `## Implementation Notes` iesirea `curl -sI http://localhost:4000/`, in care se vad toate cele 6 headere
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Adauga in src/server.ts middleware dupa redirectul TASK-113, cu cele cinci headere si CSP Report-Only exact conform cerintelor. 2. Ruleaza build-ul complet, suita test:ci si protocolul SSR local; verifica headerele, redirectul si raspunsul 503. 3. Salveaza dovezile in task, bifeaza criteriile si livreaza commit plus PR pe ticket/task-114-security-headers, fara deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. Nici app.yaml nici server.ts nu seteaza vreun security header (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy). Cu SSR Express acum, varianta cea mai simpla e middleware in server.ts (ex. helmet) inainte de handlerul Angular.
Revizuire 2026-07-27 (pregatire pentru pipeline). Trei ambiguitati eliminate:
1. „manual sau cu helmet" — DECIS: manual, fara dependenta noua.
2. AC-ul vechi #4 cerea „CSP-Report-Only setat cel putin 1 saptamana inainte de switch" — o conditie de TIMP, imposibil de verificat de un agent la momentul PR-ului. Scope-ul s-a fixat pe report-only; enforce = task nou, deschis de owner dupa monitorizare.
3. AC-ul vechi #2 (securityheaders.com rating B) si #3 (aplicatia functioneaza in browser) cereau productie live → mutate in `## Verificare post-deploy (owner)`.

Dependenta `TASK-113` e reala, nu decorativa: HSTS cu `includeSubDomains` fara redirectul www→apex ar forta https pe un subdomeniu care poate nu raspunde.

## Implementare directa 2026-09-17

Branch: ticket/task-114-security-headers. Implementat direct, fara dev-pipeline.

- src/server.ts: middleware nou dupa redirectul TASK-113 si inainte de static/SSR; cele cinci headere au valorile cerute, CSP este exclusiv Report-Only si pastreaza data:, Google Fonts, Firebase/API si YouTube.
- package.json, lockfile-urile si app.yaml nu sunt modificate. Timeout-ul de 25 secunde, SSR_RENDER_STATE si error handler-ul 503 sunt neatinse.
- npm run build: PASS, bundle browser si bundle SSR. Avertismente de buget SCSS in info-page, properties si under-the-mountain, fisiere nemodificate de acest task.
- npm run test:ci: PASS, TOTAL: 60 SUCCESS (ChromeHeadless).
- HTTP local: /, /login, /add-property, /about-us, /contact-us si /properties raspund 200 cu toate cele sase headere si fara CSP enforced.
- Redirectul www -> apex pastreaza statusul 301, path-ul si query string-ul.
- Verificare controlata a erorii SSR: acelasi bundle pornit pe portul 4001 dintr-un director temporar fara dist/index, provocand eroare de render. Raspunsul 503 pastreaza toate headerele de securitate, Retry-After: 60, X-Robots-Tag: noindex, nofollow si Cache-Control: no-store. Nu au fost schimbate fisierele aplicatiei pentru acest test.
- Procesele SSR locale pornite pentru verificare au fost oprite.
- Review separat read-only: fara probleme blocante; criteriile 1-7 confirmate din diff, criteriul 8 demonstrat mai jos.

### Protocol SSR local: iesiri reale

Comanda: curl.exe -sI http://localhost:4000/

```text
HTTP/1.1 200 OK
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
Content-Type: text/html; charset=utf-8
Content-Length: 113038
ETag: W/"1b98e-jpqIT4/jrv53y9gqMOr6Gaj1+Qc"
Date: Thu, 17 Sep 2026 12:29:34 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Comanda: curl.exe -sI -H "Host: www.xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" "http://localhost:4000/properties?type=land"

```text
HTTP/1.1 301 Moved Permanently
X-Powered-By: Express
Location: https://xn--hai-n-sat-t5a.ro/properties?type=land
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 83
Date: Thu, 17 Sep 2026 12:29:37 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Comanda: curl.exe -sI http://localhost:4001/ (eroare SSR controlata, director temporar fara index)

```text
HTTP/1.1 503 Service Unavailable
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
Retry-After: 60
X-Robots-Tag: noindex, nofollow
Cache-Control: no-store
Content-Type: text/html; charset=utf-8
Content-Length: 856
ETag: W/"358-/Hj8Yw6d1tLEAKJS5FgI7lTYtbs"
Date: Thu, 17 Sep 2026 12:29:38 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Livrarea se opreste la PR. Deploy-ul si verificarile post-deploy raman la owner: HTTPS/redirect www (TASK-113), verificarea headerelor live si monitorizarea CSP in consola browserului 1-2 saptamani. CSP enforce necesita task separat; aceasta livrare nu configureaza colectarea automata a rapoartelor.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adaugate cele cinci headere de securitate si CSP Report-Only pe raspunsurile SSR. Build browser+SSR reusit, 60/60 teste trecute, headere verificate local pe raspunsuri 200 si 503, redirect 301 verificat. Fara dependente noi sau modificari App Engine. Deploy manual dupa review.
<!-- SECTION:FINAL_SUMMARY:END -->
