# Ordinea de executie a task-urilor

**Urmatorul task: TASK-123 — Schema RealEstateAgent.**

**Actualizare 2026-11-01 (analiza backlog-ului fata de cod, cu owner-ul):**

- **Inchise:**
  - TASK-121: doar partea JSON-LD; breadcrumb-ul vizibil nu se mai face, decizie owner.
  - TASK-122: implementat.
  - TASK-124 si TASK-128: mutate in `wont-do/` in [PR #27](https://github.com/zatbogdan99/hai-in-sat/pull/27).
- **Livrate in afara ordinii numerice, la cererea utilizatorului:**
  - TASK-133 … TASK-138, in [PR #28](https://github.com/zatbogdan99/hai-in-sat/pull/28);
  - TASK-139 … TASK-143, in [PR #29](https://github.com/zatbogdan99/hai-in-sat/pull/29).

  TASK-143 a mutat paginile publice pe cai in romana (`/proprietati`, `/oltenia-de-sub-munte`, `/satul-lunii`, `/gaseste-mi-locul`). Task-urile ramase folosesc deja caile noi.
- **TASK-132:** a ramas cum era (decizia din 2026-10-04): implementat si verificat la 2026-10-06, livrat in [PR #25](https://github.com/zatbogdan99/hai-in-sat/pull/25), fara deploy.

Ordinea ramasa: **TASK-123 → TASK-125 → TASK-126 → TASK-127 → TASK-129 → TASK-130 → TASK-131**. Regula stabilita la renumerotarea din 2026-07-27 ramane valabila: numarul mai mic se implementeaza inainte de numarul mai mare, iar un task nou cerut explicit de utilizator poate trece in fata.

Task-urile din `backlog/tasks/` folosesc seria **TASK-101 … TASK-143**. Campul `dependencies` ramane plasa de siguranta; singurul task deschis cu dependente e TASK-131, iar toate dependentele lui sunt livrate.

Intervalul 101+ a fost ales ca sa nu se ciocneasca cu nimic din `completed/`, `manual/` sau `wont-do/`, unde numerele vechi isi pastreaza intelesul.

## Ordinea

| Nou | Vechi | Task | Grup | Stare |
| --- | --- | --- | --- | --- |
| TASK-101 | TASK-64 | Curata codul mort din frontend | curatenie care deblocheaza restul | livrat |
| TASK-102 | TASK-49 | Sterge stub scripts + dependente moarte | ⬐ | livrat |
| TASK-103 | TASK-51 | TypeScript stable in package.json | ⬐ | livrat |
| TASK-104 | TASK-39 | Spec-uri stale + script `test:ci` | ⬐ | livrat |
| TASK-105 | TASK-52 | Cleanup AppComponent | ⬐ | livrat |
| TASK-106 | TASK-41 | Rename servicii (`ServiceService`) | ⬑ | livrat |
| TASK-107 | TASK-34 | API base URL → `environment.apiBaseUrl` | servicii / API frontend | livrat |
| TASK-108 | TASK-8 | PhotoAdminService pe `baseUrl` HTTPS | ⬐ | livrat |
| TASK-109 | TASK-35 | LoggerService (scoate `console.*`) | ⬐ | livrat |
| TASK-110 | TASK-48 | Type guard pe `prop.type` | ⬐ | livrat |
| TASK-111 | TASK-37 | AuthGuard cu `authStateReady()` | ⬐ | livrat |
| TASK-112 | TASK-40 | Sterge endpoint-ul `/debug` (multi-repo) | ⬑ | wont-do |
| TASK-113 | TASK-4 | Redirect 301 www→apex, http→https | `server.ts` / infra | livrat |
| TASK-114 | TASK-6 | Security headers + CSP-Report-Only | ⬐ | livrat |
| TASK-115 | TASK-10 | 404 real + noindex pe rutele admin | ⬐ | livrat |
| TASK-116 | TASK-11 | Cache pentru HTML-ul SSR | ⬐ | livrat |
| TASK-117 | TASK-5 | Cache imutabil pe bundle-urile cu hash | ⬑ | livrat |
| TASK-118 | TASK-19 | NAP / telefon oficial (helper `stripPhones`) | SEO markup | livrat |
| TASK-119 | TASK-21 | Structura H1 | ⬐ | livrat |
| TASK-120 | TASK-23 | Link-uri interne crawlabile | ⬐ | livrat |
| TASK-132 | nou | Actualizare dependente frontend/SSR si remediere vulnerabilitati | dependinte | livrat, PR #25 |
| TASK-121 | TASK-30 | BreadcrumbList (doar JSON-LD) | SEO markup | inchis 2026-11-01 |
| TASK-122 | TASK-65 | `/info-page/:village` + igiena SEO | ⬐ | livrat |
| TASK-133 | nou | Footer simplificat | cereri owner, 2026-10 | livrat, PR #28 |
| TASK-134 | nou | Sterge `/about-us` (301 spre `/`) | ⬐ | livrat, PR #28 |
| TASK-135 | nou | Antet fix la scroll pe desktop | ⬐ | livrat, PR #28 |
| TASK-136 | nou | Autoplay in caruselul de sate | ⬐ | livrat, PR #28 |
| TASK-137 | nou | Tipografie unificata pentru paragrafe | ⬐ | livrat, PR #28 |
| TASK-138 | nou | Layout pagini de sat | ⬐ | livrat, PR #28 |
| TASK-139 | nou | Schelet de incarcare la carusel si galerii | ⬐ | livrat, PR #29 |
| TASK-140 | nou | Variante redimensionate pentru pozele satelor | ⬐ | livrat, PR #29 |
| TASK-141 | nou | Descriere centrata pe pagina anuntului | ⬐ | livrat, PR #29 |
| TASK-142 | nou | „Pastila pentru suflet” fara suprapunere cu footerul | ⬐ | livrat, PR #29 |
| TASK-143 | nou | URL-uri in romana cu 301 de la cele vechi | ⬑ | livrat, PR #29 |
| TASK-123 | TASK-28 | Schema RealEstateAgent (`areaServed` cu 9 locuri) | SEO markup | **urmatorul** |
| TASK-124 | TASK-27 | SearchAction + filtru `?q=` | ⬐ | wont-do |
| TASK-125 | TASK-29 | RealEstateListing — `datePosted` | ⬐ | de facut |
| TASK-126 | TASK-22 | `og:image` JPEG: implicit + cate unul pe sat | ⬐ | de facut |
| TASK-127 | TASK-16 | Favicon ICO real + PNG + apple-touch | ⬐ | de facut |
| TASK-128 | TASK-38 | `xmlEscape` in generate-sitemap | ⬐ | wont-do |
| TASK-129 | TASK-25 | `lastmod` real per URL (multi-repo) | ⬑ | de facut |
| TASK-130 | TASK-12 | Lazy routes + dependente moarte (reducere bundle) | mari, la final | de facut |
| TASK-131 | TASK-18 | Migrare builder `:browser` → `:application` | ⬑ | de facut |

## De ce exact aceasta ordine

1. **TASK-101 primul** fiindca sterge cod mort pe care alte patru task-uri (105, 106, 107, 109) ar fi trebuit altfel sa-l refactorizeze degeaba.
2. **TASK-104 devreme** ca sa faca gate-ul de teste real: pipeline-ul ruleaza suita la fiecare task, deci merita curatata inainte, nu dupa.
3. **Lantul `server.ts`** (113 → 114 → 115 → 116) e strict: redirect, apoi headere, apoi 404, apoi cache — exact ordinea middleware-urilor din fisier.
4. **TASK-130 inainte de TASK-131** fiindca lazy routes si scoaterea dependentelor moarte se fac mai sigur pe builder-ul actual, iar migrarea are apoi mai putin de mutat.
5. **TASK-131 ultimul** fiindca rescrie `server.ts` de la `CommonEngine` la `AngularNodeAppEngine` si trebuie sa re-aplice tot middleware-ul. Pe langa cel din 113, 114, 115 si 116, inventarul include acum:
   - redirecturile din TASK-134 si TASK-143;
   - `/csp-report`;
   - pagina 503;
   - regulile de cache static.

   Checklist-ul complet de re-aplicare e in criteriile lui de acceptare.

## Task-uri multi-repo

Un singur task deschis atinge si repo-ul backend (`zatbogdan99/hai-in-sat-api`), deci pipeline-ul creeaza branch in ambele si ruleaza ambele suite de teste: **TASK-129** (campul `updatedAt`). TASK-112 (stergerea endpoint-ului `/debug`) a ajuns in `wont-do/`.

## Atentie la referintele istorice

Notele de verificare mai vechi din unele task-uri contin referinte de forma `task-23`, `task-27`, `task-28`, cu litera mica. Acelea vin dintr-o numerotare si mai veche, dinaintea acestui backlog, si **nu corespund niciunui task actual** — au fost marcate ca atare in text. Referintele reale, actuale, sunt scrise intotdeauna cu majuscule: `TASK-1xx`.
