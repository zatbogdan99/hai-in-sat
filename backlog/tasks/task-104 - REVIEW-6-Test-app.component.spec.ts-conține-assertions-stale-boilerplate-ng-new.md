---
id: TASK-104
title: >-
  REVIEW-6: Test app.component.spec.ts conține assertions stale (boilerplate ng
  new)
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-27'
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

**STARE REALA, remasurata 2026-07-28:** suita e **VERDE — 49/49 SUCCESS** (`npx ng test --watch=false --browsers=ChromeHeadless`). Assertion-ul stale citat mai sus a fost deja curatat (vezi verificarea din 2026-06-08). Premisa initiala a task-ului — „testul ar trebui sa esueze" — nu mai e valabila.

Ce ramane deci real de facut nu e repararea unei suite rosii, ci **curatarea spec-urilor placeholder** care raporteaza 49 de teste verzi fara sa verifice nimic — dand o impresie falsa de acoperire. Plus lipsa unei comenzi dedicate de CI.

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

### Phase 2 — DOAR scriptul, FARA workflow CI (decizie owner 2026-07-27)

3. Adauga in `package.json`: `"test:ci": "ng test --watch=false --browsers=ChromeHeadless"`.
4. Documenteaza in `CLAUDE.md` (sectiunea „Commands") cum se ruleaza testele si care sunt conventiile.

**NU se creeaza `.github/workflows/`.** Repo-ul nu are azi niciun CI, iar adaugarea unuia e o decizie de infrastructura separata de curatarea spec-urilor. Daca o vrei, e task nou.

(Nota: pipeline-ul de agenti ruleaza oricum `npx ng test --watch=false --browsers=ChromeHeadless` la pasul de verify, conform `.dev-pipeline/pipeline.config.json` — deci exista deja un gate de facto pe fiecare task.)

### Phase 3 — SCOASA DIN SCOPE

Fara prag de coverage, fara `--code-coverage`, fara scrierea de teste noi pe servicii. Un prag stabilit acum ar bloca PR-uri viitoare fara ca cineva sa fi decis pragul in cunostinta de cauza.

## Ce inseamna concret „spec placeholder"

Un spec care contine DOAR `it('should create', ...)` cu `expect(component).toBeTruthy()` si nimic altceva. Pentru fiecare astfel de fisier, alegerea e binara si o faci pe loc, fara sa intrebi:

- componenta e **cod mort** (`home-page`, `terrain-form-page`) → spec-ul se sterge odata cu ea, in TASK-101. Nu-l atinge aici.
- componenta e **vie** → spec-ul RAMANE ca atare. `should create` prinde erorile de DI si de compilare a template-ului; nu-l sterge, dar nici nu-l umfla cu teste inventate.
- spec-ul contine assertion-uri **stale** (verifica text sau comportament care nu mai exista in template) → se corecteaza assertion-ul, sau se sterge assertion-ul si se pastreaza `should create`.

Cu alte cuvinte: in acest task NU se scriu teste noi de comportament. Se elimina doar minciunile.

## Fișiere afectate

- `src/app/app.component.spec.ts` — rescrie sau simplifică
- Restul spec-urilor de mai sus — audit individual

## Efort

Phase 1: 1-2 ore.
Phase 2 (CI): 1-2 ore.
Phase 3 (coverage real): 2-5 zile.
## Verificare post-deploy (owner)

Nu e cazul: task-ul atinge doar spec-uri si scripturi de test, nimic din codul livrat in productie.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `npx ng test --watch=false --browsers=ChromeHeadless` trece, fara teste esuate si fara teste marcate `xit`/`xdescribe`/`fdescribe`/`fit`
- [ ] #2 `git grep "hai-in-sat app is running" src/` returneaza 0 rezultate
- [ ] #3 `git grep -n "fdescribe\|fit(\|xdescribe\|xit(" src/` returneaza 0 rezultate — niciun test focalizat sau dezactivat lasat in urma
- [ ] #4 Implementatorul a parcurs FIECARE dintre cele 22 de fisiere `.spec.ts` din `src/app` si a notat in `## Implementation Notes`, pe cate un rand, verdictul: `pastrat ca atare` / `assertion stale corectat` / `assertion stale sters` / `se sterge in TASK-101`
- [ ] #5 Niciun spec nu contine assertion-uri care verifica text sau structura inexistenta in template-ul curent (cauza clasica: boilerplate `ng new` ramas)
- [ ] #6 NU se scriu teste noi de comportament in acest task — spec-urile `should create` de pe componentele VII raman cum sunt
- [ ] #7 `package.json` are scriptul `"test:ci": "ng test --watch=false --browsers=ChromeHeadless"`, FARA `--code-coverage`
- [ ] #8 NU exista `.github/workflows/` in repo dupa acest task (decizie owner: CI-ul e task separat)
- [ ] #9 `CLAUDE.md`, sectiunea „Commands", documenteaza `npm run test:ci` si conventia de rulare a testelor
- [ ] #10 Implementatorul a lipit in `## Implementation Notes` linia finala de rezultat a suitei (`TOTAL: N SUCCESS`); numarul poate diferi de 49 daca s-au sters assertion-uri, si asta e in regula
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Partial (Phase 1 inceput intr-un task din numerotarea VECHE — referinta istorica, nu cauta un task cu acel numar). app.component.spec.ts si property-details.component.spec.ts au fost deja curatate de assertion-uri stale; login.component.spec.ts a primit provideri DI. RAMANE: audit pe restul spec-urilor placeholder (about-us, home-page, info-page, village-of-the-month, under-the-mountain, see-the-area*, *form-page, service/*), Phase 2 (CI gate) si Phase 3 (coverage). 'npm test' nu ruleaza inca in CI.
Verificare 2026-07-06: 22 fisiere .spec.ts in src/app. Starea curatarii anterioare se mentine (app.component.spec si property-details.spec curatate, login.spec cu provideri); restul de auditat conform listei. NOTA: spec-urile componentelor moarte (home-page, terrain-form-page — vezi TASK-101) se STERG odata cu componentele, nu se repara. npm test tot fara gate CI.
Revizuire 2026-07-27 (pregatire pentru pipeline). Premisa task-ului era DEPASITA: descrierea sustinea ca suita e rosie („testul ar trebui sa esueze"). Masurat la 2026-07-28: **49/49 SUCCESS**. Curatarea din 2026-06-08 rezolvase deja assertion-ul stale din `app.component.spec.ts`. Descrierea a fost corectata, altfel un agent ar fi pornit sa caute o defectiune inexistenta.

DECIZII owner:
1. **Phase 2 redusa la scriptul `test:ci`** — fara `.github/workflows/`. Repo-ul nu are CI, iar adaugarea unuia e alta discutie. Pipeline-ul de agenti ruleaza oricum suita la fiecare task.
2. **Phase 3 (prag de coverage) scoasa din scope.**

Ambiguitatea cea mai costisitoare era „spec-uri boilerplate care nu adauga valoare au fost sterse sau inlocuite cu test real" (AC vechi #3): un agent ar fi putut sterge 20 de spec-uri sau scrie 20 de teste noi, ambele „conforme". Inlocuita cu o regula de decizie binara per fisier si cu cerinta de a raporta verdictul pentru fiecare din cele 22 de spec-uri.
<!-- SECTION:NOTES:END -->
