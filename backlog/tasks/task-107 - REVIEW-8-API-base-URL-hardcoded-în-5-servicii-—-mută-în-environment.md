---
id: TASK-107
title: 'REVIEW-8: API base URL hardcoded în 5 servicii — mută în environment'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-27'
labels:
  - review
  - refactor
  - config
dependencies: [TASK-101]
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

URL-ul backend `https://hai-in-sat-api.lm.r.appspot.com` apare hardcoded în **5 servicii**:

| Fișier | Apariții |
|---|---|
| `src/app/service/property-form-service/property-form-service.service.ts` | 5 (lines 18-22) |
| `src/app/service/photo-admin.service.ts` | 1 + în concat URL-uri |
| `src/app/service/property-form-email-service/property-form-email-service.service.ts` | 1 |
| `src/app/service/home-form-service/home-form-service.service.ts` | (verifică linia 11+) |
| `src/app/service/terrain-form-service/terrain-form-service.service.ts` | (verifică linia 11+) |

**Total: 9 apariții.**

În plus, `scripts/generate-sitemap.js:9` are `const API_URL = 'https://hai-in-sat-api.lm.r.appspot.com/get-all-properties'` separat.

### Convenția curentă (per CLAUDE.md)

Toggle dev↔prod = comentați manual liniile (variantele `localhost:8080` sunt comentate adjacent). Prone la commit accidental cu `localhost` pe master, nu poți face A/B testing pe staging, schimbarea domeniu API necesită modificare în 5 fișiere.

## Cum se rezolvă

### Phase 1 — environment.ts cu apiBaseUrl

1. În `src/environments/environment.ts` și `environment.prod.ts`, adaugă:

```typescript
export const environment = {
  production: false, // sau true în .prod.ts
  apiBaseUrl: 'http://localhost:8080', // sau 'https://hai-in-sat-api.lm.r.appspot.com' în .prod.ts
  firebaseConfig: { ... }
};
```

2. În fiecare serviciu, schimbă:

```typescript
// înainte
private savePropertyUrl = 'https://hai-in-sat-api.lm.r.appspot.com/save-property';

// după
import { environment } from '../../environments/environment';
// ...
private readonly savePropertyUrl = `${environment.apiBaseUrl}/save-property`;
```

3. Șterge variantele `localhost:8080` comentate adjacent.

4. Build-ul de production înlocuiește automat `environment.ts` cu `environment.prod.ts` (configurat deja în `angular.json:56-61`), deci dezvoltatorul rulează `ng serve` cu localhost și deploy-ul cu prod URL — fără editare manuală.

### Phase 2 — NU se face (decizie owner 2026-07-27)

Varianta cu `apiBaseUrl: ''` + proxy pe toate path-urile in `proxy.conf.json` e RESPINSA. `proxy.conf.json` **nu se modifica** in acest task. Motivul: `fileReplacements` din `angular.json` rezolva deja problema (dev = localhost, prod = URL public), iar rescrierea tuturor URL-urilor ca relative ar rupe `authInterceptor`, care decide dupa origine ce cerere primeste token.

### Phase 3 — generate-sitemap.js

Aceeași tratare. Citește un env var sau argument CLI:

```javascript
const API_URL = process.env.SITEMAP_API_URL || 'https://hai-in-sat-api.lm.r.appspot.com';
```

Apoi în CI/build script: `SITEMAP_API_URL=... npm run generate-sitemap`.

## Fișiere afectate

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`
- 5 fișiere de servicii listate mai sus
- `scripts/generate-sitemap.js`
- (opțional) `proxy.conf.json`

## Efort

3 ore.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Dupa deploy, pe `https://hai-în-sat.ro`, cu DevTools → Network deschis: listarea `/properties`, o pagina de anunt, login-ul si trimiterea formularului de contact trebuie sa loveasca `https://hai-in-sat-api.lm.r.appspot.com`, cu status 200. Zero cereri catre `localhost`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/environments/environment.ts` are campul `apiBaseUrl: 'http://localhost:8080'`, iar `src/environments/environment.prod.ts` are `apiBaseUrl: 'https://hai-in-sat-api.lm.r.appspot.com'`
- [ ] #2 `git grep "hai-in-sat-api.lm.r.appspot.com" src/app` returneaza 0 rezultate — string-ul exista doar in `environment.prod.ts`
- [ ] #3 `git grep "localhost:8080" src/app` returneaza 0 rezultate — string-ul exista doar in `environment.ts` si `proxy.conf.json`
- [ ] #4 Cele 5 servicii folosesc `` `${environment.apiBaseUrl}/...` ``: `property-form-service.service.ts` (azi liniile 19-23), `photo-admin.service.ts` (13-14), `property-form-email-service.service.ts` (10-11), `home-form-service.service.ts` (10) si `interceptors/auth.interceptor.ts` (7-8)
- [ ] #5 Variantele `localhost:8080` COMENTATE adiacent (ex. `property-form-service.service.ts:25-29`) sunt sterse — nu mai exista toggle prin comentarii
- [ ] #6 `interceptors/auth.interceptor.ts`: conditia `isApiRequest` e actualizata sa foloseasca `environment.apiBaseUrl` si ramane corecta si pentru prefixul relativ `/home-form` (folosit in dev prin `proxy.conf.json`) — altfel formularul de acasa pierde tokenul in dev
- [ ] #7 `scripts/generate-sitemap.js`: URL-ul vine din `process.env.SITEMAP_API_URL` cu fallback pe `'https://hai-in-sat-api.lm.r.appspot.com'` (azi hardcodat la linia 9)
- [ ] #8 `proxy.conf.json` NU e modificat (Phase 2 respinsa de owner)
- [ ] #9 `terrain-form-service` NU apare in diff — e cod mort, sters de TASK-101 (vezi `dependencies`)
- [ ] #10 `npx ng test --watch=false --browsers=ChromeHeadless` trece
- [ ] #11 Implementatorul a rulat `npm run build:browser` si a lipit rezultatul in `## Implementation Notes` (build-ul de productie foloseste `fileReplacements`, deci e singura dovada ca `environment.prod.ts` chiar se substituie)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. URL API hardcodat in 6 locuri: property-form-service, photo-admin, property-form-email-service, terrain-form-service, home-form-service + interceptors/auth.interceptor.ts (API_ORIGIN + LOCAL_API_ORIGIN) + scripts/generate-sitemap.js:9. environment.ts NU are inca apiBaseUrl. Variantele localhost:8080 raman comentate adiacent. Nimic refactorizat.

Verificare 2026-07-06: neschimbat. Linii exacte: property-form-service.service.ts:19-23 (+ variante localhost comentate :25-29), photo-admin.service.ts:13-14, property-form-email-service.service.ts:10-11, home-form-service.service.ts:10, interceptors/auth.interceptor.ts:7-8, scripts/generate-sitemap.js:9. environments/ exista cu fileReplacements configurat corect in angular.json — lipseste doar campul apiBaseUrl (environment.ts si .prod.ts sunt azi identice cu exceptia flagului production). DOUA nuante la refactor: (1) terrain-form-service e candidat de STERGERE ca cod mort (TASK-101) — daca TASK-101 se face intai, nu-l mai refactoriza; (2) in auth.interceptor.ts, conditia isApiRequest include si prefixul relativ '/home-form' — dupa mutarea pe environment.apiBaseUrl, actualizeaza conditia ca sa ramana corecta pentru dev cu proxy si prod.
Revizuire 2026-07-27 (pregatire pentru pipeline). Doua ambiguitati eliminate:
1. „Phase 2 — proxy.conf.json (optional)" era un fork pe care agentul l-ar fi trebuit sa-l decida singur → RESPINSA explicit, `proxy.conf.json` nu se atinge.
2. Lista de servicii avea „(verifica linia 11+)" in loc de linii exacte → inlocuita cu liniile confirmate la 2026-07-06.

AC-ul vechi #4 si #6 („bundle-uri functionale care lovesc backend-ul corect", „test manual: properties, login, save-property") cereau rulare in browser pe productie → mutate in `## Verificare post-deploy (owner)`; a ramas dovada de build.

`dependencies: [TASK-101]`: `terrain-form-service` e in lista de refactorizat, dar e cod mort care se sterge. Daca rulezi TASK-107 primul, sari peste el si nu-l refactoriza.
<!-- SECTION:NOTES:END -->
