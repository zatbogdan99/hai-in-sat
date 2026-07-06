---
id: TASK-11
title: Cache pentru HTML-ul SSR pe rutele publice
status: To Do
assignee: []
created_date: '2026-06-12 16:09'
updated_date: '2026-07-06'
labels:
  - seo
  - performance
  - ssr
dependencies:
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

1. În `src/server.ts`, înainte de `commonEngine.render()`: cache LRU în memorie (ex. `lru-cache`, max ~100 intrări) cu cheia = path-ul normalizat (fără query nesemnificativ), TTL 5–15 min.
2. Cache DOAR pentru: GET, rute publice (exclude `/login`, `/add-property`, orice path cu autentificare) și DOAR răspunsuri 200 — adică NU salva în cache când `ssrRenderState.serviceUnavailable` (503, TASK-47) sau `ssrRenderState.notFound` (404, TASK-10) sunt setate.
3. Header pe HTML-ul randat: `Cache-Control: public, max-age=300` (5 min) — permite și CDN-ului Google Frontend / browserului să rețină puțin, fără să blocheze actualizările de anunțuri (TTL-ul scurt e compromisul corect pentru un site cu listinguri).
4. Invalidare: TTL-ul + restart la deploy (instanță nouă = cache gol) sunt suficiente la scara actuală; nu construi invalidare activă acum.
5. Loghează hit/miss (un header de debug `X-Cache: HIT|MISS`) ca să poți verifica AC-urile.
6. **Ordinea în lanțul de middleware** (dacă TASK-4/TASK-6 sunt deja făcute): redirect host (TASK-4) → security headers (TASK-6) → cache SSR (acesta) → render. Dacă TASK-4 NU e încă făcut, cheia pe path e totuși sigură: www și apex produc HTML identic (canonical-ul vine din constanta BASE_URL, nu din host-ul cererii).

## Fișiere afectate

- `src/server.ts`
- `package.json` (dependență `lru-cache`)

## Efort

M (o jumătate de zi cu teste).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Al doilea request consecutiv pe `/` (instanță caldă) are TTFB sub 500 ms și `X-Cache: HIT` (primul: MISS)
- [ ] #2 Răspunsurile HTML au `Cache-Control: public, max-age=300` (sau valoare aleasă ≤900 s, documentată)
- [ ] #3 `/login` și `/add-property` NU se servesc din cache și NU primesc Cache-Control public
- [ ] #4 Răspunsurile non-200 (404/503) NU intră în cache — testabil: o pagină care a dat 503 revine 200 imediat ce upstream-ul își revine, fără să aștepte TTL-ul
- [ ] #5 O proprietate editată în admin apare cu datele noi pe site în maximum TTL-ul ales (≤15 min) fără redeploy
- [ ] #6 Memoria instanței rămâne stabilă (cache cu limită de intrări; fără leak — verificat în GAE metrics după 24 h)
<!-- AC:END -->
