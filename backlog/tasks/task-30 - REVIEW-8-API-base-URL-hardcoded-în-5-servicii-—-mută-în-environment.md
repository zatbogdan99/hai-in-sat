---
id: TASK-30
title: 'REVIEW-8: API base URL hardcoded în 5 servicii — mută în environment'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:23'
labels:
  - review
  - refactor
  - config
dependencies: []
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

### Phase 2 — proxy.conf.json (opțional)

Dacă vrei `ng serve` să folosească tot URL-uri relative `/api/...` și să se proxy-eze către backend:

1. Schimbă `apiBaseUrl: ''` în `environment.ts` (string gol → URL-uri devin `/save-property` etc.).
2. În `proxy.conf.json` adaugă mai multe path-uri să proxy spre backend:

```json
{
  "/save-property": { "target": "http://localhost:8080", "secure": false, "changeOrigin": true },
  "/get-all-properties": { "target": "http://localhost:8080", "secure": false, "changeOrigin": true },
  ... (toate celelalte)
}
```

Sau, mai simplu, un wildcard: `"/api": { ... }` și prefix-uiește toate URL-urile cu `/api/`.

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

3-4 ore (Phase 1).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/environments/environment.ts` și `environment.prod.ts` au câmp `apiBaseUrl`
- [ ] #2 `git grep "hai-in-sat-api.lm.r.appspot.com" src/app` returnează 0 rezultate (string-ul există doar în environment.prod.ts)
- [ ] #3 `git grep "localhost:8080" src/app` returnează 0 rezultate (string-ul există doar în environment.ts și proxy.conf.json)
- [ ] #4 `ng serve` și `ng build --configuration production` produc bundle-uri funcționale care lovesc backend-ul corect
- [ ] #5 `npm run generate-sitemap` lucrează cu URL-ul configurat (env var sau arg)
- [ ] #6 Toate API call-urile în SPA continuă să funcționeze post-refactor (test manual: properties listing, property details, login, save-property)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. URL API hardcodat in 6 locuri: property-form-service, photo-admin, property-form-email-service, terrain-form-service, home-form-service + interceptors/auth.interceptor.ts (API_ORIGIN + LOCAL_API_ORIGIN) + scripts/generate-sitemap.js:9. environment.ts NU are inca apiBaseUrl. Variantele localhost:8080 raman comentate adiacent. Nimic refactorizat.
<!-- SECTION:NOTES:END -->
