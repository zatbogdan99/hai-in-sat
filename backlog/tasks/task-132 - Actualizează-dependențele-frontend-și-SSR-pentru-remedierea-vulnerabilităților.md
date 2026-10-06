---
id: TASK-132
title: Actualizează dependențele frontend și SSR pentru remedierea vulnerabilităților
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-03 21:50'
updated_date: '2026-10-06 20:30'
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

Decizie explicită a utilizatorului din 2026-10-04: ACESTA ESTE URMĂTORUL TASK DE IMPLEMENTAT, înaintea TASK-121 și a celorlalte task-uri SEO rămase. Excepție de la ordinea numerică istorică din backlog/docs/ordine-executie.md. Implementarea a fost autorizată ulterior explicit de utilizator și realizată direct, fără dev-pipeline.

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
- [x] #1 Auditul înainte/după este documentat, cu versiunile directe/tranzitive și advisory-urile critical/high; numărul alertelor nu este prezentat ca număr de exploatări confirmate.
- [x] #2 Pachetele Angular sunt pe o linie suportată care include remedierile relevante, iar toate peer dependencies și versiunea Node/TypeScript sunt compatibile, fără instalări forțate sau ignorarea incompatibilităților.
- [x] #3 Alertele production critical/high care au remediere disponibilă sunt eliminate; orice alertă fără remediere disponibilă are explicație verificabilă și risc rezidual explicit, fără a fi declarată rezolvată.
- [x] #4 package.json, package-lock.json și yarn.lock sunt coerente; o instalare curată folosind lockfile-ul de deploy reușește reproductibil și pornește bundle-ul SSR.
- [x] #5 Buildurile de producție browser și SSR și suitele test:ci, test:ssr și test:ssr:http trec; nu sunt dezactivate teste sau mărite praguri doar pentru a ascunde regresii.
- [x] #6 Protocolul SSR local confirmă redirecturi, security headers, coduri 200/404/503 și Retry-After, noindex, cache GET/HEAD/304 și separarea rutelor private; toate rutele din sitemap păstrează H1/canonical și linkuri interne/incoming links.
- [x] #7 Verificarea funcțională și vizuală desktop/mobil este documentată: navigare normală și tab nou, meniu, footer, filtre/paginare/Back, detalii/galerii, formulare și fluxul de autentificare; fără regresii neacceptate sau efecte în producție.
- [ ] #8 Review-ul independent este încheiat fără probleme blocante, iar PR-ul descrie versiunile, remedierea alertelor, validările și riscurile reziduale; nu s-a făcut deploy.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Audit si baseline vizual. 2. Migrari oficiale Angular si remedieri cu versiuni compatibile, pastrand webpack si contractele SSR/UI. 3. Lockfile-uri coerente si instalare curata Yarn. 4. Build si teste Angular/SSR/HTTP plus desktop/mobile cu fixture locale inclusiv autentificare si formulare. 5. Review independent, fixuri, documentare si PR fara deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
NEXT: ales explicit de utilizator la 2026-10-04. Se implementează înainte de TASK-121; după finalizare se reia ordinea TASK-121 … TASK-131. Nu implementa în această rundă de planificare.

Implementarea este autorizata explicit de utilizator la 2026-10-04; notele anterioare privind doar planificarea sunt istorice. Audit initial productie: 28 pachete afectate (4 critical, 11 high, 13 moderate).

Migrare oficiala Angular 19 -> 20.3.33, CLI/SSR 20.3.37, CDK 20.2.14, TypeScript 5.9.3, PrimeNG 20.4/Lara PrimeUIX. Audit npm productie 0; full 14 dev (braces high fara patch si uuid/SockJS moderate cu v4 neafectat). 106 teste Angular si 26 SSR trecute. Build browser+SSR trecut. Verificarea HTTP a identificat noua cerinta allowedHosts si respingerea slashurilor initiale duble; adaptari locale pentru pastrarea contractului, in revalidare. Review independent a cerut completarea variantelor native Linux/macOS din yarn.lock; regenerare in curs. Capturi desktop/mobile si fluxuri simulate in curs.

Validare finala 2026-10-06: npm/Yarn production 0 alerte; full 14 exclusiv dev documentate. Patch-uri suplimentare proxy-addr 2.0.8/source-map-js 1.2.2. Build browser+SSR PASS; 106 Angular, 26 SSR si 116 verificari HTTP pe instalare noua Yarn production PASS. 44 verificari browser, 50 capturi, 0 erori JS, geometrii identice la 1440/390/320 px; corectate DataView host display si autofocus PrimeNG20. Review independent inclusiv incremental fara blocante. PR in pregatire.
<!-- SECTION:NOTES:END -->
