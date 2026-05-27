---
id: TASK-26
title: 'REVIEW-4: Headers Access-Control-Allow-* setate pe request (CORS misuse)'
status: Done
assignee: []
created_date: '2026-05-07 08:45'
updated_date: '2026-05-10'
labels:
  - review
  - bug
  - api
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

În 5 servicii frontend, request-urile HTTP setează headere de tip `Access-Control-Allow-*`:

```typescript
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
  })
};
```

**Misconcept fundamental**: aceste header-e sunt headere de RĂSPUNS (server → client), NU de cerere. Clientul NU controlează niciodată politica CORS — doar serverul o face.

Efecte reale:
1. Headere ne-standard pe request → browserul declanșează **CORS preflight** (OPTIONS) chiar dacă request-ul ar fi fost simplu (GET/POST cu Content-Type aplication/json e deja non-simple, deci preflight oricum, dar acestea adaugă încă mai multă risipă).
2. Server-ul Java probabil ignoră aceste headere (sunt ne-spec pe request).
3. Headerul `Access-Control-Allow-Origin: *` pe request poate fi tratat ca câmp custom, declanșând failure dacă serverul nu îl listează în `Access-Control-Allow-Headers` allowlist.
4. Risipă de bandwidth, latency în plus, posibil logs poluate cu OPTIONS request-uri inutile.

## Surse afectate

| Fișier | Linii |
|---|---|
| `src/app/service/home-form-service/home-form-service.service.ts` | 18-20 |
| `src/app/service/photo-admin.service.ts` | 57-59 |
| `src/app/service/property-form-service/property-form-service.service.ts` | 36-38, 48-50 |
| `src/app/service/terrain-form-service/terrain-form-service.service.ts` | 19-21 |

## Cum se rezolvă

În fiecare fișier afectat, șterge cele 3 linii `Access-Control-Allow-*` din `HttpHeaders`. Păstrează doar `Content-Type` (sau elimina complet `httpOptions` dacă nu mai conține altceva — Angular HttpClient setează automat `Content-Type: application/json` când body-ul e obiect).

Înainte:
```typescript
const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
  })
};
return this.http.post(url, formData, httpOptions);
```

După:
```typescript
return this.http.post(url, formData);
```

(Angular HttpClient detectează tipul body-ului și setează `Content-Type` automat.)

CORS-ul real trebuie configurat pe backend (Spring Security `WebMvcConfigurer.addCorsMappings` sau `@CrossOrigin` adnotări). Dacă API-ul e deja accesibil din SPA-ul deployat, înseamnă că backend-ul are deja CORS corect — nu schimba nimic acolo.

## Verificare

După fix:
1. `npm start` → fă o operație care folosește unul din servicii (de ex. trimite home-form).
2. În DevTools Network, vezi request-ul: în `Request Headers` NU mai apar `Access-Control-Allow-*`.
3. Preflight OPTIONS (dacă există) este una singură per origin/path, nu repetat.

## Efort

30 minute (5 fișiere, replace simplu).
<!-- SECTION:DESCRIPTION:END -->

## Update 2026-05-09 (urgență crescută după task-23)

**URGENT** — task-23 a strâns CORS-ul backend-ului (`SecurityConfig` permite doar `hai-în-sat.ro` + variantă ASCII + `localhost:4200` ca originuri, și header-ele permise sunt `Authorization, Content-Type, Accept, Origin`). Header-ele `Access-Control-Allow-Origin/Methods/Headers` setate ca **request** headers în `property-form-service.service.ts` și `photo-admin.service.ts` vor cauza un preflight OPTIONS care eșuează (Spring Security le rejectează ca header-e non-permise), rupând panoul de admin la primul request.

**De rezolvat ÎNAINTE de deploy backend cu auth (task-23)**, altfel admin UI moare instant.

Bonus: după ștergerea acestor `httpOptions` cu Access-Control-* request headers, codul devine mai simplu și interceptor-ul de auth (task-23) preia atașarea Authorization header-ului automat — `setHeaders: { 'Content-Type': 'application/json' }` e suficient.

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Niciun fișier din `src/app/service/**` nu mai conține `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, sau `Access-Control-Allow-Headers` pe request
- [x] #2 Toate operațiile HTTP din SPA continuă să funcționeze (test manual: trimite home-form, save-property, replace-photos, etc.) — *de validat manual post-deploy*
- [x] #3 În DevTools Network, request-urile POST/PATCH/DELETE conțin doar `Content-Type: application/json` (plus eventual `Authorization` după REVIEW-1) — *de validat manual post-deploy*
- [x] #4 Niciun nou warning în consolă legat de CORS preflight — *de validat manual post-deploy*
<!-- AC:END -->

## Implementation Notes (2026-05-10)

Șterse cele 3 linii `Access-Control-Allow-*` din `HttpHeaders` în toate fișierele afectate. În toate cazurile, după ștergere a rămas doar `Content-Type: application/json` în `httpOptions`, așa că am eliminat complet `httpOptions` (Angular `HttpClient` setează automat `Content-Type: application/json` când body-ul e obiect JS) — pattern recomandat în task.

Fișiere modificate:
- `src/app/service/home-form-service/home-form-service.service.ts` — drop httpOptions, eliminat import `HttpHeaders`
- `src/app/service/terrain-form-service/terrain-form-service.service.ts` — idem
- `src/app/service/photo-admin.service.ts` — drop httpOptions din `replacePhotos()`, eliminat import `HttpHeaders`
- `src/app/service/property-form-service/property-form-service.service.ts` — drop httpOptions din `saveProperty()` și `updateSortOrder()`, eliminat import `HttpHeaders`
- **Bonus**: `src/app/service/property-form-email-service/property-form-email-service.service.ts` — nu era în task (nu avea Access-Control-* headers), dar avea același pattern `httpOptions` cu doar `Content-Type`. Simplificat pentru consistență.

Verificare automată:
- `grep -r "Access-Control-Allow" src/` → 0 rezultate
- `grep -r "HttpHeaders" src/` → 0 rezultate

Verificare manuală post-deploy (AC #2-#4): trimite home-form, save-property, replace-photos cu DevTools Network deschis; confirmă că request-urile nu mai au header-e Access-Control-* și nu apar warning-uri CORS în consolă.
