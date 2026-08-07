---
id: TASK-111
title: 'REVIEW-17: AuthGuard cu take(1) — race condition la cold start Firebase'
status: Done
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-08-07'
labels:
  - review
  - bug
  - auth
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`src/app/guards/auth.guard.ts:13-30`:

```typescript
export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map(user => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
```

`authState(auth)` este un Observable care emite stările auth:
1. La startup, **emite `null` imediat** (state inițial înainte ca Firebase SDK să verifice token-ul stocat).
2. După ~50-200ms (depinde de cold/warm start), Firebase SDK rezolvă token-ul din IndexedDB/localStorage și emite User-ul real (sau confirmă null dacă nu e logat).

`take(1)` ia DOAR prima emisie. Risk: dacă utilizatorul e logat dar Firebase încă inițializează la momentul navigării, `take(1)` poate prinde primul `null` → guard returnează `false`, redirect la `/login`, deși utilizatorul este de fapt autentificat. La următorul refresh, login-ul „se repară" miraculos.

Comportament observat: utilizatorul logat care face F5 pe `/add-property` poate fi redirectat la `/login` în mod inconsistent.

## Cum se rezolvă

### DECIS de owner (2026-07-27): Opțiunea C — `auth.authStateReady()`

Optiunile A (`filter(u => u !== undefined)`) si B (`firstValueFrom`) sunt RESPINSE — prima e probabil un no-op (`authState` din `@angular/fire` v19 nu emite `undefined`), a doua are exact acelasi comportament ca `take(1)`, deci nu rezolva nimic. Nu le mai evalua.

```typescript
export const authGuard = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.authStateReady(); // asteapta rezolvarea persistentei (IndexedDB/localStorage)
  if (auth.currentUser) return true;
  router.navigate(['/login']);
  return false;
};
```

`authStateReady()` (Firebase v9+) e metoda proiectata exact pentru route guards: se rezolva o singura data, dupa ce SDK-ul a terminat de verificat tokenul stocat.

## Test automat (parte din livrare)

Spec nou `src/app/guards/auth.guard.spec.ts`, cu `Auth` mock-uit prin `jasmine.createSpyObj` care expune `authStateReady` (promisiune rezolvata) si proprietatea `currentUser`:

1. **Logat**: `currentUser` = obiect user → guard-ul rezolva `true`, `router.navigate` NU e apelat.
2. **Nelogat**: `currentUser` = `null` → guard-ul rezolva `false` si `router.navigate` e apelat cu `['/login']`.

Guard-ul devine `async`, deci in spec foloseste `await` pe rezultat (sau `fakeAsync` + `tick()`), rulat prin `TestBed.runInInjectionContext(...)` — `inject()` are nevoie de context de injectie.

## Fișiere afectate

- `src/app/guards/auth.guard.ts` (refactor)
- `src/app/guards/auth.guard.spec.ts` (nou)

## Efort

1 oră (cu spec).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy. Race condition-ul de la cold start nu se poate reproduce determinist intr-un test automat; se verifica manual:

1. Logheaza-te ca admin, navigheaza la `/add-property` — OK.
2. **F5 hard** pe `/add-property` → trebuie sa RAMANA pe pagina, nu sa sara la `/login`. Repeta de ~10 ori.
3. Repeta cu DevTools → Network → throttling **Slow 3G**, unde Firebase initializeaza mai lent — acolo se manifesta bug-ul azi.
4. Logout, apoi acces direct pe `/add-property` → redirect la `/login`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `src/app/guards/auth.guard.ts` foloseste `await auth.authStateReady()` urmat de verificarea `auth.currentUser`; guard-ul e declarat `async`
- [x] #2 `authState(` si `take(1)` NU mai apar in `auth.guard.ts`; importurile ramase din `rxjs`/`rxjs/operators` care devin nefolosite sunt sterse
- [x] #3 Pe ramura nelogat, guard-ul apeleaza `router.navigate(['/login'])` si returneaza `false`; pe ramura logat returneaza `true` fara navigare
- [x] #4 `console.log('[AuthGuard] Access denied')` (azi linia ~25) e sters sau inlocuit cu `logger.log(...)` daca TASK-109 e deja livrat
- [x] #5 Exista `src/app/guards/auth.guard.spec.ts` cu exact cele doua cazuri descrise (logat → `true` fara navigare; nelogat → `false` + `navigate(['/login'])`), cu `Auth` mock-uit (`authStateReady` + `currentUser`) si apel prin `TestBed.runInInjectionContext`
- [x] #6 `npx ng test --watch=false --browsers=ChromeHeadless` trece, iar noul spec apare in numarul total de teste executate (azi 49 — dupa acest task trebuie sa fie ≥51)
- [x] #7 Comportamentul la SSR ramane cel documentat: pe server `currentUser` e `null`, deci `/add-property` redirectioneaza la `/login` la randarea pe server — asta e ACCEPTABIL (pagina e noindex prin TASK-115) si NU se „repara"
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. auth.guard.ts:17 foloseste tot authState(auth).pipe(take(1)) - nu auth.authStateReady(). Inca prezent console.log('[AuthGuard] Access denied') la :25. Recomandarea (Optiunea C, authStateReady) ramane.
Verificare 2026-07-06: neschimbat — auth.guard.ts:17 authState(auth).pipe(take(1)), console.log la :25. Recomandarea C (await auth.authStateReady() + auth.currentUser) ramane cea corecta. Nota SSR: guard-ul ruleaza si la render-ul server pe /add-property (authState e null pe server -> redirect /login la SSR) — comportament acceptabil (pagina e noindex prin TASK-115), doar nu-l "repara" accidental.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Trei optiuni (A/B/C) cu recomandare → pastrata DOAR C, cu codul final scris in descriere. A si B sunt marcate respinse, cu motivul.
2. AC-ul vechi #2 („F5 ramane pe pagina in 100% din incercari, pe Slow 3G") si #5 („console fara «Access denied» sub niciun rng de timing") sunt neverificabile de un agent — race condition-ul cere browser real si throttling → mutate in `## Verificare post-deploy (owner)`.
3. AC-ul vechi #4 cerea „test unit cu mock pe Auth", fara sa spuna cum se mock-uieste ceva ce e acum o promisiune → sectiunea „Test automat" descrie exact structura specului.

AC #6 fixeaza numarul de referinta: suita e verde la 49/49 pe master (remasurat 2026-07-28), deci noul spec trebuie sa se vada in total.

---

## Livrare 2026-08-07 (dev-pipeline, branch `ticket/task-111-authguard-authstateready`)

**Ce s-a implementat** (doar frontend; backend-ul nu a fost atins):

- `src/app/guards/auth.guard.ts` — rescris pe Optiunea C. Guard-ul e acum `async (): Promise<boolean>` si face `await auth.authStateReady()` inainte de a citi `auth.currentUser`. Cele trei `inject()` (`Auth`, `Router`, `LoggerService`) raman SINCRON inaintea lui `await`, altfel se pierde contextul de injectie (`NG0203`). Eliminate: importul `authState` si `import { map, take } from 'rxjs/operators'` — fisierul nu mai are niciun import din `rxjs`.
- `src/app/guards/auth.guard.spec.ts` (NOU) — exact cele doua cazuri cerute de AC #5. `Auth` e mock-uit cu `jasmine.createSpyObj<Auth>('Auth', ['authStateReady'], { currentUser })`: `currentUser` e `readonly` in tipul `Auth`, deci se seteaza prin al treilea argument (`propertyNames`), NU prin atribuire — mock-ul se recreeaza per test. Apel prin `await TestBed.runInInjectionContext(() => authGuard())`.
- `CLAUDE.md` — o singura propozitie (linia 31), care afirma ca guard-ul „uses Firebase `authState`"; devenea falsa dupa refactor.

**Verificat:** `npm run build:browser` → exit 0 (doar warning-uri de buget SCSS preexistente). `npx ng test --watch=false --browsers=ChromeHeadless` → **60/60 SUCCESS**, din care 2 din noul spec (AC #6 cerea ≥51). `canActivate: [authGuard]` din `app.routes.ts` NU a avut nevoie de modificare: `CanActivateFn` returneaza `MaybeAsync<GuardResult>`, care include `Promise<boolean>`.

**Cicluri de review:** 1 din 3 — inchis din primul, cu 0 blocker si 0 major.
**Verdict verify:** `allCriteriaMet: true`, toate cele 7 criterii indeplinite, `missing` gol.

**Divergente intre formularea criteriilor si starea reala a codului** (semnalate de verifier, niciuna blocanta):

1. AC #2 cere ca `authState(` si `take(1)` sa nu mai apara in fisier. Ele mai apar o singura data, in JSDoc-ul explicativ de la `auth.guard.ts:11` („Varianta veche (`authState(auth).pipe(take(1))`)..."), ca sa documenteze de ce s-a schimbat. In cod nu exista nicio utilizare si niciun import rxjs. Judecat indeplinit semantic; un grep literal ar da fals-pozitiv.
2. AC #4 presupunea un `console.log` la linia ~25, dar TASK-109 fusese deja livrat si guard-ul folosea deja `logger.log(...)`. Rezultatul cerut (zero `console.log` in guard) e atins; s-a pastrat `logger.log`.
3. AC #6 pornea de la un baseline de 49 de teste; baseline-ul real pe `master` era 58 (alte specuri adaugate intre timp). Pragul ≥51 e depasit oricum, iar delta de +2 din noul fisier e verificabila.
4. Justificarea din AC #7 spune ca `/add-property` e „noindex prin TASK-115"; in realitate excluderea se face prin `Disallow` in `src/robots.txt:15`, nu prin meta `noindex`. E doar justificare in criteriu, nu cerinta a acestui task.

**Nit-uri amanate (neadresate intentionat):**

- JSDoc-ul de la punctul 1 de mai sus s-ar putea reformula fara tokenii exacti, daca cineva bifeaza AC #2 prin grep automat.
- Specul nu prinde regresia de *ordonare* care e miezul bugului: fiindca `currentUser` e un getter cu valoare constanta, un guard scris gresit ca `const u = auth.currentUser; await auth.authStateReady(); return !!u;` ar trece ambele teste. Prinde totusi regresiile principale (revenirea la `authState(...).pipe(take(1))`, sau eliminarea apelului `authStateReady`). Intarire posibila fara a incalca „exact doua cazuri": getter-ul `currentUser` sa returneze `null` pana la rezolvarea promisiunii.

**Ramane de facut de owner:** sectiunea „Verificare post-deploy (owner)" de mai sus (F5 repetat pe `/add-property`, inclusiv pe Slow 3G). Nu face parte din acceptance criteria — race condition-ul cere browser real si nu se poate reproduce determinist intr-un test automat.
<!-- SECTION:NOTES:END -->
