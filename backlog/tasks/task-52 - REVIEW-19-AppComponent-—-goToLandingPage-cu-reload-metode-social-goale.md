---
id: TASK-52
title: 'REVIEW-19: AppComponent — goToLandingPage cu reload + metode social goale'
status: To Do
assignee: []
created_date: '2026-05-07 08:47'
updated_date: '2026-06-17 14:24'
labels:
  - review
  - bug
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Inspecție `src/app/app.component.ts` evidențiază 3 probleme:

### 1. `goToLandingPage()` face full reload (linii 84-89)

```typescript
goToLandingPage() {
  this.router.navigateByUrl("/landing-page").then(() => {
    window.location.reload();
  });
}
```

- Defeats SPA: `window.location.reload()` re-fetch-uiește `index.html`, re-bootstrap-ează Angular, re-ia toate bundle-urile. Cost: ~1-2s în plus față de o simplă navigare.
- Plus: ruta `/landing-page` NU EXISTĂ în `app.routes.ts`. Navigarea va lovi wildcard `**` → `NewLandingPageComponent`. Deci ruta intenționată e probabil `/`. Logica e ruptă.
- Comentariul `// this.service.reload$.next(true);` sugerează că logica anterioară folosea un BehaviorSubject pentru reload — refactorizat parțial, lăsat în această stare ciudată.

### 2. Metode social media goale (linii 183-193)

```typescript
goToTikTokPage() { }
goToFacebookPage() { }
goToInstagramPage() { }
```

Trei butoane în footer (probabil) au handlers care nu fac nimic. Click-ul lor → nimic. UX broken: utilizatorii cred că sunt link-uri inactive.

`openLink(url)` la linia 195-197 face deschidere corectă în tab nou:

```typescript
openLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
```

Probabil ar trebui ca social buttons să apeleze `openLink('https://www.facebook.com/profile.php?id=61560478122728')` etc. (URL-uri din JSON-LD `sameAs`).

### 3. Subscribe-uri root-level fără cleanup

Linii 65-69, 166-180: subscribe la `router.events`, `service.openTerms$`, `service.openPrivacy$`. AppComponent este singleton (root), deci leak-ul nu se acumulează — nu e critical. Dar este un anti-pattern care va apărea și în alte locuri (acoperit de REVIEW-5).

## Cum se rezolvă

### Fix 1 — `goToLandingPage`

```typescript
goToLandingPage() {
  this.router.navigateByUrl('/');
}
```

Dacă scopul e să resetezi state-ul global la home, folosește serviciu (DataService) sau signal-uri pentru reset, nu reload.

### Fix 2 — Social buttons

```typescript
private readonly socialUrls = {
  tiktok: 'https://www.tiktok.com/@hai.in.sat',
  facebook: 'https://www.facebook.com/profile.php?id=61560478122728',
  instagram: 'https://www.instagram.com/hai.in.sat',
};

goToTikTokPage() { this.openLink(this.socialUrls.tiktok); }
goToFacebookPage() { this.openLink(this.socialUrls.facebook); }
goToInstagramPage() { this.openLink(this.socialUrls.instagram); }
```

Sau mai DRY: în template, leagă direct la `openLink('https://...')` cu URL-urile inline (mai puțin cod TS).

URL-urile sociale corespunzătoare se găsesc în `src/index.html` JSON-LD `sameAs[]`.

### Fix 3 — Subscriptions

Acoperit de REVIEW-5. Aplică pattern-ul `takeUntilDestroyed` sau acceptă explicit că AppComponent este singleton root.

## Cleanup adițional în AppComponent

- Cod comentat (linii 159-163, 148-156) — șterge dacă nu mai folosești.
- Câmpuri `visible`, `contact`, `cookies`, `termenii`, `politica` toate `boolean` — sunt utilizate? Șterge cele neutilizate.
- Metoda `showCookies()` — există vreun popup de cookies? Verifică template. Dacă nu, șterge metoda.

## Fișiere afectate

- `src/app/app.component.ts`
- `src/app/app.component.html` (verifică binding-urile la metode goale)

## Efort

1-2 ore.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `goToLandingPage` navighează la `/` fără `window.location.reload()`
- [ ] #2 Click pe butoanele TikTok / Facebook / Instagram din footer deschide profilurile sociale corespunzătoare în tab nou
- [ ] #3 Cod comentat șters din AppComponent (sau păstrate cu motiv documentat)
- [ ] #4 Câmpuri `boolean` neutilizate șterse
- [ ] #5 Test manual: toate butoanele din header/footer funcționează corect
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial. Fix 3 (subscriptions) e DEJA facut - AppComponent foloseste takeUntilDestroyed peste tot (app.component.ts:69,170,180). RAMAN: Fix 1 - goToLandingPage() (:87-92) inca face navigateByUrl('/landing-page') + window.location.reload(), iar ruta /landing-page nici nu exista. Fix 2 - goToTikTokPage/Facebook/Instagram (:190-200) inca goale; openLink() exista (:202). Plus cod comentat (:151-166) si campuri boolean neutilizate.
<!-- SECTION:NOTES:END -->
