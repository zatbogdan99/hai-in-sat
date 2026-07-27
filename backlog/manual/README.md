# Task-uri MANUALE (owner)

NU se ruleaza prin pipeline-ul de cod. Scoase din `backlog/tasks/` ca sa nu fie alese din greseala de pipeline.

Doua familii de task-uri traiesc aici:

1. **TASK-MANUAL-1..6** — actiuni pur externe ale owner-ului: registrar/DNS, Google Search Console, Bing Webmaster, Google Business Profile, masuratori PageSpeed, outreach link-building, deploy backend.
2. **Task-uri cu ID normal (TASK-3, 15, 24, 31, 32, 33)** — task-uri de cod care NU pot fi duse cap-coada de pipeline. Si-au pastrat ID-ul original ca sa nu se rupa referintele incrucisate din restul backlog-ului (`tasks/`, `completed/`). Motivele mutarii sunt scrise in fiecare task, in sectiunea „De ce e MANUAL".

## De ce sunt manuale (revizuire 2026-07-27, decizii owner)

| Task | Motiv |
| --- | --- |
| TASK-3 — migrare poze base64 → URL-uri reale | Cere migrare one-shot pe MongoDB de **productie**, cu backup inainte. Pipeline-ul nu atinge baza de date de prod. Deblocheaza TASK-126 AC „URL real", TASK-24 srcset, TASK-125 `image`. |
| TASK-15 — self-host fonturi Libre Baskerville | Cere descarcarea fisierelor `.woff2` de pe internet (google-webfonts-helper). Agentii ruleaza sandboxed, fara garantie de retea. |
| TASK-24 — optimizare imagini (alt/dimensiuni/lazy/srcset) | `srcset` depinde de variantele din TASK-3; alt-ul retroactiv = data entry pe 14 anunturi × ~10 poze. |
| TASK-31 — sablon anunt 300+ cuvinte | Cere date reale de produs (pret, suprafata, utilitati, situatie juridica, distante) + completare retroactiva a inventarului. Agentii le-ar inventa. |
| TASK-32 — pagini de sat `/sate` | Cere continut real: preturi €/mp per sat, distante, utilitati, Q&A local. 600+ cuvinte unice per sat, din cunoastere de teren. |
| TASK-33 — blog `/articole` | Idem: continut editorial real, plan de publicare asumat de owner. |

**Daca vrei sa readuci unul in pipeline:** taie partea de cod intr-un task nou (rute, componente, campuri de model, formular admin, schema, sitemap, fallback-uri) si lasa aici doar partea de date/continut/infrastructura.

## Istoric

Nota 2026-07-06: TASK-MANUAL-1 (domeniul ASCII — cost neasumat momentan) si TASK-MANUAL-3 (PageSpeed baseline — superseded de auditul 2026-06-12) au fost mutate in `backlog/wont-do/` — decizii owner.

Nota 2026-07-27: revizuire completa a backlog-ului pentru rulare prin pipeline. Cele 6 task-uri de mai sus au fost mutate aici; restul de 31 din `backlog/tasks/` au fost rescrise cu criterii de acceptare verificabile static, in repo (fara deploy). Verificarile care cer productie live au fost scoase din AC in sectiunea `## Verificare post-deploy (owner)` a fiecarui task — alea raman in sarcina ta, dupa merge si deploy.
