---
id: TASK-116
title: Cache pentru HTML-ul SSR pe rutele publice
status: Done
assignee:
  - '@codex'
created_date: '2026-06-12 16:09'
updated_date: '2026-09-28 21:02'
labels:
  - seo
  - performance
  - ssr
dependencies:
  - TASK-115
  - TASK-47
documentation:
  - ../../../../seo-audit-2026-06-12/findings/performance.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fiecare request re-randează pagina prin CommonEngine + fetch spre backend, deși paginile publice eligibile au același HTML SSR pentru vizitatori. Măsurat în audit (2026-06-12): TTFB warm ~1,4 s pe homepage (pragul „good" e 0,8 s), TTFB cold 5–29 s. HTML-ul se servește **fără niciun header `Cache-Control`**.

Un cache SSR în memorie și un Cache-Control scurt reduc timpul de răspuns pentru accesările repetate. O instanță nouă începe cu un cache gol; primul acces necesită randare. Câștigul real de performanță se măsoară după deploy.

**TASK-47 e LIVRAT (PR #3, 2026-06-28)** — `server.ts` are deja timeout de render (25 s) + handler 503 prin `SSR_RENDER_STATE`, deci precondiția e îndeplinită: se poate cache-ui în siguranță DOAR ce nu e marcat `serviceUnavailable`.

## Cum

1. În `src/server.ts`, înainte de `commonEngine.render()`: cache LRU în memorie cu dependența `lru-cache`, **`max: 100` intrări** și **`ttl: 300_000` ms (5 minute)** — valori fixate, nu le re-alege. Cheia = **`req.path`** (path-ul, fără query string; paginile care depind de query — `/properties?page=2` — se tratează la pct. 2).
2. Cache DOAR pentru: metoda **GET**, rute publice (exclude explicit `/login` și `/add-property`) și DOAR răspunsuri 200 — adică NU salva în cache când `ssrRenderState.serviceUnavailable` (503, TASK-47) sau `ssrRenderState.notFound` (404, TASK-115) sunt setate.

   **Cereri cu query string:** dacă `req.query` are vreo cheie, NU cache-ui deloc (ocolire, direct la render). Așa `/properties?page=2` nu poate fi servit de pe cheia `/properties`, fără să fie nevoie de normalizare de query. E soluția simplă și corectă la scara actuală — nu construi normalizare de parametri.
3. Header pe HTML-ul randat: `Cache-Control: public, max-age=300` (5 min) — permite și CDN-ului Google Frontend / browserului să rețină puțin, fără să blocheze actualizările de anunțuri (TTL-ul scurt e compromisul corect pentru un site cu listinguri).
4. Invalidare: TTL-ul + restart la deploy (instanță nouă = cache gol) sunt suficiente la scara actuală; nu construi invalidare activă acum.
5. Loghează hit/miss (un header de debug `X-Cache: HIT|MISS`) ca să poți verifica AC-urile.
6. **Ordinea în lanțul de middleware** (dacă TASK-113/TASK-114 sunt deja făcute): redirect host (TASK-113) → security headers (TASK-114) → cache SSR (acesta) → render. Dacă TASK-113 NU e încă făcut, cheia pe path e totuși sigură: www și apex produc HTML identic (canonical-ul vine din constanta BASE_URL, nu din host-ul cererii).

## Fișiere afectate

- `src/server.ts`
- `package.json` (dependență `lru-cache`)

## Efort

M (o jumătate de zi cu teste).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. **TTFB warm**: doua cereri consecutive pe `https://xn--hai-n-sat-t5a.ro/`; a doua trebuie sa fie sub 500 ms si cu `X-Cache: HIT`.
   ```bash
   curl -sD - -o /dev/null https://xn--hai-n-sat-t5a.ro/ | grep -i x-cache
   curl -so /dev/null -w "%{time_starttransfer}\n" https://xn--hai-n-sat-t5a.ro/
   ```
2. **Prospetimea continutului**: editeaza o proprietate din admin si confirma ca apare cu datele noi pe site in maximum 5 minute, fara redeploy.
3. **Memoria instantei**: in GCP Console → App Engine → Instances, urmareste 24 h ca memoria ramane stabila (cache-ul e plafonat la 100 de intrari, deci nu ar trebui sa creasca monoton).
## Corecturi acceptate de owner (2026-09-28)

- Verificarea HIT/MISS se face prin GET (`curl -sD - -o NUL` pe Windows), nu HEAD. HEAD ocoleste cache-ul.
- Cache-ul HTTP primeste Date original si Age calculat din momentul inceperii randarii; HIT nu reporneste cele 5 minute. Expirarea in memorie nu se prelungeste la acces. Limita se aplica HTML-ului SSR, nu starii unei pagini deja deschise in browser.
- Nu se memoreaza HTML noindex sau degradat de erori API absorbite de componente, chiar daca statusul ramane 200. Raspunsurile excluse primesc no-store.
- Cache-ul este per instanta; primul request dupa pornirea unei instante necesita randare. Timpii exacti de productie se verifica dupa deploy, nu sunt garantati de implementare.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 package.json are lru-cache in dependencies si yarn.lock actualizat.
- [x] #2 Cache LRU per instanta creat in src/server.ts cu max:100 si ttl:300000; HIT nu reinnoieste expirarea.
- [x] #3 Cheia este req.path; orice query string ocoleste citirea si scrierea in cache (inclusiv parametri ignorati de parser).
- [x] #4 Numai GET si raspunsuri 200 valide se memoreaza; serviceUnavailable/503, notFound/404, noindex si randarile degradate sunt excluse.
- [x] #5 Login si add-property, inclusiv variante codificate/matrix/outlet, sunt excluse; raspunsurile neeligibile au no-store, fara Cache-Control public.
- [x] #6 HTML eligibil primeste Cache-Control: public, max-age=300, Date original si Age calculat; expirarea nu se cumuleaza intre LRU si cache HTTP.
- [x] #7 Raspunsurile HTML SSR au X-Cache: HIT sau MISS; HEAD ocoleste cache-ul.
- [x] #8 Citirea cache-ului are loc dupa redirect si security headers, inainte de render; asseturile statice raman in afara cache-ului HTML.
- [x] #9 Protocol SSR local cu dovezi GET: doua curl -sD - -o NUL http://localhost:4000/ -> MISS apoi HIT; login fara public; properties?page=2 mereu MISS; 404/503 niciodata HIT; Age creste fara prelungirea TTL.
- [x] #10 Suita Angular, testele Node pentru cache (expirare, plafon100, izolare, bypass, Date/Age) si build browser+SSR trec.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Corecteaza specificatia GET/HEAD, vechimea HTTP si metadata YAML; instaleaza lru-cache. 2. Adauga LRU per instanta (max100, TTL300000), cheie req.path, bypass query/admin/non-GET/noindex/HTML degradat; Date si Age fara reinnoirea TTL la HIT. 3. Teste automate Node pentru cache si teste Angular pentru excluderea raspunsurilor degradate/noindex; build browser/SSR si protocol HTTP local cu fixture API determinist. 4. Subagent de review dupa implementare, corectii pentru blocante si reverificare. 5. Dovezi in backlog, commit si PR; fara dev-pipeline, merge sau deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. „TTL 5-15 min", „max ~100 intrari", „cheia = path normalizat (fara query nesemnificativ)" — trei decizii lasate agentului. FIXATE: `max: 100`, `ttl: 300000`, cheia = `req.path`, iar cererile cu ORICE query string ocolesc cache-ul (mai simplu si mai sigur decat sa decida agentul ce query e „nesemnificativ").
2. AC-ul vechi #1 (TTFB < 500 ms), #5 (anunt editat vizibil in ≤TTL) si #6 (memoria stabila dupa 24 h in GAE metrics) cereau productie live si timp → mutate in `## Verificare post-deploy (owner)`.

`dependencies: [TASK-115]` e reala: criteriul de a NU cache-ui raspunsurile 404 depinde de campul `notFound` din `SsrRenderState`, care e introdus de TASK-115. Daca vrei sa rulezi TASK-116 primul, scoate din AC#4 partea cu `notFound` si redeschide-o dupa.

2026-09-28: owner a aprobat implementarea directa si corecturile GET/HEAD + vechime HTTP. Metadata YAML corupta (lista inline urmata de element block) a necesitat repararea strict a formei listei pentru ca Backlog CLI sa recunoasca id/status; toate actualizarile de continut sunt facute prin CLI.

Implementare directa finalizata pe ticket/task-116-ssr-cache (2026-09-28/29), fara dev-pipeline.

- LRU per instanta: max100, TTL300000ms; helper server-only src/ssr-cache.ts. Cheia este req.path; query raw (inclusiv gol/ignorat de parser), non-GET, authorization si variantele alternative/administrative sunt excluse.
- Numai HTML200 complet si indexabil este memorat. SeoService.setNoindex si erorile initiale de lista/fotografii seteaza SSR_RENDER_STATE.cacheable=false. Erorile de prefetch nu invalideaza HTML-ul valid deja randat. Raspunsurile excluse sunt no-store; 404/503 nu sunt memorate, iar Retry-After60 si mecanismul timeout503 sunt pastrate.
- Date este momentul inceperii randarii, Age reflecta vechimea HTML-ului, iar TTL include durata randarii. HIT nu reporneste cele cinci minute. Nu exista invalidare activa; cache-ul este local instantei. Fereastra de prospetime se refera la HTML SSR, nu la starea unei pagini deja deschise.
- lru-cache11.5.3 este dependenta de productie. yarn.lock are numai noua intrare (5 linii); package-lock.json ramane ignorat conform regulilor repo-ului.
- Documentatie actualizata in CLAUDE.md. Comenzi noi: npm run test:ssr (Node) si npm run test:ssr:http (bundle SSR real cu fixture API locala; necesita npm run build si port4000 liber sau SSR_CACHE_TEST_PORT).

Validare:
- npm run test:ssr: 26/26 PASS. Include limita100/LRU, expirare exact la300000ms cu ceas controlat, HIT fara reinnoire, Date/Age cu durata randarii, separare intre instante, query/admin/HEAD/auth/Set-Cookie/404/503/noindex/degradare.
- npm run test:ci: 73/73 SUCCESS (baseline69; 4 teste noi si extinderea testului login). O eroare TypeScript in noul test (PropertyDTO.id optional) a fost corectata inainte de rularea verde.
- npm run build: browser+SSR reusite. Hash browser23c08c0b4a5bad98, serverdccd3bbde27caab9. Avertismente pe fisiere SCSS existente (bugete info-page/properties/under-the-mountain si deprecarea @import din styles.scss); fara erori de build.
- npm run test:ssr:http: 47 raspunsuri HTTP verificate. MISS->HIT pentru homepage/lista/proprietate valida; 304 conditional pastreaza Date si Age; admin+aliasuri, query, HEAD,404,503 si HTML degradat raman MISS/no-store. Lista este memorata numai dupa revenirea API-ului. Redirect301 cu query, security headers si asseturi statice verificate.
- Toate scenariile API HTTP folosesc fixture-uri locale reproductibile, fara modificari in backend si fara a presupune disponibilitatea productiei. Scriptul porneste si opreste numai serverul copil propriu si salveaza dovezile in directorul temporar afisat.
- Subagent task116_review: review dupa implementare si review separat al scripturilor HTTP, fara blocante sau regresii concrete. Recomandarea de verificare304 a fost inclusa si a trecut.

Dovezi curl GET (server local pornit separat cu aceleasi fixture-uri; raspunsurile HEAD nu populeaza cache-ul):

```text
curl -sD - -o NUL http://localhost:4000/
HTTP/1.1 200 OK
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
X-Cache: MISS
Cache-Control: public, max-age=300
Date: Mon, 28 Sep 2026 21:00:31 GMT
Age: 0
Content-Type: text/html; charset=utf-8
Content-Length: 113038
ETag: W/"1b98e-/r3CM2GQJLI7LEJVSKAvzjqo+Qo"
Connection: keep-alive
Keep-Alive: timeout=5
```

```text
curl -sD - -o NUL http://localhost:4000/
HTTP/1.1 200 OK
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
X-Cache: HIT
Cache-Control: public, max-age=300
Date: Mon, 28 Sep 2026 21:00:31 GMT
Age: 0
Content-Type: text/html; charset=utf-8
Content-Length: 113038
ETag: W/"1b98e-/r3CM2GQJLI7LEJVSKAvzjqo+Qo"
Connection: keep-alive
Keep-Alive: timeout=5
```

```text
curl -sD - -o NUL http://localhost:4000/login
HTTP/1.1 200 OK
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
X-Robots-Tag: noindex, nofollow
X-Cache: MISS
Cache-Control: no-store
Content-Type: text/html; charset=utf-8
Content-Length: 113442
ETag: W/"1bb22-zldDN+rhJcFuFr7elWmBEitcs34"
Date: Mon, 28 Sep 2026 21:00:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

```text
curl -sD - -o NUL http://localhost:4000/properties?page=2
HTTP/1.1 200 OK
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
X-Cache: MISS
Cache-Control: no-store
Content-Type: text/html; charset=utf-8
Content-Length: 166075
ETag: W/"288bb-x5BDxAIWno1P4a0fadW3ijNHOZY"
Date: Mon, 28 Sep 2026 21:00:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

```text
curl -sD - -o NUL http://localhost:4000/properties?page=2
HTTP/1.1 200 OK
X-Powered-By: Express
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.gstatic.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://hai-in-sat-api.lm.r.appspot.com https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src https://www.youtube.com;
X-Cache: MISS
Cache-Control: no-store
Content-Type: text/html; charset=utf-8
Content-Length: 166101
ETag: W/"288d5-J2091/v61NlrmQF2y9YqH6GdGnU"
Date: Mon, 28 Sep 2026 21:00:32 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

Dovada suplimentara Date/Age din primele trei cereri ale testului HTTP automat:

```text
GET / -> 200; X-Cache=MISS; Date=Mon, 28 Sep 2026 20:59:22 GMT; Age=0
GET / -> 200; X-Cache=HIT; Date=Mon, 28 Sep 2026 20:59:22 GMT; Age=1
GET / -> 304; X-Cache=HIT; Date=Mon, 28 Sep 2026 20:59:22 GMT; Age=1
```

Review si verificari finalizate. Fara deploy; masuratorile TTFB si verificarea cache-ului infrastructurii Google raman la owner dupa merge/deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cache SSR per instanta cu100 intrari si TTL5 minute, Date/Age fara reinnoire la HIT. Admin, query, HEAD, erori si HTML degradat excluse. 73 teste Angular +26 Node +47 raspunsuri HTTP verificate; build browser/SSR trecut; review independent fara blocante. Comenzi reproductibile pentru testare, fara deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
