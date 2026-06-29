---
id: TASK-8
title: 'REVIEW-3: PhotoAdminService apelează http://localhost:8080 din producție'
status: To Do
assignee: []
created_date: '2026-05-07 08:45'
updated_date: '2026-06-17 14:23'
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

## Cum se rezolvă

### Opțiunea A — Mut spre API real cu auth (cel mai curat)

1. Mută endpoint-urile `/regenerate-thumbnails` și `/regenerate-thumbnail/{id}` în backend production deployat.
2. Adaugă auth (depinde de REVIEW-1 — necesită admin role).
3. Schimbă `photo-admin.service.ts` să folosească `${baseUrl}` consistent (deja are `private readonly baseUrl` definit la liniile 13-14).
4. Verifică costul: regenerarea thumbnails poate fi heavy I/O; dacă rulează pe App Engine F2, asigură-te că instance-ul nu pică pe timeout (cron job dedicat e mai bun).

### Opțiunea B — Ascunde butoanele în UI production (rapid)

1. În `add-property.component.ts` (sau template), ascunde butoanele „Regenerate thumbnails" sub un guard: `*ngIf="!environment.production"`.
2. Funcționalitatea rămâne disponibilă în dev local (ng serve), dar nu e expusă în UI production.
3. Comentariu clar în cod că aceste butoane sunt local-only.

### Opțiunea C — Construiește o aplicație admin separată

Dacă admin-ul are mai multe operații dev-only, separă într-un proiect admin distinct care nu se deploy-uiește la producție. Prea mult overhead pentru moment.

## Recomandare

Opțiunea B pe termen scurt (1 oră), Opțiunea A când se face și REVIEW-1 (auth pe API).

## Fișiere afectate

- `src/app/service/photo-admin.service.ts` — liniile 29-41
- `src/app/add-property/add-property.component.ts` — butoanele care apelează aceste metode (~liniile 530-610 după find pe „regener")

## Efort

1 oră (Opțiunea B); ~6 ore (Opțiunea A).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pe build production, butoanele „Regenerate thumbnails" fie sunt ascunse, fie pointează la `${baseUrl}` cu HTTPS
- [ ] #2 Pe deployed site (`https://hai-în-sat.ro/add-property` ca admin), DevTools Network NU arată requests spre `http://localhost:8080`
- [ ] #3 În dev local (`npm start`), funcționalitatea continuă să meargă cu backend-ul Java rulând pe localhost:8080
- [ ] #4 Cod nu mai conține string literal `http://localhost:8080` în fișiere ne-comentate (în afară de `proxy.conf.json` și comentarii explicite dev-toggle)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. photo-admin.service.ts:31,38 regenerateThumbnails(ForProperty) tot hardcodeaza http://localhost:8080 (mixed-content pe prod HTTPS). Apelate in add-property.component.ts:542,612. NOU: backend-ul are deja endpoint-urile protejate admin (SecurityConfig.java:54), deci Optiunea A (muta pe baseUrl HTTPS cu auth) e acum fezabila; alternativ Optiunea B (ascunde butoanele pe prod).
<!-- SECTION:NOTES:END -->
