# Ordinea de executie a task-urilor

**Regula, de la renumerotarea din 2026-07-27: numarul mai mic se implementeaza inainte de numarul mai mare.**

Task-urile active din `backlog/tasks/` sunt numerotate **TASK-101 … TASK-131**, in ordinea in care trebuie rulate. Nu mai trebuie sa citesti dependentele ca sa stii ce urmeaza — ordinea e chiar numarul. Campul `dependencies` din front matter a ramas ca plasa de siguranta si arata intotdeauna spre numere mai mici.

Intervalul 101+ a fost ales ca sa nu se ciocneasca cu nimic din `completed/`, `manual/` sau `wont-do/`, unde numerele vechi isi pastreaza intelesul.

## Ordinea

| Nou | Vechi | Task | Grup |
| --- | --- | --- | --- |
| TASK-101 | TASK-64 | Curata codul mort din frontend | curatenie care deblocheaza restul |
| TASK-102 | TASK-49 | Sterge stub scripts + dependente moarte | ⬐ |
| TASK-103 | TASK-51 | TypeScript stable in package.json | ⬐ |
| TASK-104 | TASK-39 | Spec-uri stale + script `test:ci` | ⬐ |
| TASK-105 | TASK-52 | Cleanup AppComponent | ⬐ |
| TASK-106 | TASK-41 | Rename servicii (`ServiceService`) | ⬑ |
| TASK-107 | TASK-34 | API base URL → `environment.apiBaseUrl` | servicii / API frontend |
| TASK-108 | TASK-8 | PhotoAdminService pe `baseUrl` HTTPS | ⬐ |
| TASK-109 | TASK-35 | LoggerService (scoate `console.*`) | ⬐ |
| TASK-110 | TASK-48 | Type guard pe `prop.type` | ⬐ |
| TASK-111 | TASK-37 | AuthGuard cu `authStateReady()` | ⬐ |
| TASK-112 | TASK-40 | Sterge endpoint-ul `/debug` (multi-repo) | ⬑ |
| TASK-113 | TASK-4 | Redirect 301 www→apex, http→https | `server.ts` / infra |
| TASK-114 | TASK-6 | Security headers + CSP-Report-Only | ⬐ |
| TASK-115 | TASK-10 | 404 real + noindex pe rutele admin | ⬐ |
| TASK-116 | TASK-11 | Cache pentru HTML-ul SSR | ⬐ |
| TASK-117 | TASK-5 | Cache imutabil pe bundle-urile cu hash | ⬑ |
| TASK-118 | TASK-19 | NAP / telefon oficial (helper `stripPhones`) | SEO markup |
| TASK-119 | TASK-21 | Structura H1 | ⬐ |
| TASK-120 | TASK-23 | Link-uri interne crawlabile | ⬐ |
| TASK-121 | TASK-30 | Breadcrumbs vizibile | ⬐ |
| TASK-122 | TASK-65 | `/info-page/:village` + igiena SEO | ⬐ |
| TASK-123 | TASK-28 | Schema RealEstateAgent | ⬐ |
| TASK-124 | TASK-27 | SearchAction + filtru `?q=` | ⬐ |
| TASK-125 | TASK-29 | RealEstateListing — `datePosted` | ⬐ |
| TASK-126 | TASK-22 | `og-default.jpg` 1200×630 | ⬐ |
| TASK-127 | TASK-16 | Favicon ICO real + PNG + apple-touch | ⬐ |
| TASK-128 | TASK-38 | `xmlEscape` in generate-sitemap | ⬐ |
| TASK-129 | TASK-25 | `lastmod` real per URL (multi-repo) | ⬑ |
| TASK-130 | TASK-12 | Lazy routes / reducere bundle | mari, la final |
| TASK-131 | TASK-18 | Migrare builder `:browser` → `:application` | ⬑ |

## De ce exact aceasta ordine

1. **TASK-101 primul** fiindca sterge cod mort pe care alte patru task-uri (105, 106, 107, 109) ar fi trebuit altfel sa-l refactorizeze degeaba.
2. **TASK-104 devreme** ca sa faca gate-ul de teste real: pipeline-ul ruleaza suita la fiecare task, deci merita curatata inainte, nu dupa.
3. **Lantul `server.ts`** (113 → 114 → 115 → 116) e strict: redirect, apoi headere, apoi 404, apoi cache — exact ordinea middleware-urilor din fisier.
4. **TASK-131 ultimul** fiindca rescrie `server.ts` de la `CommonEngine` la `AngularNodeAppEngine` si trebuie sa re-aplice middleware-ul adaugat de 113, 114, 115 si 116. Checklist-ul de re-aplicare e in criteriile lui de acceptare.

## Task-uri multi-repo

Doua task-uri ating si repo-ul backend, deci pipeline-ul creeaza branch in ambele si ruleaza ambele suite de teste: **TASK-112** (stergerea endpoint-ului `/debug`) si **TASK-129** (campul `updatedAt`).

## Atentie la referintele istorice

Notele de verificare mai vechi din unele task-uri contin referinte de forma `task-23`, `task-27`, `task-28`, cu litera mica. Acelea vin dintr-o numerotare si mai veche, dinaintea acestui backlog, si **nu corespund niciunui task actual** — au fost marcate ca atare in text. Referintele reale, actuale, sunt scrise intotdeauna cu majuscule: `TASK-1xx`.
