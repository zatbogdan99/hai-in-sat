---
id: TASK-113
title: Redirect 301 www→apex și http→https
status: Done
assignee: []
created_date: '2026-06-12 16:07'
updated_date: '2026-08-07'
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
const CANONICAL_HOST = 'xn--hai-n-sat-t5a.ro';
const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

server.use((req, res, next) => {
  const host = req.headers.host ?? '';
  const rawProto = req.headers['x-forwarded-proto'] ?? 'https'; // GAE setează x-forwarded-proto
  const proto = Array.isArray(rawProto) ? rawProto[0] : rawProto;

  // Excepție localhost (decizie owner 2026-08-07): fără ea, `npm run serve:ssr`
  // ar răspunde 301 spre producție la orice verificare SSR locală.
  if (LOCAL_HOST_PATTERN.test(host)) {
    return next();
  }

  if (host !== CANONICAL_HOST || proto !== 'https') {
    return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
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
- **Excepția pentru localhost (decizie owner 2026-08-07).** Fără ea, `localhost:4000` e un host non-canonic ca oricare altul, deci `npm run serve:ssr` ar răspunde 301 spre producție la orice cerere — inclusiv la formele simple din `backlog/docs/verificare-locala-ssr.md`, protocolul la care trimit AC-urile altor task-uri. Excepția se aplică DOAR pe `localhost`/`127.0.0.1`/`[::1]` (cu sau fără port); orice alt host non-canonic, inclusiv `*.appspot.com`, se redirecționează normal.
- **Consecință asumată:** URL-ul de versiune appspot (`https://<versiune>-dot-phrasal-period-415315.appspot.com`) răspunde 301 spre producție, deci nu mai poate fi folosit ca smoke-test în browser înainte de promovarea traficului. E efectul dorit pentru SEO (închide conținutul duplicat pe appspot); pentru smoke-test folosește `curl -H "Host: ..."` sau verifică după promovare.
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
- [x] #1 `src/server.ts` contine un middleware inregistrat cu `server.use(...)`, plasat ÎNAINTE de `server.get('*.*', express.static(...))` (azi linia ~37) si de catch-all-ul `server.get('*', ...)` (azi linia ~42) — verificabil prin numarul liniei
- [x] #2 Middleware-ul defineste constanta `CANONICAL_HOST = 'xn--hai-n-sat-t5a.ro'` (forma **punycode** — headerul `Host` soseste punycode, niciodata unicode) si redirectioneaza cu `res.redirect(301, ...)`; codul `301` apare literal in cod, nu 302
- [x] #3 Tinta redirectului se construieste ca `` `https://${CANONICAL_HOST}${req.originalUrl}` `` — `req.originalUrl` (pastreaza path + query string), NU `req.path` si NU `req.url`
- [x] #4 Protocolul se citeste din `req.headers['x-forwarded-proto']` si e normalizat pentru tipul `string | string[]` (ex. `Array.isArray(p) ? p[0] : p`); `req.secure` NU apare in cod (TLS se termina la Google Frontend, `req.secure` ar fi mereu false)
- [x] #5 Conditia de redirect e `host !== CANONICAL_HOST || proto !== 'https'`, iar ramura care nu redirectioneaza apeleaza `next()` — pe host canonic + https NU se redirectioneaza, deci nu exista bucla
- [x] #8 Middleware-ul are o exceptie pentru localhost inaintea conditiei de redirect (decizie owner 2026-08-07): host-ul `localhost`, `127.0.0.1` sau `[::1]`, cu sau fara port, apeleaza `next()` fara redirect. Exceptia e limitata la aceste trei forme — `*.appspot.com` si orice alt host non-canonic se redirectioneaza normal. Verificat prin protocolul SSR local, cu iesirea lipita in `## Implementation Notes`: `curl -sI http://localhost:4000/` → **NU** 301 (200 sau raspunsul normal al rutei)
- [x] #6 Diff-ul NU modifica handler-ul `server.get('*', ...)` existent (timeout de render 25 s + raspuns 503 prin `SSR_RENDER_STATE`, livrat de TASK-47) si nici error handler-ul de la linia ~68
- [x] #7 Implementatorul a rulat protocolul SSR local (vezi `backlog/docs/verificare-locala-ssr.md`) si a lipit iesirea in `## Implementation Notes`: `curl -sI -H "Host: www.xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" "http://localhost:4000/properties?type=land"` → 301 cu `Location: https://xn--hai-n-sat-t5a.ro/properties?type=land`; `curl -sI -H "Host: xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: http" http://localhost:4000/` → 301; `curl -sI -H "Host: xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" http://localhost:4000/` → **NU** 301
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline): AC-urile erau formulate ca `curl` pe domeniul de PRODUCTIE — imposibil de verificat de pipeline, care se opreste la PR fara deploy. Rescrise ca verificari statice pe `src/server.ts` + protocolul SSR local pe `http://localhost:4000` (cu headere `Host`/`X-Forwarded-Proto` simulate). Verificarile pe productie au fost mutate in sectiunea `## Verificare post-deploy (owner)` din descriere.

Ordinea middleware-urilor in `server.ts`, cand se implementeaza si TASK-114/TASK-116, ramane: 1) redirect host/proto (acest task), 2) security headers (TASK-114), 3) cache SSR (TASK-116), 4) render.

Decizie owner 2026-08-07 (inainte de rularea prin pipeline): middleware-ul primeste o **exceptie pentru localhost**, adaugata ca AC #8 si reflectata in snippet-ul din descriere. Motivul: formularea stricta a AC #5 trata `localhost:4000` ca host non-canonic, deci `npm run serve:ssr` ar fi raspuns 301 spre productie la orice verificare SSR locala — ar fi rupt `backlog/docs/verificare-locala-ssr.md`, protocolul la care trimit AC-urile altor task-uri. Exceptia NU acopera `*.appspot.com`: URL-urile de versiune raman redirectionate (efect dorit pentru SEO), cu pretul ca nu mai pot fi folosite ca smoke-test in browser inainte de promovarea traficului.

Implementare (2026-08-07): middleware-ul de redirect a fost adaugat in `src/server.ts`, ca `server.use(...)` la linia 37 (intre `server.set('views', distFolder);` si comentariul `// Example Express Rest API endpoints`) — inaintea lui `server.get('*.*', express.static(...))` (linia 57) si a catch-all-ului SSR `server.get('*', ...)` (linia 62), ambele neatinse, la fel ca error handler-ul de la finalul lui `app()`. Constantele `CANONICAL_HOST`/`LOCAL_HOST_PATTERN` sunt la nivel de modul, imediat dupa `RETRY_AFTER_SECONDS`. Rulat `npm run build` complet (`ng build && ng run hai-in-sat:server`, ambele bundle-uri, fara erori de tip). Protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) a fost rulat cu serverul pornit din radacina repo-ului pe `http://localhost:4000`; iesirile curl reale (AC #7, #8):

```
$ curl.exe -sI http://localhost:4000/
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 113038
ETag: W/"1b98e-jpqIT4/jrv53y9gqMOr6Gaj1+Qc"
Date: Fri, 07 Aug 2026 09:31:46 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl.exe -sI -H "Host: www.xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" "http://localhost:4000/properties?type=land"
HTTP/1.1 301 Moved Permanently
X-Powered-By: Express
Location: https://xn--hai-n-sat-t5a.ro/properties?type=land
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 83
Date: Fri, 07 Aug 2026 09:31:56 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl.exe -sI -H "Host: xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: http" http://localhost:4000/
HTTP/1.1 301 Moved Permanently
X-Powered-By: Express
Location: https://xn--hai-n-sat-t5a.ro/
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 63
Date: Fri, 07 Aug 2026 09:32:01 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl.exe -sI -H "Host: xn--hai-n-sat-t5a.ro" -H "X-Forwarded-Proto: https" http://localhost:4000/
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 113045
ETag: W/"1b995-5Jlfgt64py5cHePdMyjgg7nMJsE"
Date: Fri, 07 Aug 2026 09:32:08 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl.exe -sI -H "Host: 20260807t000000-dot-phrasal-period-415315.appspot.com" -H "X-Forwarded-Proto: https" http://localhost:4000/
HTTP/1.1 301 Moved Permanently
X-Powered-By: Express
Location: https://xn--hai-n-sat-t5a.ro/
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 63
Date: Fri, 07 Aug 2026 09:32:15 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Serverul a fost oprit dupa verificari (`Stop-Process`); portul 4000 confirmat liber.

---

## Livrare 2026-08-07 (dev-pipeline, branch `ticket/task-113-redirect-301-www-apex-https`)

**Ce s-a implementat** (doar frontend; backend-ul nu a fost atins):

- `src/server.ts` — diff strict aditiv, 20 de linii, zero linii sterse. Doua constante la nivel de modul (`CANONICAL_HOST` in punycode, `LOCAL_HOST_PATTERN`) plus middleware-ul `server.use(...)` inserat la linia 37, adica inaintea lui `server.get('*.*', express.static(...))` (acum linia 57) si a catch-all-ului SSR (acum linia 62). Exceptia localhost e evaluata PRIMA, inaintea conditiei de redirect — invers ar fi fost cod mort.
- Fisierul de task — iesirile curl reale ale protocolului SSR local, lipite mai sus (cerinta AC #7 si #8).

**Verificat:** `npm run build` (ambele bundle-uri) → exit 0. Type-check-ul lui `server.ts` se face EXCLUSIV prin `ng run hai-in-sat:server` — `tsconfig.app.json` are `files: ["src/main.ts"]`, iar `tsconfig.spec.json` doar specurile; fara build complet, o eroare de tip ar fi trecut nedetectata pana la deploy. Suita Karma: 60/60 SUCCESS, rulata ca non-regresie (`server.ts` nu e acoperit de ea).

**Cicluri de review:** 1 din 3 — inchis din primul, cu 0 blocker si 0 major.
**Verdict verify:** `allCriteriaMet: true`, toate cele 8 criterii indeplinite, `missing` gol. Verifier-ul a validat si autenticitatea iesirilor curl lipite: `Content-Length` 83 si 63 corespund exact corpului generat de Express („Moved Permanently. Redirecting to <url>"), iar prefixul hex al ETag-urilor egaleaza `Content-Length` — semn ca iesirile au fost capturate, nu reconstituite.

**Divergenta de formulare** (semnalata de verifier, neblocanta): AC #2 spune „middleware-ul defineste constanta `CANONICAL_HOST`", dar constanta e la nivel de modul (linia 13), nu in interiorul callback-ului. Judecat indeplinit — exact asa arata si snippet-ul aprobat de owner in descriere, iar intentia (o singura sursa punycode, folosita in redirect) e respectata.

**Nit amanat:** comentariile noi din `src/server.ts` (liniile 36 si 42-43) sunt in romana fara diacritice, spre deosebire de snippet-ul din descriere si de restul repo-ului. Pur cosmetic.

**Ramane de facut de owner:** sectiunea „Verificare post-deploy (owner)" de mai sus. In special punctul 1 din GCP Console — daca `www.hai-în-sat.ro` NU e mapat ca custom domain pe `phrasal-period-415315`, cererea catre www nu ajunge deloc la Node si middleware-ul n-are ce normaliza: codul ar fi corect, dar bug-ul ar ramane viu.
<!-- SECTION:NOTES:END -->
