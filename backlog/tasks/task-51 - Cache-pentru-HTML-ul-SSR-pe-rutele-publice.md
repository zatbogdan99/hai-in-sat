---
id: TASK-51
title: Cache pentru HTML-ul SSR pe rutele publice
status: To Do
assignee: []
created_date: '2026-06-12 16:09'
updated_date: '2026-06-12 16:09'
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

**Depinde de TASK-47**: fără error handling întâi, riști să cache-uiești pagini de eroare.

## Cum

1. În `src/server.ts`, înainte de `commonEngine.render()`: cache LRU în memorie (ex. `lru-cache`, max ~100 intrări) cu cheia = path-ul normalizat (fără query nesemnificativ), TTL 5–15 min.
2. Cache DOAR pentru: GET, rute publice (exclude `/login`, `/add-property`, orice path cu autentificare) și DOAR răspunsuri 200. NU cache-ui 404/503.
3. Header pe HTML-ul randat: `Cache-Control: public, max-age=300` (5 min) — permite și CDN-ului Google Frontend / browserului să rețină puțin, fără să blocheze actualizările de anunțuri (TTL-ul scurt e compromisul corect pentru un site cu listinguri).
4. Invalidare: TTL-ul + restart la deploy (instanță nouă = cache gol) sunt suficiente la scara actuală; nu construi invalidare activă acum.
5. Loghează hit/miss (un header de debug `X-Cache: HIT|MISS`) ca să poți verifica AC-urile.

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
