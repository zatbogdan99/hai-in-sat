---
id: TASK-132
title: Actualizează dependențele frontend și SSR pentru remedierea vulnerabilităților
status: To Do
assignee: []
created_date: '2026-10-03 21:50'
labels:
  - security
  - dependencies
  - frontend
  - ssr
dependencies: []
references:
  - 'https://angular.dev/reference/releases'
  - 'https://angular.dev/reference/versions'
  - >-
    https://github.com/angular/angular-cli/security/advisories/GHSA-x288-3778-4hhx
  - 'https://github.com/angular/angular/security/advisories/GHSA-f67j-2jqw-jpq7'
priority: high
ordinal: 0
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv și prioritate
Actualizează dependențele frontendului Angular și serverului SSR pentru a remedia vulnerabilitățile cunoscute, păstrând funcționalitatea, SEO și aspectul desktop/mobil.

Decizie explicită a utilizatorului din 2026-10-04: ACESTA ESTE URMĂTORUL TASK DE IMPLEMENTAT, înaintea TASK-121 și a celorlalte task-uri SEO rămase. Excepție de la ordinea numerică istorică din backlog/docs/ordine-executie.md. Cererea curentă autorizează crearea și prioritizarea task-ului, nu începerea implementării.

## Context verificat
Auditul npm production din verificarea de pregătire pentru deploy: npm audit --omit=dev a raportat 28 pachete afectate: 4 critical, 11 high, 13 moderate. Aceste numere sunt baseline istoric, nu dovadă că fiecare alertă este exploatabilă în site; auditul trebuie refăcut la implementare.
Versiuni rezolvate observate: Angular/SSR 19.2.19, Express 4.21.2, lru-cache 11.5.3. Angular, Express, Firebase și tranzitivele relevante trebuie evaluate după sursele oficiale și utilizarea reală. Alertele observate includ SSR, parser HTML/sanitizare, Swiper și tranzitive Firebase.

Frontendul se construiește local în două bundle-uri (browser + SSR). App Engine primește yarn.lock și exclude package-lock.json prin .gcloudignore; cele două lockfile-uri trebuie actualizate coerent. Ultimul baseline funcțional: build PASS, 106 teste Angular, 26 teste SSR și 109 răspunsuri HTTP, cu 24 de rute din sitemap și 16 anunțuri descoperite prin linkuri.

## Scope și abordare
- Inventariază dependențele directe/tranzitive și diferențiază runtime/browser/SSR de tooling. Documentează pentru fiecare alertă critical/high pachetul, advisory-ul, versiunea rezolvată, condițiile de exploatare și remedierea.
- Selectează o versiune Angular încă suportată, care conține remedierile relevante și este compatibilă cu CLI/devkit/compiler, TypeScript, RxJS, Zone.js, AngularFire/Firebase și PrimeNG/Lara. Folosește migrările oficiale în pași; nu masca incompatibilități cu --force sau --legacy-peer-deps.
- Actualizează Express și celelalte pachete afectate la versiuni remediate compatibile. Nu forța un major dacă un patch/minor suportat remediază problema. Dacă este necesar un major, tratează și testează schimbările de API/routing.
- Păstrează contractul de build și SSR, redirecturile, security headers, 404/noindex, timeout/retry/503, cache HTML și static, canonicals/schema și linkurile crawlabile. Nu pierde middleware-ul custom prin schematics.
- Migrarea builderului la esbuild rămâne TASK-131; nu o include automat. Dacă upgrade-ul de securitate o impune, documentează constrângerea și reevaluează suprapunerea înainte de extinderea scope-ului.
- Fără redesign sau schimbări de business/API/backend. Optimizarea costului backendului și modificarea configurației cloud sunt în afara acestui task. Blocajul separat de packaging App Engine (build automat cu surse excluse) nu este considerat rezolvat doar prin actualizarea dependențelor.
- Implementare directă, fără dev-pipeline, conform preferinței curente. Review independent la final; remediază problemele blocante. Fără merge/deploy; livrare pe branch ticket/... și PR.

## Validare necesară
Audit înainte/după și instalare curată cu lockfile-ul folosit la deploy; build browser + SSR; suite Angular, SSR și HTTP SSR locale; verificare reală desktop/mobil pentru meniu, footer, listă/paginare/filtre, detalii/galerii și formulare. Autentificarea și operațiile administrative se verifică fără scrieri în producție. Folosește fixture/mock/local pentru email, formulare și modificări de proprietăți.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Auditul înainte/după este documentat, cu versiunile directe/tranzitive și advisory-urile critical/high; numărul alertelor nu este prezentat ca număr de exploatări confirmate.
- [ ] #2 Pachetele Angular sunt pe o linie suportată care include remedierile relevante, iar toate peer dependencies și versiunea Node/TypeScript sunt compatibile, fără instalări forțate sau ignorarea incompatibilităților.
- [ ] #3 Alertele production critical/high care au remediere disponibilă sunt eliminate; orice alertă fără remediere disponibilă are explicație verificabilă și risc rezidual explicit, fără a fi declarată rezolvată.
- [ ] #4 package.json, package-lock.json și yarn.lock sunt coerente; o instalare curată folosind lockfile-ul de deploy reușește reproductibil și pornește bundle-ul SSR.
- [ ] #5 Buildurile de producție browser și SSR și suitele test:ci, test:ssr și test:ssr:http trec; nu sunt dezactivate teste sau mărite praguri doar pentru a ascunde regresii.
- [ ] #6 Protocolul SSR local confirmă redirecturi, security headers, coduri 200/404/503 și Retry-After, noindex, cache GET/HEAD/304 și separarea rutelor private; toate rutele din sitemap păstrează H1/canonical și linkuri interne/incoming links.
- [ ] #7 Verificarea funcțională și vizuală desktop/mobil este documentată: navigare normală și tab nou, meniu, footer, filtre/paginare/Back, detalii/galerii, formulare și fluxul de autentificare; fără regresii neacceptate sau efecte în producție.
- [ ] #8 Review-ul independent este încheiat fără probleme blocante, iar PR-ul descrie versiunile, remedierea alertelor, validările și riscurile reziduale; nu s-a făcut deploy.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NEXT: ales explicit de utilizator la 2026-10-04. Se implementează înainte de TASK-121; după finalizare se reia ordinea TASK-121 … TASK-131. Nu implementa în această rundă de planificare.
<!-- SECTION:NOTES:END -->
