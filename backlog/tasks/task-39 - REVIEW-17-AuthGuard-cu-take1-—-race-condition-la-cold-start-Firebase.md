---
id: TASK-39
title: 'REVIEW-17: AuthGuard cu take(1) — race condition la cold start Firebase'
status: To Do
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-06-17 14:24'
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

### Opțiunea A — `filter` pentru first definitive state

```typescript
import { filter, take, map } from 'rxjs/operators';

export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    filter(user => user !== undefined), // așteaptă primul state definit (User sau null)
    take(1),
    map(user => {
      if (user) return true;
      router.navigate(['/login']);
      return false;
    })
  );
};
```

**Notă**: `authState` din `@angular/fire/auth` v19 emite User sau null direct (nu emite undefined ca state „pending"). Deci `filter(u => u !== undefined)` poate să nu schimbe nimic.

### Opțiunea B — `firstValueFrom` cu `authState`

Folosește `Promise` pentru claritate:

```typescript
import { firstValueFrom } from 'rxjs';

export const authGuard = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const user = await firstValueFrom(authState(auth));
  if (user) return true;
  router.navigate(['/login']);
  return false;
};
```

`firstValueFrom` așteaptă prima emisie care nu e cancellată. Comportament identic cu `take(1)` dacă `authState` emite imediat.

### Opțiunea C — Verifică `auth.currentUser` direct

Firebase Auth păstrează utilizatorul curent în memory după `getAuth()`. La cold start, `auth.currentUser` poate fi `null` chiar dacă utilizatorul are token în IndexedDB. Trebuie să așteptăm `auth.authStateReady()` (Firebase v9+):

```typescript
export const authGuard = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  await auth.authStateReady(); // așteaptă persistence să se rezolve
  if (auth.currentUser) return true;
  router.navigate(['/login']);
  return false;
};
```

`authStateReady()` este metoda recomandată de Firebase pentru route guards. Singura emisie definitivă, fără race conditions.

### Recomandare

**Opțiunea C** — folosește `authStateReady()` care e proiectată exact pentru acest scenariu.

## Test

1. Login ca admin în SPA, navighează la `/add-property`. OK.
2. F5 (refresh hard) pe `/add-property`. **Trebuie să rămână pe pagină**, nu să facă redirect la `/login`.
3. Repetă cu DevTools throttling Slow 3G — Firebase ia mai mult să inițializeze.
4. Logout, încearcă să accesezi `/add-property` direct. Trebuie redirect la `/login`.

## Fișiere afectate

- `src/app/guards/auth.guard.ts` (refactor)

## Efort

30 min - 1 oră (cu test).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `authGuard` folosește `auth.authStateReady()` SAU echivalent care așteaptă state definitiv
- [ ] #2 Login → F5 pe `/add-property` rămâne pe pagină în 100% din încercări (test pe Slow 3G/4G)
- [ ] #3 Logout → navigare la `/add-property` redirect la `/login`
- [ ] #4 Test unit pentru AuthGuard: două cazuri (logged in, logged out) cu mock pe `Auth`
- [ ] #5 Console nu arată log-uri „Access denied" la utilizator logat (sub niciun rng de timing)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. auth.guard.ts:17 foloseste tot authState(auth).pipe(take(1)) - nu auth.authStateReady(). Inca prezent console.log('[AuthGuard] Access denied') la :25. Recomandarea (Optiunea C, authStateReady) ramane.
<!-- SECTION:NOTES:END -->
