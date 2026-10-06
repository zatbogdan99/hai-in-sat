# TASK-132 — auditul dependențelor frontend și SSR

Inventar inițial: **2026-10-04**; evaluare după migrare și actualizare a verificărilor: **2026-10-06**. Inventarul folosește versiunile rezolvate în `package-lock.json` și rapoartele `npm audit --omit=dev --json` / `npm audit --json`; instalarea folosită de App Engine este verificată separat cu Yarn. Auditul identifică versiuni afectate de advisories; nu demonstrează automat exploatarea site-ului. Nu s-au trimis payload-uri de securitate către producție.

## Rezultate înainte / după

| Arbore analizat | Înainte: critical / high / moderate / low | După |
| --- | --- | --- |
| Dependențe de producție, `--omit=dev` | 4 / 11 / 13 / 0 (**28 pachete**) | 0 / 0 / 0 / 0 (**0 pachete**) |
| Toate dependențele, inclusiv build/test | 7 / 51 / 27 / 7 (**92 pachete**) | 0 / 12 / 2 / 0 (**14 pachete**, exclusiv dev) |

Cele 15 pachete high/critical din primul rând corespund la **41 advisories high/critical distincte**. Același advisory poate afecta mai multe pachete; `express` și `primeng` sunt marcate prin dependențe afectate, fără advisory propriu în acest raport. Numărul de pachete și numărul de advisories nu trebuie însumate. Severitățile sunt cele din raportul npm, nu recalculate din CVSS.

`--omit=dev` clasifică arborele de instalare, nu codul efectiv executat: AngularFire include schematics în `dependencies`, iar Firebase include și Firestore/Realtime Database, deși aplicația importă numai App și Auth. Aceste căi sunt diferențiate mai jos și au fost incluse în remediere. Cele 14 pachete dev rămase provin din numai două advisories sursă, detaliate la final.

## Versiuni rezolvate

| Pachet / grup | Înainte | După |
| --- | --- | --- |
| Framework Angular | 19.2.19 | 20.3.33 |
| CLI / build-angular | 19.2.14 | 20.3.37 |
| Angular SSR | 19.2.19 | 20.3.37 |
| Angular CDK | 19.2.18 | 20.2.14 |
| AngularFire | 19.2.0 | 20.1.0 |
| Firebase direct | 12.8.0 | 11.10.0, aliniat cu AngularFire |
| Firebase intern AngularFire | 11.10.0 | Aceeași versiune 11.10.0, deduplicată la root |
| PrimeNG | 19.1.3 | 20.4.0 |
| Temă Lara | `@primeng/themes` 19.1.3 | `@primeuix/themes` 1.2.5 |
| Angular FontAwesome | 1.0.0 | 2.0.1 |
| Express | 4.21.2 | 4.22.3 |
| proxy-addr | 2.0.7 | 2.0.8 |
| Swiper | 11.2.10 | 12.2.0 |
| TypeScript | 5.8.3 | 5.9.3 |
| RxJS | 7.8.2 | 7.8.2 |
| Zone.js | 0.15.1 | 0.15.1 |
| path-to-regexp | 0.1.12 | 0.1.13 |
| qs | 6.13.0 | 6.16.0 |
| protobufjs | 7.5.4 | 7.6.6 |
| @grpc/grpc-js | 1.9.15 | 1.13.6, nested în `@firebase/firestore` |
| websocket-driver | 0.7.4 | 0.7.5 |
| fast-uri | 3.0.6 | 3.1.8 |
| picomatch | 4.0.2 | 4.0.4 |
| piscina, dev | 4.8.0 | 5.3.2 |
| webpack-dev-middleware, dev | 7.4.2, nested în build-angular | 7.4.6 |
| sharp, dev | 0.34.5 | 0.35.5 |
| source-map-js, dev | 1.2.1 | 1.2.2 |

Versiunile sunt cele rezolvate în lockfile, nu limitele `^`/`~` din manifest. Pot exista copii suplimentare ale unor utilitare pe alte căi; inventarul auditului verifică toate nodurile afectate, nu doar versiunea de la root.

## Alegerea versiunilor și migrarea

Angular 19 nu mai primește suport; Angular 20 este o treaptă compatibilă cu release-ul stabil AngularFire 20.1.0, ale cărui peer dependencies cer Angular `^20.0.0`. Framework-ul 20.3.33 și CLI/SSR 20.3.37 includ patch-urile necesare și permit actualizarea secvențială 19 → 20. PrimeNG 20.4.0 și Angular FontAwesome 2.0.1 sunt aliniate aceleiași versiuni majore. Conform [calendarului Angular](https://angular.dev/reference/releases), **LTS pentru Angular 20 se încheie la 28 noiembrie 2026**: următoarea migrare la o linie suportată trebuie planificată înainte de acea dată, cu verificarea compatibilității AngularFire.

Firebase este aliniat la 11.10.0, versiunea deja folosită de AngularFire înaintea schimbării. Copia directă 12.8.0 nu era importată de aplicație, care accesează App/Auth prin AngularFire. Eliminarea dublării nu reprezintă un downgrade al SDK-ului folosit efectiv de autentificare. Auditul include și tranzitivele acestei versiuni; acestea au fost actualizate în lockfile.

Migrațiile oficiale Angular core, CLI și CDK au fost rulate. Au mutat importul `DOCUMENT`, provider-ul de server rendering, modul de rezoluție TypeScript și valorile implicite de generare. Migrarea opțională la application builder nu a fost executată: proiectul păstrează builder-ele `browser` și `server` și `CommonEngine`; schimbarea sistemului de build rămâne în **TASK-131**. Tema este în continuare Lara, prin pachetul `@primeuix/themes`. Manifestul cere Node `^22.12.0 || ^24.0.0`.

Trei rezoluții explicite sunt identice în `overrides` (npm) și `resolutions` (Yarn), pentru a păstra fixurile pe ambele căi de instalare:

| Rezoluție | Motiv și limită |
| --- | --- |
| `@grpc/grpc-js: 1.13.6` | Firebase Firestore fixează seria `~1.9.0`, afectată de advisories de crash/autorizare. Rezoluția trece la o versiune minoră patch-uită din majorul 1; aplicația nu importă Firestore. Se reevaluează când dependența upstream își actualizează intervalul. |
| `piscina: 5.3.2` | Angular build 20.3.37 fixează 5.2.0. Rezoluția aduce remedierea gadgeturilor de prototype pollution în același major 5 folosit de noul builder. Este dependență de build. |
| `webpack-dev-middleware: 7.4.6` | Angular build fixează 7.4.2; patch-ul remediază path traversal, fără trecerea la alt major. Este dependență de development server. |

Actualizarea `sharp` 0.35.5 remediază advisories din bibliotecile native de procesare a imaginilor. Nu s-au folosit `--force` sau `--legacy-peer-deps` pentru ocolirea compatibilității Angular.

## Condiții de exploatare și utilizarea în aplicație

Evaluarea de accesibilitate de mai jos este o analiză statică a aplicației inițiale. „Nu s-a identificat o cale” nu înseamnă dovadă de inexploatabilitate și nu înlocuiește actualizarea.

| Grup | Condiție și dovadă în proiect |
| --- | --- |
| **A — SSR URL / header** | `src/server.ts` folosește `CommonEngine.render` și construiește URL-ul paginii din request, după redirectul către hostul canonic. Serviciile din `src/app/service/` folosesc baza API absolută din environment, iar parametrii ID sunt codificați. Nu s-a identificat un request SSR către un URL arbitrar furnizat de vizitator. Nu s-a verificat filtrarea proxy-ului din producție. Pentru SSRF/header injection, condițiile upstream includ URL-uri relative sau construite din headere nevalidate; middleware-ul propriu nu justifică păstrarea versiunii vulnerabile. |
| **B — SSR HTML / serializare** | `property-details.component.html` afișează descrierea proprietății prin `[innerHTML]`. `PhoneLinkPipe` apelează `DomSanitizer.sanitize` înainte de `bypassSecurityTrustHtml`; prin urmare HTML-ul din API ajunge în parserul SSR. Pentru DoS pe DOCTYPE incomplet, sanitizarea însăși este o cale relevantă. Nu s-a demonstrat că un vizitator anonim poate modifica descrierea. Bugurile XSS de serializare necesită markup-ul specific din advisory; existența pipe-ului nu dovedește nici exploatarea, nici imunitatea. |
| **C — Router SSR** | `src/server.ts` trimite rutele GET către Angular, iar `app.routes.ts` folosește routerul inclusiv pentru pagina 404. URL-ul public este input pentru parser. DoS-ul prin chei numerice în parametri matrix este relevant dacă proxy-ul transmite acești parametri; această filtrare nu este confirmată. Timeout-ul de render nu remediază epuizarea heap-ului sau blocarea sincronă a event loop-ului. |
| **D — Hydration / HTTP transfer cache** | `app.config.ts` activează `provideClientHydration(withEventReplay())` și HTTP client. Cache-ul Angular este deci relevant, distinct de cache-ul HTML propriu din `src/ssr-cache.ts`. Interceptorul adaugă tokenul Firebase numai în browser; nu s-au găsit opțiuni `withCredentials` sau `credentials` în requesturile aplicației. Nu s-a demonstrat scurgere de date private, coliziune controlată sau DOM clobbering, dar versiunile cu defectele respective trebuie înlocuite. |
| **E — Formatări / i18n** | Nu s-au găsit utilizări de `formatDate`, `digitsInfo`, pipe-uri date/number/currency/percent cu formate controlate extern sau markeri `i18n` în sursele aplicației. `CommonModule` este importat de login/admin, dar importul singur nu confirmă condiția de atac. Advisories rămân aplicabile versiunilor framework-ului. |
| **F — Swiper** | `under-the-mountain.component.ts` și componentele `see-the-area*` definesc opțiunile Swiper în cod; nu combină un obiect JSON de configurare furnizat de utilizator. Advisory-ul prototype pollution necesită intrare malițioasă în operația de extindere a opțiunilor și, în PoC-ul publicat, modificarea prealabilă a prototipului Array. Nu s-a identificat această cale în aplicație. |
| **G — Express** | `path-to-regexp` este folosit de Express. Configurația vulnerabilă documentată implică minimum trei parametri în același segment; `src/server.ts` definește regexp-uri, `/assets` și `*`, fără acel model. Express rămâne serverul public și trebuie actualizat împreună cu `qs` / `body-parser`; aceste două pachete au și advisories moderate în raportul inițial. |
| **H — Tooling instalat ca producție** | `@angular/fire` → `@angular-devkit/schematics` / `@schematics/angular` → `@angular-devkit/core` → `ajv` → `fast-uri`, respectiv `picomatch`. Host confusion / URI parsing și glob ReDoS ar necesita input extern ajuns în aceste API-uri. Nu există importuri din ele în `src/`; utilizarea lor este în schematics/build. Sunt prezente și pe căi dev, nu sunt endpointuri SSR identificate. |
| **I — Firebase Firestore / protobuf / gRPC** | Lockfile-ul include `@firebase/firestore` → `@grpc/grpc-js` / `@grpc/proto-loader` → `protobufjs`. `src/` importă `@angular/fire/app` și `@angular/fire/auth`, fără Firestore, gRPC sau încărcare de scheme protobuf externe. Code execution din protobuf necesită schemă/descriptor neîncredere încărcat în generator; alte advisories implică mesaje, opțiuni sau recursie malițioase. Nu s-a identificat o astfel de intrare în aplicație. |
| **J — Firebase Database / WebSocket** | `@firebase/database` → `faye-websocket` → `websocket-driver`; există și o cale dev prin `sockjs`. Aplicația nu importă Realtime Database și serverul Express nu configurează un server WebSocket. Advisory-ul critic privește cadre din variante vechi ale protocolului WebSocket cu lungimi malițioase. Nu s-a identificat această cale în runtime-ul aplicației. |

Condițiile A, B, C, F, G, I și J au fost verificate și în [advisory-ul Angular SSR](https://github.com/angular/angular-cli/security/advisories/GHSA-x288-3778-4hhx), [parserul HTML SSR](https://github.com/angular/angular/security/advisories/GHSA-f67j-2jqw-jpq7), [routerul SSR](https://github.com/angular/angular/security/advisories/GHSA-ff3f-86qr-9cv3), [Swiper](https://github.com/nolimits4web/swiper/security/advisories/GHSA-hmx5-qpq5-p643), [path-to-regexp](https://github.com/advisories/GHSA-37ch-88jc-xwx2), [protobufjs](https://github.com/advisories/GHSA-xq3m-2v4x-88gg) și [websocket-driver](https://github.com/advisories/GHSA-xv26-6w52-cph6). Celelalte rânduri din inventar păstrează referințele exacte furnizate de npm pentru verificare.

## Inventar complet high/critical din arborele de producție inițial

Fiecare rând reprezintă un advisory sursă distinct, nu severitatea propagată la pachetele părinte. Coloana „grup” trimite la condițiile și limitele de mai sus. Intervalele sunt cele raportate pentru ramura instalată; pagina advisory-ului poate lista suplimentar alte ramuri afectate.

| Pachet și versiune inițială | Advisory sursă | Severitate | Interval afectat | Grup |
| --- | --- | --- | --- | --- |
| `@angular/common` 19.2.19 | [GHSA-48r7-hpm6-gfxm](https://github.com/advisories/GHSA-48r7-hpm6-gfxm) — @angular/common: Denial of Service (DoS) via OOM in Date Formatting (formatDate) | high | `<=19.2.25` | E |
| `@angular/common` 19.2.19 | [GHSA-39pv-4j6c-2g6v](https://github.com/advisories/GHSA-39pv-4j6c-2g6v) — @angular/common: Weak 32-Bit Cache Key Hashing in `HttpTransferCache` Leading to Cross-Request Data Leakage and State Poisoning | high | `<=19.2.25` | D |
| `@angular/common` 19.2.19 | [GHSA-p3vc-36g9-x9gr](https://github.com/advisories/GHSA-p3vc-36g9-x9gr) — @angular/common: Denial of Service (DoS) via OOM in Number Formatting (digitsInfo) | high | `>=19.0.0-next.0 <19.2.23` | E |
| `@angular/common` 19.2.19 | [GHSA-q6f4-qqrg-jv6x](https://github.com/advisories/GHSA-q6f4-qqrg-jv6x) — @angular/common: Information Leak via Default Caching of Credentialed Requests in HttpTransferCache | high | `>=19.0.0-next.0 <19.2.23` | D |
| `@angular/common` 19.2.19 | [GHSA-jhpw-976m-542j](https://github.com/advisories/GHSA-jhpw-976m-542j) — Angular: Cache-Key Ambiguity in HttpTransferCache Leading to Cross-Request Response Reuse and State Poisoning | high | `<=19.2.25` | D |
| `@angular/compiler` 19.2.19; `@angular/core` 19.2.19 | [GHSA-g93w-mfhg-p222](https://github.com/advisories/GHSA-g93w-mfhg-p222) — Angular vulnerable to XSS in i18n attribute bindings | high | `>=19.0.0-next.0 <19.2.20` | E |
| `@angular/compiler` 19.2.19; `@angular/core` 19.2.19 | [GHSA-jj27-h5hq-8x99](https://github.com/advisories/GHSA-jj27-h5hq-8x99) — Angular i18n: Cross-Site Scripting (XSS) via event-handler attributes | high | `<=19.2.25` | E |
| `@angular/core` 19.2.19 | [GHSA-rgjc-h3x7-9mwg](https://github.com/advisories/GHSA-rgjc-h3x7-9mwg) — Angular Client Hydration DOM Clobbering & Response-Cache Poisoning | high | `<=19.2.25` | D |
| `@angular/platform-server` 19.2.19 | [GHSA-45q2-gjvg-7973](https://github.com/advisories/GHSA-45q2-gjvg-7973) — Angular: SSRF via protocol-relative and backslash URLs in Angular Platform-Server | high | `>=19.0.0-next.0 <19.2.21` | A |
| `@angular/platform-server` 19.2.19 | [GHSA-gxx4-3xcv-f8qx](https://github.com/advisories/GHSA-gxx4-3xcv-f8qx) — @angular/platform-server: Missing `&lt;noscript&gt;` Raw-Text Serialization Escaping leads to Cross-Site Scripting (XSS) in Angular SSR | high | `>=19.0.0-next.0 <19.2.25` | B |
| `@angular/platform-server` 19.2.19 | [GHSA-hqr9-c56f-3x7f](https://github.com/advisories/GHSA-hqr9-c56f-3x7f) — @angular/platform-server: Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting') | high | `>=19.0.0-next.0 <19.2.25` | B |
| `@angular/platform-server` 19.2.19 | [GHSA-xrxm-cp7j-8xf6](https://github.com/advisories/GHSA-xrxm-cp7j-8xf6) — @angular/platform-server: URL Parser Differential leading to SSRF Allowlist Bypass | high | `>=19.0.0-next.0 <19.2.23` | A |
| `@angular/platform-server` 19.2.19 | [GHSA-rfh7-fxqc-q52v](https://github.com/advisories/GHSA-rfh7-fxqc-q52v) — @angular/platform-server: SSRF via Hostname Hijacking | high | `>=19.0.0-next.0 <19.2.22` | A |
| `@angular/platform-server` 19.2.19 | [GHSA-vpx6-8pjr-4g3v](https://github.com/advisories/GHSA-vpx6-8pjr-4g3v) — Angular SSR: Missing Fallback Raw-Content Serialization Escaping leads to Cross-Site Scripting (XSS) | high | `<=19.2.25` | B |
| `@angular/platform-server` 19.2.19 | [GHSA-v3p8-whq6-r5jg](https://github.com/advisories/GHSA-v3p8-whq6-r5jg) — Angular: SSR XSS via Unescaped &lt;template&gt; Content Across DocumentFragment Boundaries in Fallback Raw-Content Elements | high | `<=19.2.25` | B |
| `@angular/platform-server` 19.2.19 | [GHSA-f6mr-pjwc-34m4](https://github.com/advisories/GHSA-f6mr-pjwc-34m4) — Angular: SSRF and Cross-Origin Credential Disclosure via URL Resolution Discrepancy in SSR | high | `<=19.2.25` | A |
| `@angular/platform-server` 19.2.19 | [GHSA-f67j-2jqw-jpq7](https://github.com/advisories/GHSA-f67j-2jqw-jpq7) — Angular SSR: Denial of Service (DoS) via Infinite Loop on Malformed DOCTYPE | high | `<=19.2.25` | B |
| `@angular/platform-server` 19.2.19 | [GHSA-j3r3-mxqp-r2p4](https://github.com/advisories/GHSA-j3r3-mxqp-r2p4) — Angular SSR: XSS via Unescaped Processing Instruction (&lt;?...?&gt;) Nodes in Fallback Raw-Content Elements | high | `<=19.2.25` | B |
| `@angular/router` 19.2.19 | [GHSA-ff3f-86qr-9cv3](https://github.com/advisories/GHSA-ff3f-86qr-9cv3) — Angular Server-Side Rendering (SSR): Denial of Service via Numeric URL Matrix Parameters | high | `<=19.2.25` | C |
| `@angular/ssr` 19.2.19 | [GHSA-x288-3778-4hhx](https://github.com/advisories/GHSA-x288-3778-4hhx) — Angular SSR is vulnerable to SSRF and Header Injection via request handling pipeline | critical | `<19.2.21` | A |
| `@grpc/grpc-js` 1.9.15 | [GHSA-5375-pq7m-f5r2](https://github.com/advisories/GHSA-5375-pq7m-f5r2) — @grpc/grpc-js: A malformed request can cause a server crash | high | `<1.9.16` | I |
| `@grpc/grpc-js` 1.9.15 | [GHSA-99f4-grh7-6pcq](https://github.com/advisories/GHSA-99f4-grh7-6pcq) — @grpc/grpc-js: An incoming malformed compressed message can cause a client or server crash | high | `<1.9.16` | I |
| `@grpc/grpc-js` 1.9.15 | [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) — @grpc/grpc-js: In certain configurations, getAuthContext can return unauthorized certificates as though they were authorized | high | `<1.13.6` | I |
| `fast-uri` 3.0.6 | [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) — fast-uri vulnerable to host confusion via literal backslash authority delimiter | high | `>=3.0.0 <=3.1.3` | H |
| `fast-uri` 3.0.6 | [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) — fast-uri vulnerable to host confusion via backslash authority introducer | high | `>=3.0.0 <3.1.5` | H |
| `fast-uri` 3.0.6 | [GHSA-q3j6-qgpj-74h6](https://github.com/advisories/GHSA-q3j6-qgpj-74h6) — fast-uri vulnerable to path traversal via percent-encoded dot segments | high | `>=3.0.0 <=3.1.0` | H |
| `fast-uri` 3.0.6 | [GHSA-v39h-62p7-jpjc](https://github.com/advisories/GHSA-v39h-62p7-jpjc) — fast-uri vulnerable to host confusion via percent-encoded authority delimiters | high | `>=3.0.0 <=3.1.1` | H |
| `fast-uri` 3.0.6 | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) — fast-uri vulnerable to server-side request forgery via malformed IPv6 normalization | high | `>=3.0.0 <3.1.6` | H |
| `fast-uri` 3.0.6 | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) — fast-uri vulnerable to host confusion via percent-encoded scheme normalization | high | `>=3.0.0 <3.1.6` | H |
| `fast-uri` 3.0.6 | [GHSA-4c8g-83qw-93j6](https://github.com/advisories/GHSA-4c8g-83qw-93j6) — fast-uri vulnerable to host confusion via failed IDN canonicalization | high | `>=3.0.0 <3.1.3` | H |
| `fast-uri` 3.0.6 | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) — fast-uri vulnerable to authority injection via an unvalidated port in serialize | high | `>=3.0.0 <3.1.7` | H |
| `path-to-regexp` 0.1.12 | [GHSA-37ch-88jc-xwx2](https://github.com/advisories/GHSA-37ch-88jc-xwx2) — path-to-regexp vulnerable to Regular Expression Denial of Service via multiple route parameters | high | `<0.1.13` | G |
| `picomatch` 4.0.2 | [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) — Picomatch has a ReDoS vulnerability via extglob quantifiers | high | `>=4.0.0 <4.0.4` | H |
| `protobufjs` 7.5.4 | [GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg) — Arbitrary code execution in protobufjs | critical | `<7.5.5` | I |
| `protobufjs` 7.5.4 | [GHSA-66ff-xgx4-vchm](https://github.com/advisories/GHSA-66ff-xgx4-vchm) — protobuf.js: Code injection through bytes field defaults in generated toObject code | high | `<=7.5.5` | I |
| `protobufjs` 7.5.4 | [GHSA-75px-5xx7-5xc7](https://github.com/advisories/GHSA-75px-5xx7-5xc7) — protobuf.js: Code generation gadget after prototype pollution | high | `<=7.5.5` | I |
| `protobufjs` 7.5.4 | [GHSA-jvwf-75h9-cwgg](https://github.com/advisories/GHSA-jvwf-75h9-cwgg) — protobuf.js: Process-wide denial of service through unsafe option paths | high | `<=7.5.5` | I |
| `protobufjs` 7.5.4 | [GHSA-685m-2w69-288q](https://github.com/advisories/GHSA-685m-2w69-288q) — protobuf.js: Denial of service through unbounded protobuf recursion | high | `<=7.5.5` | I |
| `protobufjs` 7.5.4 | [GHSA-wcpc-wj8m-hjx6](https://github.com/advisories/GHSA-wcpc-wj8m-hjx6) — protobufjs: Denial of service through unbounded Any expansion during JSON conversion | high | `<=7.6.0` | I |
| `swiper` 11.2.10 | [GHSA-hmx5-qpq5-p643](https://github.com/advisories/GHSA-hmx5-qpq5-p643) — Prototype pollution in swiper | critical | `>=6.5.1 <12.1.2` | F |
| `websocket-driver` 0.7.4 | [GHSA-xv26-6w52-cph6](https://github.com/advisories/GHSA-xv26-6w52-cph6) — websocket-driver: Message corruption via abuse of protocol length headers | critical | `<0.7.5` | J |

## Remedieri suplimentare identificate la auditul din 6 octombrie

Repetarea auditului a semnalat încă două versiuni afectate, care nu apăreau în inventarul inițial. Acestea au fost actualizate prin patch-uri tranzitive compatibile cu intervalele deja declarate, fără noi overrides. Data observării în audit nu reprezintă data publicării vulnerabilității; inventarul istoric de 41 advisories de mai sus rămâne cel al raportului inițial.

| Pachet și remediere | Condiții și utilizare în proiect |
| --- | --- |
| `proxy-addr` 2.0.7 → **2.0.8**, critical, [GHSA-jqcg-44mw-7w3h](https://github.com/jshttp/proxy-addr/security/advisories/GHSA-jqcg-44mw-7w3h) | Afectează `>=1.1.0 <2.0.8`. Unele subrețele IPv6 configurate ca proxy-uri de încredere pot ajunge să accepte orice adresă IPv4. Astfel, un client poate falsifica IP-ul interpretat din `X-Forwarded-For`. Pachetul este tranzitiv de producție prin Express, dar `src/server.ts` nu configurează `trust proxy`, iar sursele nu folosesc `req.ip` / `req.ips` pentru autorizare ori limitare. Nu s-a identificat condiția de exploatare în aplicație. Advisory-ul maintainerului este publicat la 15 septembrie 2026; patch-ul a fost aplicat și pentru această cale neactivată. |
| `source-map-js` 1.2.1 → **1.2.2**, high, [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | Afectează `>=1.0.0 <1.2.2`. Procesarea unor source maps indexate malițioase, cu offseturi enorme sau secțiuni imbricate, poate consuma excesiv CPU/memorie. În lockfile este exclusiv dev, prin `source-map-loader`, PostCSS și Sass; nu există importuri ori apeluri `SourceMapConsumer` / `SourceNode` în `src/`. Riscul privește procesarea inputului de build din surse neîncredere, nu un endpoint SSR identificat. [Release-ul 1.2.2](https://github.com/7rulnik/source-map-js/releases/tag/v1.2.2) și [fixul maintainerului](https://github.com/7rulnik/source-map-js/pull/79), din 30 septembrie 2026, documentează remedierea. |

Ambele versiuni remediate sunt confirmate în lockfile-urile sincronizate npm/Yarn. Auditul final de producție raportează zero alerte pe ambele căi. Repetarea validării bundle-ului după aceste ultime patch-uri este consemnată în secțiunea de verificări.

## Advisories rămase: exclusiv tooling

Auditul complet raportează două advisories sursă, propagate la 14 pachete dev. Auditul cu `--omit=dev` nu raportează niciun advisory. Nu s-a acceptat o excepție pentru un high/critical din arborele de producție.

| Advisory și versiune instalată | Expunere, remediere și urmărire |
| --- | --- |
| [`braces` 3.0.3 — GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), high | Pattern-uri brace foarte adânci pot epuiza stiva. Advisory-ul publicat nu oferă versiune remediată. În acest proiect apare în globbing/watch/build/test prin Karma, Chokidar, Micromatch și Webpack dev server; nu este importat în `src/` și este exclus din arborele de producție. Nu trebuie furnizate pattern-uri de build din surse neîncredere, iar development serverul nu trebuie expus public. Reevaluare la apariția unui patch upstream și la TASK-131; schimbarea builder-ului singură nu garantează eliminarea căii Karma. |
| [`uuid` 8.3.2 — GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), moderate | Defectul privește metodele v3/v5/v6 cu buffer extern insuficient. Copia instalată este folosită de SockJS din Webpack dev server. `sockjs/lib/transport.js` importă `uuid.v4` și îl apelează fără buffer, deci această utilizare nu atinge API-ul afectat descris. Fixul upstream există în 11.1.1+, însă depășește majorul cerut de SockJS. Nu s-a introdus un override major pentru această cale dev; se reevaluează la actualizarea SockJS/tooling. |

Cele 12 pachete marcate high sunt `@angular-devkit/build-angular`, `@angular-devkit/build-webpack`, `@angular/build`, `braces`, `chokidar`, `fast-glob`, `http-proxy-middleware`, `karma`, `karma-jasmine`, `karma-jasmine-html-reporter`, `micromatch` și `webpack-dev-server`. Cele două moderate sunt `uuid` și `sockjs`. Sugestiile automate de downgrade la build-angular 0.1002.1 / Karma 4 nu sunt o migrare compatibilă cu aplicația și nu au fost aplicate.

## Validarea finală și limita de deploy

Rezultatele finale din 6 octombrie sunt de mai jos. Build-urile, auditurile, instalarea curată și verificările HTTP/browser includ ultimele patch-uri `proxy-addr` / `source-map-js` și corecțiile PrimeNG descrise mai jos. Un audit fără alerte nu constituie garanție pentru absența oricărei vulnerabilități.

| Verificare | Rezultat și acoperire |
| --- | --- |
| Audit final | **0 pachete de producție** la npm și Yarn; auditul complet npm raportează **14 pachete dev**: 12 high și 2 moderate, din cele două advisories documentate. |
| Build browser de producție | **PASS**, Angular 20, hash `fce5eaa323d07bde`, 6 octombrie. Persistă avertismentele Sass `@import` și bugetele de stil existente; pragurile nu au fost relaxate. |
| Build SSR | **PASS**, hash `7f5943c040a80ac0`, 6 octombrie, după ultimele patch-uri și adaptarea `CommonEngine`. |
| Teste Angular | **106/106 PASS**, ChromeHeadless 154; repetate după corecțiile finale. |
| Teste unitare SSR | **26/26 PASS**, repetate pe starea finală. |
| Contracte HTTP SSR | **116 răspunsuri verificate, PASS** pe bundle-ul final și instalarea curată Yarn de producție: cache, GET/HEAD/304, redirecturi, headere de securitate, rute private, 404/503, `Retry-After`, canonical/H1 pentru cele 24 de rute sitemap și navigarea către proprietăți. Sunt incluse hosturile permise, respingerea hostului necunoscut, headere forwarded ostile și o rută cu parametri matrix numerici. Dovezile locale sunt în `%TEMP%/hai-in-sat-ssr-cache-j1lkS9`. |
| Yarn curat, numai producție | **PASS** pentru `yarn install --frozen-lockfile --production=true`, inclusiv scripturile de instalare, într-un director nou (`.task132-runtime-final`): 74 s, `proxy-addr` 2.0.8 instalat, lockfile identic octet cu octet cu cel din checkout. Toate cele **116 verificări HTTP PASS** au fost repetate pe acest runtime final. |
| Completitudinea lockfile-ului Yarn | Confirmată după ultimele patch-uri: **1.070 intrări / 1.350 pattern-uri**, fără dependențe / optional dependencies lipsă și fără integrități lipsă; sunt incluse variantele pentru alte platforme. Toate cele **49 de versiuni directe** coincid cu npm. |
| Sharp | **PASS** pentru decodare AVIF, redimensionare și codare PNG; asset-urile proiectului nu au fost regenerate. |
| Review independent | Review-ul inițial și cel incremental după corecții nu au identificat blocante rămase. |
| Browser și aspect responsive | **44 verificări PASS**, 50 de capturi comparate cu build-ul Angular 19, fără eșecuri și fără erori JavaScript. Măsurătorile elementelor urmărite coincid în toate cele 50 de capturi; rezultatele și limitele comparației sunt detaliate mai jos. |

Angular 20 impune validarea hostului în `CommonEngine`: fără lista explicită a hostului canonic și a adreselor locale de test, răspunsul poate reveni la HTML fără randarea aplicației. Testele verifică prezența H1 în HTML, nu doar statusul 200. De asemenea, calea de render normalizează slash-urile inițiale pentru a păstra răspunsul rutelor precum `//login`; clasificarea pentru cache și rutele private folosește în continuare calea originală.

Comparația cu Angular 19 a identificat două regresii PrimeNG 20 și a ghidat corecțiile: `p-dataView` primește `display: block` pe host, deoarece mutarea stilurilor pe elementul custom lăsa un contur fragmentat și modifica înălțimea listei cu 38 px; cele 13 instanțe `p-button` din patru template-uri transmit explicit `buttonProps.autofocus: false`, pentru a evita autofocusul nativ aplicat implicit de noua componentă. Stilurile de focus pentru navigarea cu tastatura sunt păstrate.

| Viewport, Chrome 154.0.8037.98 | Verificări funcționale finale | Erori JavaScript |
| --- | --- | --- |
| Desktop, 1.440 × 1.000 px | **14/14 PASS** | 0 |
| Mobil, 390 × 844 px | **15/15 PASS** | 0 |
| Mobil îngust, 320 × 740 px | **15/15 PASS** | 0 |

Comparația înainte/după a confirmat **50/50 măsurători identice ale elementelor urmărite** și **49/50 capturi cu dimensiuni identice**. Singura modificare de dimensiune este `desktop-area-choice.png`: lățimea totală scade de la 1.456 la 1.440 px, eliminând depășirea orizontală preexistentă pe desktop. Pentru cele 49 de capturi comparabile, proporția maximă de pixeli modificați este **0,2006%**; detectorul numără pixelii la care diferența pe cel puțin un canal RGB depășește 8/255. Aceste rezultate susțin păstrarea aspectului în scenariile verificate, fără a pretinde imagini identice pixel cu pixel.

Inspecția vizuală a listei de proprietăți pe desktop/mobil, a modalului de contact, meniului, paginii de contact și paginii de alegere a zonei a confirmat păstrarea structurii. Diferențele reziduale includ focusul verde Lara pe primul input din dialog, umbre/randarea fonturilor și o deplasare verticală de aproximativ 5 px în meniu. Nu s-a observat overflow nou. La viewport-ul de 320 px, pagina de alegere a zonei păstrează lățimea preexistentă de 369 px; testul nu certifică absența overflow-ului în întregul site.

Testele browser folosesc API și Firebase Auth simulate local, inclusiv răspunsuri de autentificare și salvare; ele validează interacțiunile frontend, fără să confirme autentificarea cu un cont real sau scrierea în backend-ul de producție. Comparația include navigare, filtre/paginare, detalii/galerie, formulare, meniu mobil și Swiper-ul din `under-the-mountain` (butoane și drag/touch). Selectorul listă/grid și header-ul/footer-ul cardului `see-the-area` lipsesc și în baseline-ul Angular 19, din cauza importului `PrimeTemplate` absent. Prin urmare, nu se revendică acoperirea acelor controale ori a Swiper-ului imbricat inaccesibil prin butoanele Cumpără/Închiriază. Aceste limitări preexistente nu au fost extinse ca scop al actualizării dependențelor.

Pentru reproducerea comparației, se construiesc bundle-urile browser și SSR în checkout-ul indicat prin `--root`, apoi se rulează din frontend:

```text
node scripts/test-browser-regression.cjs --root <build> --out <evidence> --baseline <baseline>
```

`<baseline>` este directorul dovezilor Angular 19, cu `report.json` și capturile corespunzătoare. Pentru generarea lui se folosește aceeași comandă fără `--baseline`, pe build-ul vechi. Scriptul folosește Chrome instalat local și Playwright rezolvat din directorul de tooling al workspace-ului (ori prin `NODE_PATH`), fără adăugarea Playwright în dependențele aplicației. Raportul final al acestei rulări este `.task132-browser-final/report.json` din rădăcina workspace-ului, lângă capturile PNG; acestea sunt artefacte locale în afara repo-ului, nu fișiere incluse în PR.

Configurația actuală de încărcare în App Engine exclude sursele și `angular.json`, păstrând `dist/`, `package.json` și `yarn.lock`. Totuși, manifestul conține scriptul `build`, fără dezactivarea explicită a build-ului din cloud. [Comportamentul implicit App Engine](https://docs.cloud.google.com/appengine/docs/standard/nodejs/running-custom-build-step) poate declanșa acel build fără fișierele necesare. Aceasta este problema de packaging identificată separat: **TASK-132 nu o remediază și nu certifică pregătirea pentru deploy**.

Deploy-ul și promovarea în producție rămân manuale, în sarcina owner-ului.
