---
id: TASK-39
title: >-
  REVIEW-6: Test app.component.spec.ts conține assertions stale (boilerplate ng
  new)
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:23'
labels:
  - review
  - tests
  - bug
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`src/app/app.component.spec.ts` conține assertion-uri default generate de `ng new`:

```typescript
it('should render title', () => {
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.querySelector('.content span')?.textContent).toContain('hai-in-sat app is running!');
});
```

Template-ul actual (`app.component.html`) NU conține string-ul `hai-in-sat app is running!`. Testul ar trebui să eșueze la `npm test`. Două scenarii posibile:

1. **Testul eșuează silent** — nu rulează nimeni `npm test`, iar testul cade. Dacă CI nu rulează tests, regresiile trec necontrolate.
2. **Testul „trece" pentru că `compiled.querySelector('.content span')` returnează `null`**, iar `?.textContent` este `undefined`, iar `expect(undefined).toContain(...)` aruncă error → test fail. Asta confirmă (1).

Plus suspect: aproape toate componentele au `*.spec.ts` cu nume default — probabil o mare parte sunt boilerplate ne-implementat real.

## Surse afectate (suspecte)

Spec-uri din `src/app/**/*.spec.ts` care merită verificate dacă sunt placeholder vs. real:
- `app.component.spec.ts` (CONFIRMED stale)
- `about-us/about-us.component.spec.ts`
- `add-property/add-property.component.spec.ts`
- `background-image.service.spec.ts`
- `contact-us/contact-us.component.spec.ts`
- `home-form-page/form-page.component.spec.ts`
- `home-page/home-page.component.spec.ts`
- `info-page/info-page.component.spec.ts`
- `login/login.component.spec.ts`
- `see-the-area/...`, `see-the-area-buy/...`, `see-the-area-rent/...`
- `terrain-form-page/terrain-form-page.component.spec.ts`
- `under-the-mountain/...`, `village-of-the-month/...`
- `youtube-player/...`
- `service/home-form-service/...spec.ts`, `service/loading-service/...spec.ts`, `service/terrain-form-service/...spec.ts`

Cele care par mai serioase (verificat partial):
- `properties/properties.component.spec.ts` — folosește `jasmine.createSpyObj`, mock-uri reale, beforeEach proper
- `property-details/property-details.component.spec.ts` — același pattern, mai serios

## Cum se rezolvă

### Phase 1 — Curățire (1 oră)

1. Rulează `npm test --watch=false` și capturează rezultatele.
2. Pentru fiecare test failing care e boilerplate stale (rendering text inexistent, navigare la pagini schimbate):
   - Dacă testul nu adaugă valoare → șterge testul (păstrează `it('should create', ...)`)
   - Dacă testul are valoare → rescrie cu assertion corect

### Phase 2 — CI gate (30 min)

3. Adaugă în `package.json` script `"test:ci": "ng test --watch=false --browsers=ChromeHeadless --code-coverage"`
4. Configurează un GitHub Action sau Cloud Build trigger care rulează `npm run test:ci` la fiecare push pe main/PR. Dacă tests eșuează → block merge.
5. Dacă nu există infrastructură CI: măcar adaugă comanda în README sau pre-deploy script.

### Phase 3 — Coverage minim (timp variabil)

6. Decide threshold de coverage (ex: 40% inițial, target 60% pe componente critice — SeoService, PropertyFormService, AuthGuard).
7. Implementează test-uri reale pe servicii și pe logica complexă (sortPropertiesByOrder, generateSlug, parseTypeParam, etc.).

## Recomandare imediată

Doar Phase 1 — șterge testele stale, păstrează doar componentele cu test-uri reale. Coverage formală ulterior.

## Fișiere afectate

- `src/app/app.component.spec.ts` — rescrie sau simplifică
- Restul spec-urilor de mai sus — audit individual

## Efort

Phase 1: 1-2 ore.
Phase 2 (CI): 1-2 ore.
Phase 3 (coverage real): 2-5 zile.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `npx ng test --watch=false --browsers=ChromeHeadless` rulează fără teste eșuate
- [ ] #2 `app.component.spec.ts` nu mai conține string-ul `hai-in-sat app is running!`
- [ ] #3 Toate spec-urile boilerplate care nu adaugă valoare au fost șterse sau înlocuite cu test real
- [ ] #4 Există un script `npm test` care poate rula curat în CI (fără watch, fără browser interactiv)
- [ ] #5 Documentat (în README sau CLAUDE.md) cum se rulează testele și care sunt convențiile
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial (Phase 1 inceput in task-27). app.component.spec.ts si property-details.component.spec.ts au fost deja curatate de assertion-uri stale; login.component.spec.ts a primit provideri DI. RAMANE: audit pe restul spec-urilor placeholder (about-us, home-page, info-page, village-of-the-month, under-the-mountain, see-the-area*, *form-page, service/*), Phase 2 (CI gate) si Phase 3 (coverage). 'npm test' nu ruleaza inca in CI.
<!-- SECTION:NOTES:END -->
