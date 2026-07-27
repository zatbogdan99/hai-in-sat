---
id: TASK-108
title: 'REVIEW-3: PhotoAdminService apelează http://localhost:8080 din producție'
status: To Do
assignee: []
created_date: '2026-05-07 08:45'
updated_date: '2026-07-27'
labels:
  - review
  - bug
  - admin
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce — funcționalitate ruptă în producție

`src/app/service/photo-admin.service.ts:29-41`:

```typescript
regenerateThumbnails(width: number, height: number): Observable<number> {
  return this.http.post<number>(
    `http://localhost:8080/regenerate-thumbnails?width=${width}&height=${height}`,
    null
  );
}

regenerateThumbnailForProperty(propertyId: string, width: number, height: number): Observable<void> {
  return this.http.post<void>(
    `http://localhost:8080/regenerate-thumbnail/${encodeURIComponent(propertyId)}?width=${width}&height=${height}`,
    null
  );
}
```

URL-uri hardcodate spre `http://localhost:8080`. Probleme:

1. **Mixed content blocking**: site-ul deployat e pe HTTPS (`https://hai-în-sat.ro`). Browser-ul blochează automat orice request HTTP simplu (security default modern). Aceste apeluri eșuează cu eroare CORS/mixed content în consolă pe production.
2. **Localhost de pe pagina deployată = mașina utilizatorului**: chiar dacă mixed content ar fi permis, `localhost:8080` în browser-ul unui admin pe pagina production se duce la portul 8080 al MAȘINII admin-ului — nu există server acolo decât dacă admin-ul rulează backend-ul local. Admin-ul ar trebui să facă `npm start` local și să folosească forma dev (cu `secure: false`).
3. **Comentariul din CLAUDE.md** confirmă că este admin-only run-locally: „PhotoAdminService.regenerateThumbnails* is hardcoded to localhost (admin-only, run locally)" — convenția e că adminul folosește dev server pentru aceste operații.

Issue real: codul ajunge în production bundle, deci apare în UI admin pe production. Click → eroare. Confuzie pentru admin.

## Cum se rezolvă — DECIS de owner (2026-07-27): Opțiunea A

> Se muta apelurile pe API-ul de productie, peste HTTPS, cu auth de admin. Optiunile B (ascunde butoanele pe prod) si C (aplicatie admin separata) sunt RESPINSE — nu le mai evalua.

Motivul pentru care A e fezabila ACUM (verificat 2026-07-06):
- endpoint-urile exista deja in backend: `HaiInSatController.java:129` (`/regenerate-thumbnails`) si `:136` (`/regenerate-thumbnail/{id}`);
- sunt deja protejate cu rol ADMIN in `SecurityConfig.java:54`;
- `authInterceptor` ataseaza deja tokenul de admin pe cererile catre API.

Deci fix-ul e minimal si se face DOAR in frontend:

1. In `src/app/service/photo-admin.service.ts`, liniile ~31 si ~38: inlocuieste cele doua URL-uri hardcodate `http://localhost:8080/...` cu `` `${this.baseUrl}/...` `` — `baseUrl` exista deja, la linia 13.
2. Butoanele din `add-property.component.ts` (liniile ~542 si ~612) raman EXACT cum sunt — nu le ascunde, nu le conditiona. Ruta `/add-property` e deja protejata de `authGuard`.
3. NU modifica backend-ul: endpoint-urile si regulile de securitate sunt deja corecte.

Nota de secventiere: daca TASK-107 (mutarea URL-urilor in `environment.apiBaseUrl`) se livreaza INAINTEA acestui task, foloseste direct `environment.apiBaseUrl` in loc de campul local `baseUrl`. Ordinea inversa e la fel de buna — TASK-107 va prelua si acest fisier.

## Fișiere afectate

- `src/app/service/photo-admin.service.ts` — liniile ~31 si ~38 (singurul fisier modificat)
- `src/app/add-property/add-property.component.ts` — **NU se modifica** (butoanele raman cum sunt)
- Backend — **NU se modifica**

## Efort

30 min.

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

Logheaza-te ca admin pe `https://hai-în-sat.ro/add-property`, deschide DevTools → Network si apasa „Regenerate thumbnails". Astepti: o cerere catre `https://hai-in-sat-api.lm.r.appspot.com/regenerate-thumbnails?...` cu status **200** si cu headerul `Authorization` prezent. NU trebuie sa apara nicio cerere catre `http://localhost:8080` si niciun avertisment de mixed content in consola.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/app/service/photo-admin.service.ts`: ambele metode (`regenerateThumbnails` la ~linia 31 si `regenerateThumbnailForProperty` la ~linia 38) construiesc URL-ul din `` `${this.baseUrl}/...` `` (campul de la linia 13), nu din literal `http://localhost:8080`
- [ ] #2 `git grep "localhost:8080" src/app` returneaza 0 rezultate (string-ul poate ramane doar in `proxy.conf.json` si in comentarii explicite de dev-toggle, in afara lui `src/app`)
- [ ] #3 `src/app/add-property/add-property.component.ts` NU e modificat: butoanele de regenerare raman vizibile si neconditionate — decizie owner, Optiunea A (nu B)
- [ ] #4 Repo-ul backend NU e atins de acest task: endpoint-urile `HaiInSatController.java:129/136` si regula ADMIN din `SecurityConfig.java:54` raman neschimbate
- [ ] #5 `encodeURIComponent(propertyId)` din `regenerateThumbnailForProperty` se pastreaza
- [ ] #6 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. photo-admin.service.ts:31,38 regenerateThumbnails(ForProperty) tot hardcodeaza http://localhost:8080 (mixed-content pe prod HTTPS). Apelate in add-property.component.ts:542,612. NOU: backend-ul are deja endpoint-urile protejate admin (SecurityConfig.java:54), deci Optiunea A (muta pe baseUrl HTTPS cu auth) e acum fezabila; alternativ Optiunea B (ascunde butoanele pe prod).

Verificare 2026-07-06: neschimbat (aceleasi linii). DOUA precizari utile: (1) add-property.component.ts are DEJA un helper de detectie localhost la linia ~825 (window.location.hostname === 'localhost' || '127.0.0.1') — Optiunea B se implementeaza refolosind acel helper intr-un *ngIf pe butoane, fara environment nou. (2) Backend-ul: sursele traiesc pe branch-ul MASTER (nu main — vezi project.md); endpoint-urile /regenerate-thumbnail(s) exista in HaiInSatController.java:129/136, protejate ADMIN in SecurityConfig.java:54 — Optiunea A = schimbi cele doua URL-uri pe `${this.baseUrl}` existent (linia 13) si mergi cu tokenul de admin deja atasat de authInterceptor.
Revizuire 2026-07-27 (pregatire pentru pipeline). DECIZIE owner: **Optiunea A** — URL-urile trec pe `${baseUrl}` HTTPS, butoanele raman vizibile. Optiunile B si C au fost sterse din descriere ca sa nu mai existe fork pentru agent.

AC-ul vechi #2 cerea inspectie in DevTools pe site-ul deployat → mutat in `## Verificare post-deploy (owner)`. Restul AC-urilor sunt acum verificabile prin `git grep` si lectura.
<!-- SECTION:NOTES:END -->
