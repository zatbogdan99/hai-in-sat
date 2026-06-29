---
id: TASK-MANUAL-4
title: Creează Google Business Profile și citations românești
status: To Do
assignee: []
created_date: '2026-06-12 16:17'
updated_date: '2026-06-12 16:17'
labels:
  - seo
  - local
  - external
  - marketing
dependencies:
  - TASK-52
documentation:
  - ../../../../seo-audit-2026-06-12/findings/local.md
  - ../../../../seo-audit-2026-06-12/findings/backlinks.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Auditul local (findings/local.md, scor 28/100): **niciun semn de Google Business Profile** — zero embed Maps, zero link „direcții", zero recenzii. Fără GBP verificat, „Hai în Sat" e invizibilă în Local Pack (primele 3 rezultate cu hartă) pentru „agenție imobiliară Horezu", „case de vânzare Horezu" etc. — factorul #1 de ranking local. Profilul de backlinks e și el inexistent (Common Crawl: domeniu absent din graful web) — profilurile pe portaluri sunt cele mai rapide link-uri + citations simultan.

**Depinde de TASK-52** (NAP unificat): NU începe înscrierile cu două telefoane în circulație — fiecare citation greșit e de 10× mai greu de corectat decât de creat.

Task non-cod (extern), dar trackuit aici ca să nu se piardă. Pașii detaliați + lista completă prioritizată: `findings/local.md` și `findings/backlinks.md`.

## Cum

1. **Google Business Profile** (prioritate absolută): creează/revendică la business.google.com — nume EXACT „Hai în Sat", categorie principală „Agenție imobiliară", adresa Str. Tudor Vladimirescu, Horezu 245800 (decide: cu adresă vizibilă sau Service Area Business pe cele 6 comune), telefon oficial, site `https://hai-în-sat.ro`, program, descriere 750 caractere cu termenii locali, 10+ fotografii reale (sediu + proprietăți + zonă). Verificare (carte poștală/video/telefon — cum oferă Google).
2. **Bing Places** — import direct din GBP (5 minute după #1).
3. **Profiluri portaluri imobiliare cu link**: Storia.ro (profil agenție), Imobiliare.ro, OLX (cont business imobiliare) — listările existente legate de profil.
4. **Citations RO generaliste**: Facebook Page completă (NAP în About), listafirme.ro, firme.info, paginiaurii.ro — NAP identic caracter cu caracter.
5. **Recenzii**: după verificarea GBP, cere primele 3–5 recenzii de la clienți reali (link direct de review trimis pe WhatsApp după fiecare vizionare/tranzacție). Răspunde la fiecare recenzie.
6. **Pe site**: după verificare, adaugă pe /contact-us link „Vezi pe Google Maps" + embed hartă GBP; adaugă URL-ul GBP în `sameAs` din RealEstateAgent (index.html).
7. Documentează toate conturile/login-urile create (unde, cu ce email) în implementation notes.

## Fișiere afectate

- extern (GBP, Bing, portaluri, directoare)
- minor pe site după: `src/index.html` (sameAs), componenta contact-us (embed + link Maps)

## Efort

M ca timp de lucru (3–4 ore inițial) + așteptare verificare GBP (zile–săptămâni). Recenziile: proces continuu.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GBP creat și VERIFICAT, categorie „Agenție imobiliară", cu NAP identic cu site-ul (TASK-52), program, descriere și ≥10 fotografii reale
- [ ] #2 Căutarea „Hai în Sat Horezu" pe Google arată profilul în panoul lateral/hartă
- [ ] #3 Bing Places activ (importat din GBP)
- [ ] #4 Profiluri de agenție active pe minimum 2 portaluri (Storia/Imobiliare.ro/OLX) cu link spre site și NAP corect
- [ ] #5 Minimum 3 citations generaliste RO create (Facebook About complet, listafirme.ro, încă una) — NAP identic peste tot
- [ ] #6 Primele 3 recenzii Google reale primite și cu răspuns
- [ ] #7 Site-ul leagă GBP: link/embed pe /contact-us + URL-ul profilului în `sameAs` din JSON-LD RealEstateAgent
- [ ] #8 Inventar al tuturor conturilor create (platformă, URL profil, email folosit) documentat în implementation notes
<!-- AC:END -->
