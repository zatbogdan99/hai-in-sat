---
id: TASK-MANUAL-6
title: 'Deploy backend min_instances:1 + heap fix (cold-start)'
status: To Do
assignee: []
created_date: '2026-06-29'
labels:
  - manual
  - infra
  - backend
  - deploy
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
⚠️ ACȚIUNE MANUALĂ OWNER (Cloud Shell / consola Google Cloud) — NU se rulează prin pipeline.

Decizie owner (2026-06): backend-ul (`hai-in-sat-api`, F2) primește `min_instances: 1` ca să elimine cold start-ul de ~11 s (cauza erorilor 5xx tratate în TASK-47). Cost asumat: ~$30/lună. Plus fix de heap (`-Xmx512m` scos) ca să nu apară OOM-restart care ar reintroduce cold start-ul.

Config-ul corect e gata, ca referință, în repo la `java.hai-in-sat/hai-in-sat/app-backend.yaml`. Aplică-l în Cloud Shell (`~/hai-in-sat/app-backend.yaml`) și deployează:

```
gcloud app deploy app-backend.yaml --project=hai-in-sat-api
```
(`--project=hai-in-sat-api` EXPLICIT obligatoriu — altfel GAE deployează în proiectul activ.)

Cele 2 schimbări față de configul vechi:
- `automatic_scaling.min_instances: 0 → 1`
- `entrypoint: java -Xmx512m -jar ...` → `java -jar ...` (heap-ul îl gestionează `MaxRAMPercentage=75` ≈ 384 MB, cu headroom pentru non-heap).

Codul lui TASK-47 (timeout + error handler SSR) e deja livrat (PR #3); asta e DOAR partea de infra rămasă.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `app-backend.yaml` deployat cu `min_instances: 1` (GCP Console → App Engine `hai-in-sat-api` → Instances arată ≥1 instanță mereu activă)
- [ ] #2 `entrypoint` fără `-Xmx512m` (heap gestionat de `MaxRAMPercentage`); fără warning-uri „Exceeded soft memory limit" în Cloud Logging
- [ ] #3 După deploy: paginile `/property/*` răspund 200 la primul request „la rece" al zilei (fără cold-start 5xx)
<!-- AC:END -->
