---
id: TASK-35
title: 'REVIEW-7: console.log/error în cod producție (≈59 apariții, 11 fișiere)'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:23'
labels:
  - review
  - quality
  - perf
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`grep -c "console\." src/app/**/*.ts` returnează **72 apariții** de `console.log`, `console.error`, `console.warn` distribuite în:

- `add-property/add-property.component.ts` — ~15 (cele mai multe)
- `property-details/property-details.component.ts` — ~10 (`[Photos] Cerere batch...`, `[Photos] Răspuns...`, `[Photos] Imagini în galerie...` etc.)
- `properties/properties.component.ts` — câteva
- `login/login.component.ts` — 2 (`[Login] Authentication successful`, `[Login] Authentication failed`)
- `guards/auth.guard.ts` — 1 (`[AuthGuard] Access denied`)
- Servicii — câteva

### Probleme

1. **Performanță**: console-ul în production e gol pentru utilizator, dar JS engine tot evaluează argumentele (`console.log(\`[Photos] ${this.images.length} elemente\`)` încă construiește template string-ul). Nu e catastrofal, dar e cost real pe paginile care log-uiesc des.

2. **Bundle size**: string-uri de log fac parte din bundle (`[Photos] Cerere batch: offset=...`). Nu sunt minificate eficient.

3. **Information leak**: `console.log('PropertyFormDTO:', dto)` în `properties.component.ts:247` log-uiește datele din formularul utilizatorului în consolă. Vizibil în DevTools — un atacator poate citi PII (nume, email, telefon).

4. **Noisy debug output**: când admin-ul deschide DevTools, consolă plină de `[Photos]` log-uri batch. Distrage de la erori reale.

## Cum se rezolvă

### Opțiunea A — Logger service centralizat (recomandată)

1. Creează `src/app/service/logger.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(...args: any[]): void {
    if (!environment.production) console.log(...args);
  }
  warn(...args: any[]): void {
    if (!environment.production) console.warn(...args);
  }
  error(...args: any[]): void {
    // Erorile pot rămâne și în prod (dar fără PII) — sau trimite la un serviciu de monitoring
    console.error(...args);
  }
}
```

2. Înlocuiește `console.log` → `this.logger.log` (inject `LoggerService` în componente).
3. Pentru log-uri în servicii root-provided, inject service-ul ca de obicei.

### Opțiunea B — Build-time strip (simplu)

Configurează Terser în `angular.json` (production config) să elimine `console.log`/`console.debug`:

```json
"production": {
  "optimization": {
    "scripts": {
      "drop_console": ["log", "debug", "info", "warn"]
    }
  }
}
```

(Notă: Angular CLI nu expune asta direct. Necesită un custom builder sau un pre-build script care înlocuiește `console.log\(` cu `void(` în output. Ușor de stricat.)

### Recomandare

Opțiunea A — refactor cu `LoggerService`. Mai mult cod scris dar control fin (poți log la Sentry/Cloud Logging mai târziu).

### Cazuri speciale de tratat

- `console.log('PropertyFormDTO:', dto)` (`properties.component.ts:247`) — **CONFIDENȚIAL**, șterge complet sau înlocuiește cu `this.logger.log('Form sent for', dto.firstName)` fără PII.
- `console.error('Failed to load ...', err)` în error handlers — păstrează ca eroare (Opțiunea A `logger.error` rămâne activă în prod).
- `[AuthGuard] Access denied` — informativ pentru admin debug, ține via `logger.log`.

## Fișiere afectate

Toate cele 16+ fișiere identificate prin grep. Lista completă: `git grep -l "console\." src/app --include="*.ts"`.

## Efort

3-4 ore (refactor + create LoggerService + replace consistent).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git grep -c "console\." src/app/**/*.ts` returnează 0 (sau doar în `logger.service.ts`)
- [ ] #2 LoggerService creat cu metode `log`, `warn`, `error`; `log`/`warn` no-op în production
- [ ] #3 Niciun log nu mai expune PII (nume utilizator, email, telefon, body de formular complet)
- [ ] #4 Build production: bundle main.js mai mic vs baseline (verificat cu `ls -lh` înainte/după)
- [ ] #5 Erori reale (`logger.error`) continuă să apară în consola production pentru debugging
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid; numarul a SCAZUT de la 72 la 59 console.* in 11 fisiere din src/app. Concentrate in add-property.component.ts (37). LEAK PII inca prezent: console.log('PropertyFormDTO:', dto) la properties.component.ts:257. Nu exista LoggerService. property-details are acum doar 3 (warn/error). auth.guard.ts:25 inca are console.log('[AuthGuard] Access denied').
<!-- SECTION:NOTES:END -->
