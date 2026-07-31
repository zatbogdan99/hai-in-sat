---
id: TASK-109
title: 'REVIEW-7: console.log/error în cod producție (≈59 apariții, 11 fișiere)'
status: Done
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-31'
labels:
  - review
  - quality
  - perf
dependencies: [TASK-101]
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

### Opțiunea B — RESPINSA (decizie owner 2026-07-27)

Strip-ul la build prin Terser NU se face: Angular CLI nu expune `drop_console`, ar cere builder custom sau un post-build script fragil. Nu o mai evalua.

### DECIS: Opțiunea A — refactor cu `LoggerService`

Control fin, si lasa deschisa trimiterea la Sentry/Cloud Logging mai tarziu.

### Cazuri speciale de tratat

- `console.log('PropertyFormDTO:', dto)` (`properties.component.ts:247`) — **CONFIDENȚIAL**, șterge complet sau înlocuiește cu `this.logger.log('Form sent for', dto.firstName)` fără PII.
- `console.error('Failed to load ...', err)` în error handlers — păstrează ca eroare (Opțiunea A `logger.error` rămâne activă în prod).
- `[AuthGuard] Access denied` — informativ pentru admin debug, ține via `logger.log`.

## Fișiere afectate

Cele 11 fisiere date de `git grep -l "console\." src/app --include="*.ts"` (65 de aparitii la 2026-07-06), MINUS cele doua componente moarte (`home-page`, `terrain-form-page`) care se sterg in TASK-101 — pe alea nu le refactoriza.

Plus fisierul nou `src/app/service/logger.service.ts`.

## Efort

3-4 ore.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Pe `https://hai-în-sat.ro`, cu consola deschisa: navigheaza prin `/properties`, deschide un anunt, logheaza-te. Consola trebuie sa fie **curata** — fara `[Photos]`, fara obiecte de proprietate serializate, fara continut de formular. Erorile reale (`logger.error`) raman vizibile, si asta e intentionat.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Exista `src/app/service/logger.service.ts`, cu `@Injectable({ providedIn: 'root' })` si metodele `log`, `warn`, `error`; `log` si `warn` sunt no-op cand `environment.production` e `true`; `error` scrie intotdeauna
- [ ] #2 `git grep -n "console\." src/app --include="*.ts"` returneaza rezultate DOAR in `logger.service.ts`
- [ ] #3 `properties.component.ts` (azi linia ~257): log-ul `console.log('PropertyFormDTO:', dto)` e **STERS complet**, nu convertit la `logger.log` — contine PII (nume, email, telefon din formular)
- [ ] #4 `properties.component.ts` liniile ~310 (`'Viewing property details:'` cu obiectul complet al proprietatii) si ~196 (raspunsul API paginat complet) NU mai logheaza obiecte intregi: ori sterse, ori reduse la campuri scalare (`id`, `name`) — obiectele contin `thumbnail` base64 de ordinul megabytilor
- [ ] #5 Niciun apel ramas la `logger.log`/`logger.warn` nu primeste ca argument un obiect de proprietate, un DTO de formular sau un raspuns API brut
- [ ] #6 Componentele moarte `home-page` si `terrain-form-page` NU apar in diff — se sterg in TASK-101 (vezi `dependencies`)
- [ ] #7 `auth.guard.ts` (azi linia ~25): `console.log('[AuthGuard] Access denied')` a devenit `logger.log(...)` sau a fost sters
- [ ] #8 `npx ng test --watch=false --browsers=ChromeHeadless` trece
- [ ] #9 Implementatorul a rulat `npm run build:browser` inainte si dupa si a lipit in `## Implementation Notes` dimensiunea `main.<hash>.js` in ambele situatii (AC informativ — se accepta si o crestere mica, daca e explicata; scopul e sa existe cifra, nu sa scada obligatoriu)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid; numarul a SCAZUT de la 72 la 59 console.* in 11 fisiere din src/app. Concentrate in add-property.component.ts (37). LEAK PII inca prezent: console.log('PropertyFormDTO:', dto) la properties.component.ts:257. Nu exista LoggerService. property-details are acum doar 3 (warn/error). auth.guard.ts:25 inca are console.log('[AuthGuard] Access denied').

Verificare 2026-07-06: 65 console.* in 11 fisiere: add-property 42, properties 8, property-details 4, contact-us 3, login 2, auth.guard 1, form-page 1, under-the-mountain 1, youtube-player 1 + home-page 1 si terrain-form-page 1 (ultimele doua sunt COD MORT — TASK-101; se sterg cu tot cu componentele, nu se refactorizeaza). Cazuri de tratat explicit in properties.component.ts: :257 PropertyFormDTO (PII — nume/email/telefon din formular), :310 'Viewing property details:' logheaza OBIECTUL COMPLET al proprietatii (inclusiv thumbnail base64 — spam de megabytes in consola la fiecare click pe card), :196 logheaza raspunsul API paginat complet (acelasi base64). LoggerService tot inexistent.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Fork-ul Optiunea A vs B → B respinsa explicit; ramane doar LoggerService.
2. AC-ul vechi #4 cerea „bundle mai mic vs baseline" ca si conditie de trecere — un prag pe care nici implementatorul nu-l poate garanta (LoggerService adauga cod). Transformat in criteriu de RAPORTARE: cifra trebuie masurata si notata, nu neaparat sa scada.
3. AC-ul vechi #3 („niciun log nu mai expune PII") era prea vag pentru un verificator → inlocuit cu trei criterii care numesc fisierul si linia exacta.

`dependencies: [TASK-101]`: din cele 65 de aparitii, 2 sunt in componente moarte care se sterg. Daca rulezi acest task primul, ignora-le si noteaza-le in implementation notes.

Măsurători implementare TASK-109 — 2026-07-31 (rulate de orchestratorul dev-pipeline conform workflow-ului):
- Înainte de implementare: `dist/hai-in-sat/browser/main.0b3d709f805c23b3.js` — **2.222.845 bytes** (`npm run build:browser`, succes).
- După implementare: `dist/hai-in-sat/browser/main.24317d8333b74038.js` — **2.223.354 bytes** (`npm run build:browser`, succes).
- Diferență: **+509 bytes** (aprox. **+0,023%**), creștere mică explicată de introducerea `LoggerService`; criteriul este informativ și nu cere scădere obligatorie.
- Teste post-implementare: `npx ng test --watch=false --browsers=ChromeHeadless` — **53/53 SUCCESS**.

Rezultat pipeline 2026-07-31:
- Implementat `src/app/service/logger.service.ts` și testele dedicate; `log`/`warn` sunt suprimate în producție, iar `error` rămâne activ.
- Migrat logging-ul din cele 9 fișiere frontend active; logul `PropertyFormDTO` și payload-urile brute au fost eliminate sau reduse la valori scalare/proiecții sanitizate.
- `console.*` a rămas exclusiv în `logger.service.ts`; componentele eliminate prin TASK-101 și repo-ul backend nu au fost atinse.
- Review: 1 ciclu, verdict `{ "issues": [] }`; nit-uri amânate: niciunul.
- Verify: `allCriteriaMet: true`, toate cele 9 criterii îndeplinite.
<!-- SECTION:NOTES:END -->
