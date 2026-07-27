---
id: TASK-116
title: Cache pentru HTML-ul SSR pe rutele publice
status: To Do
assignee: []
created_date: '2026-06-12 16:09'
updated_date: '2026-07-27'
labels:
  - seo
  - performance
  - ssr
dependencies: [TASK-115]
  - TASK-47
documentation:
  - ../../../../seo-audit-2026-06-12/findings/performance.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Fiecare request re-randează pagina prin CommonEngine + fetch spre backend, deși TOATE paginile site-ului sunt publice și identice pentru orice vizitator. Măsurat în audit (2026-06-12): TTFB warm ~1,4 s pe homepage (pragul „good" e 0,8 s), TTFB cold 5–29 s. HTML-ul se servește **fără niciun header `Cache-Control`**.

Un cache SSR în memorie + un `Cache-Control` scurt pe HTML taie TTFB-ul warm la <200 ms și absoarbe o parte din cold start-uri (instanța nouă servește din cache imediat ce a randat o dată).

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
   curl -sI https://xn--hai-n-sat-t5a.ro/ | grep -i x-cache
   curl -so /dev/null -w "%{time_starttransfer}\n" https://xn--hai-n-sat-t5a.ro/
   ```
2. **Prospetimea continutului**: editeaza o proprietate din admin si confirma ca apare cu datele noi pe site in maximum 5 minute, fara redeploy.
3. **Memoria instantei**: in GCP Console → App Engine → Instances, urmareste 24 h ca memoria ramane stabila (cache-ul e plafonat la 100 de intrari, deci nu ar trebui sa creasca monoton).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `package.json` are dependenta `lru-cache` in `dependencies` (nu in `devDependencies` — codul ruleaza in productie pe serverul SSR)
- [ ] #2 `src/server.ts` instantiaza cache-ul cu **`max: 100`** si **`ttl: 300000`** (5 minute) — valorile exacte decise in descriere
- [ ] #3 Cheia de cache e `req.path`; cererile care au **orice** query string (`Object.keys(req.query).length > 0`) ocolesc complet cache-ul si merg direct la render
- [ ] #4 Se cache-uieste DOAR pe metoda `GET` si DOAR cand raspunsul e 200: exista in cod verificarea explicita ca NU se scrie in cache cand `ssrRenderState.serviceUnavailable` sau `ssrRenderState.notFound` sunt `true`
- [ ] #5 `/login` si `/add-property` sunt excluse explicit din cache si NU primesc `Cache-Control` public
- [ ] #6 Raspunsurile HTML cache-abile primesc `Cache-Control: public, max-age=300`
- [ ] #7 Fiecare raspuns HTML poarta headerul de debug `X-Cache` cu valoarea `HIT` sau `MISS`
- [ ] #8 Middleware-ul de cache e plasat DUPA redirectul din TASK-113 si dupa headerele din TASK-114 (daca sunt deja livrate) si ÎNAINTE de render — verificabil prin numarul liniei
- [ ] #9 Implementatorul a rulat protocolul SSR local (`backlog/docs/verificare-locala-ssr.md`) si a lipit iesirile in `## Implementation Notes`: doua `curl -sI http://localhost:4000/` consecutive → primul `X-Cache: MISS`, al doilea `X-Cache: HIT` si `Cache-Control: public, max-age=300`; `curl -sI http://localhost:4000/login` → FARA `Cache-Control: public`; `curl -sI "http://localhost:4000/properties?page=2"` → `X-Cache: MISS` la fiecare rulare (query string = fara cache)
- [ ] #10 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. „TTL 5-15 min", „max ~100 intrari", „cheia = path normalizat (fara query nesemnificativ)" — trei decizii lasate agentului. FIXATE: `max: 100`, `ttl: 300000`, cheia = `req.path`, iar cererile cu ORICE query string ocolesc cache-ul (mai simplu si mai sigur decat sa decida agentul ce query e „nesemnificativ").
2. AC-ul vechi #1 (TTFB < 500 ms), #5 (anunt editat vizibil in ≤TTL) si #6 (memoria stabila dupa 24 h in GAE metrics) cereau productie live si timp → mutate in `## Verificare post-deploy (owner)`.

`dependencies: [TASK-115]` e reala: criteriul de a NU cache-ui raspunsurile 404 depinde de campul `notFound` din `SsrRenderState`, care e introdus de TASK-115. Daca vrei sa rulezi TASK-116 primul, scoate din AC#4 partea cu `notFound` si redeschide-o dupa.
<!-- SECTION:NOTES:END -->
