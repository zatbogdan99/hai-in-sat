---
id: TASK-47
title: Elimină erorile 5xx de pe paginile de proprietate (timeout și error handler SSR)
status: To Do
assignee: []
created_date: '2026-06-12 16:05'
updated_date: '2026-06-12 16:05'
labels:
  - seo
  - critical
  - ssr
  - infra
  - backend
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/technical.md
  - ../../../../seo-audit-2026-06-12/findings/performance.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce — CEL MAI URGENT finding al auditului din 2026-06-12

**7 din 14 pagini `/property/*` din sitemap răspund PERSISTENT cu 500/502/503** (re-testate secvențial, cu pauze — nu e doar burst de trafic). Google primește erori pe jumătate din paginile de bani; erorile 5xx repetate duc la scăderea frecvenței de crawl și la **dezindexare**.

Mecanismul (confirmat de audit):
1. Ambele proiecte GAE au `min_instances: 0` → dublu cold start.
2. Backend-ul Spring Boot pornește de la zero în **~11 secunde** (verificat: `GET /get-by-id?id=f7c9ce67-...` → 200 OK în 11,0 s — datele EXISTĂ, nu e proprietate ștearsă).
3. La render-ul SSR al unei pagini de proprietate, fetch-ul server-side din `property-details.component.ts` (via `PropertyFormServiceService.getPropertyById`) așteaptă backend-ul; lanțul CommonEngine/GAE expiră înainte → Express aruncă → GAE răspunde 500/502/503.
4. `src/server.ts` NU are error handler `(err, req, res, next)` și NICIUN timeout explicit pe `commonEngine.render()`.

Agravant: payload-ul de proprietate conține pozele base64 (MB întregi) → transferul SSR↔backend e și el lent (se rezolvă definitiv în TASK-48, dar fix-ul de aici e necesar oricum pentru orice incident viitor de upstream).

## Cum

1. **`src/server.ts` — timeout pe render**: înfășoară `commonEngine.render(...)` într-un `Promise.race` cu un timeout de 20–25 s. La timeout → `res.status(503).set('Retry-After', '60')` cu o pagină minimă de eroare (HTML static mic, în română). 503+Retry-After îi spune lui Googlebot „revino mai târziu, nu șterge pagina" — exact ce vrem la cold start.
2. **`src/server.ts` — error handler global**: middleware `(err, req, res, next)` după ruta catch-all: loghează eroarea (cu URL) și răspunde 503 (NU 500 generic) pentru erori de upstream/render. Atenție: 404-urile reale rămân pe fluxul TASK-3 (nu transforma totul în 503).
3. **Timeout + retry pe fetch-ul SSR**: în `property-details` / serviciu, adaugă pe apelul HTTP `timeout({ each: 8000 })` + `retry({ count: 1, delay: 1500 })` (RxJS) DOAR pe server (`isPlatformBrowser` check sau interceptor cu `PLATFORM_ID`), ca un singur backend lent să nu consume tot bugetul de render.
4. **`min_instances: 1` pe backend** (repo `java.hai-in-sat/hai-in-sat/`, fișierul `app-backend.yaml`, secțiunea `automatic_scaling`) — elimină cold start-ul de 11 s. Cost estimat: ~10–15 $/lună pentru F2 idle. Alternativă gratuită dar imperfectă: cron de warmup la 5 min (GAE `cron.yaml` pe un endpoint ușor, ex. `/healthz`). Decizia (plătit vs warmup) se confirmă cu ownerul.
5. (Opțional, recomandat) `min_instances: 1` și pe frontend (`app.yaml`) — vezi cifrele TTFB cold 5,1 s vs warm 1,4 s din audit.
6. **Verificare end-to-end**: după deploy, re-testează TOATE cele 14 URL-uri de proprietate din sitemap, secvențial, de 2 ori (rece + cald).

## Fișiere afectate

- `src/server.ts` (timeout render + error handler)
- `src/app/property-details/property-details.component.ts` sau `src/app/service/property-form-service/property-form-service.service.ts` (timeout/retry pe fetch SSR)
- `java.hai-in-sat/hai-in-sat/app-backend.yaml` (min_instances — REPO SEPARAT, deploy cu `--project=hai-in-sat-api`!)
- (opțional) `app.yaml` frontend (min_instances), `cron.yaml` warmup

## Efort

1 zi (cod + deploy ambele proiecte + verificare). Pașii 1–3 nu depind de decizia de cost de la pasul 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Toate cele 14 URL-uri `/property/*` din sitemap răspund 200 la un test secvențial complet, repetat de 2 ori (inclusiv primul request „la rece" al zilei)
- [ ] #2 `server.ts` are timeout explicit (≤25 s) pe render: cu backend-ul oprit/lent simulat, răspunsul este **503 cu header `Retry-After`**, nu 500 generic și nu timeout GAE la 60 s
- [ ] #3 Express are error handler global care loghează (URL + eroare) și nu lasă unhandled promise rejections (verificabil în Cloud Logging)
- [ ] #4 Fetch-ul SSR spre backend are timeout + 1 retry pe server, fără să afecteze comportamentul din browser
- [ ] #5 Decizie implementată pentru cold start backend: `min_instances: 1` SAU warmup cron — documentată în implementation notes cu costul estimat
- [ ] #6 După 7 zile de la deploy: zero erori 5xx pe `/property/*` în Cloud Logging (excluzând incidente reale de backend) și GSC Crawl Stats fără spike de „Server error (5xx)"
- [ ] #7 Pagina de eroare 503 e în română, mică (<10 KB), cu link spre `/properties` și NU e indexabilă (noindex)
<!-- AC:END -->
