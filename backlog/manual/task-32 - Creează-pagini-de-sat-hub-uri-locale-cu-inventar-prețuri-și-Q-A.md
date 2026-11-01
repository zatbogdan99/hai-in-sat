---
id: TASK-32
title: Creează pagini de sat — hub-uri locale cu inventar, prețuri și Q&A
status: To Do
assignee: []
created_date: '2026-06-12 16:13'
updated_date: '2026-11-01'
labels:
  - seo
  - content
  - local
  - sxo
  - strategy
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/sxo.md
  - ../../../../seo-audit-2026-06-12/findings/local.md
  - ../../../../seo-audit-2026-06-12/findings/geo.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

## De ce e MANUAL (decizie owner, 2026-07-27)

NU se ruleaza prin pipeline. Motiv: valoarea task-ului E continutul — ≥600 de cuvinte UNICE per sat, cu preturi orientative €/mp, distante, utilitati disponibile in zona si Q&A local. Sunt informatii de teren pe care un agent nu le poate verifica si le-ar fabrica; preturi inventate publicate pe site sunt o problema de business, nu doar de SEO. AC#7 (similaritate <40 0ntre pagini) confirma ca partea grea nu e codul.

**Daca vrei sa recuperezi partea de cod pentru pipeline:** taie un task de schelet — rutele `/sate` si `/sate/:slug`, componentele standalone, meta/canonical/breadcrumbs prin `SeoService`, galeria din `PhotoService` (exista deja imagini per localitate), intrarile in `STATIC_PAGES` din `generate-sitemap.js` — cu textele ca placeholder marcat clar. Scrierea continutului ramane aici.

## Stare 2026-11-01: scheletul există, lipsește conținutul

Partea de cod din „Dacă vrei să recuperezi partea de cod” e în mare parte livrată:
- există `/sate/:slug` pentru 7 sate: horezu, polovragi, baia-de-fier, vaideeni, slatioara, costesti, barbatesti (`src/app/utils/villages.ts`, componenta `InfoPageComponent`);
- fiecare pagină are title, meta description, canonical, `BreadcrumbList`, exact un `h1` cu numele satului și galerie din `PhotoService`, cu poze redimensionate (TASK-140) și schelet de încărcare (TASK-139);
- paginile sunt în `sitemap.xml` și `llms.txt`, iar `/oltenia-de-sub-munte` are un carusel cu link real spre fiecare sat;
- slug-ul unui sat necunoscut dă 404.

Ce lipsește:
- **conținutul:** textele de azi sunt narative (istorie, tradiții), fără inventar, prețuri, date practice sau Q&A;
- **lista de anunțuri pe sat:** depinde de câmpul `village` din TASK-31;
- **conținutul paginii-hub.** **DECIS de owner (2026-11-01): hub-ul e `/oltenia-de-sub-munte`**, care listează deja toate satele și e în meniu. NU se creează o rută nouă `/sate`. Tabelul de prețuri pe sat și link-urile spre sate se adaugă pe `/oltenia-de-sub-munte`;
- **Cerna:** are anunțuri, dar nu are pagină de sat;
- **schema `Place` cu `geo`:** încă neadăugată.

## De ce — OPORTUNITATEA #1 din analiza SERP a auditului

Analiza SERP backwards (findings/sxo.md): pe interogările generice („case de vânzare Vâlcea") domină portalurile (OLX/Storia/Imobiliare.ro) — nebătabile frontal. DAR pe **long-tail local** („teren de vânzare Vaideeni", „case de vânzare Baia de Fier") concurența e slabă: Storia are ~9 terenuri în Horezu, 6 case în Baia de Fier, zero conținut editorial local. O pagină-sat cu 600+ cuvinte + inventar + date practice poate intra în top 10 în 3–5 luni — exact unde agenția ARE inventar real.

Azi nu există NICIO pagină de localitate; anunțurile sunt izolate semantic (Google nu înțelege contextul geografic). Și pentru SEO local (findings/local.md), paginile de locație sunt factorul #1 organic.

Wireframe complet pentru pagina-sat ideală: în `findings/sxo.md`.

## Cum

1. **Rute** (FĂCUT pentru `/sate/:slug`, cu 7 sate: horezu, polovragi, baia-de-fier, vaideeni, slatioara, costesti, barbatesti; lipsește cerna). Hub-ul e `/oltenia-de-sub-munte` (decizie owner 2026-11-01), deci nu se adaugă `/sate`. Componente standalone + SSR meta complet (title „Case și terenuri de vânzare în {Sat} — {Județ} | Hai în Sat", canonical, breadcrumbs).
2. **Conținutul unei pagini-sat** (≥600 cuvinte UNICE per sat — nu template umplut cu sinonime; regula 60%+ conținut unic):
   - Intro despre sat (2-3 paragrafe: poziționare, specific, de ce să te muți acolo);
   - **Anunțurile active din sat** (filtrare după localitate — necesită câmp `village`/`locality` pe proprietate, vezi TASK-31);
   - **Date practice**: utilități disponibile în zonă, acces (DN67 etc.), distanțe (Râmnicu Vâlcea, Tg. Jiu, Transalpina), școală/dispensar unde există;
   - **Prețuri orientative**: interval €/mp teren intravilan/extravilan în sat + data actualizării — pe hub-ul `/oltenia-de-sub-munte` un TABEL agregat „Preț mediu pe sat în Oltenia de sub Munte (actualizat: {luna an})" — magnetul de citare AI din findings/geo.md (G4);
   - **Q&A** (3–5 întrebări cu răspunsuri self-contained de 40–60 cuvinte: „Cât costă un teren în Vaideeni?", „Are utilități?", „Cât e până la Râmnicu Vâlcea?") — formatul extras de AI Overviews/Perplexity. FĂRĂ schema FAQPage pentru rich results (restricție Google 2023; opțional doar ca beneficiu LLM);
   - Foto din sat (există deja în `PhotoService` pentru mai multe sate!), hartă, link-uri spre anunțuri + breadcrumb.
3. **Linking intern bidirecțional**: anunț → pagina satului („Despre Vaideeni") și pagina satului → anunțuri; meniu → `/oltenia-de-sub-munte` (există deja). Link-uri REALE `<a href>` (TASK-120).
4. **Sitemap**: FĂCUT pentru hub și cele 7 pagini de sat; satele noi se adaugă explicit în `STATIC_PAGES` și `src/llms.txt`.
5. Schema per pagină-sat: `Place` cu `geo` + `containedInPlace` (opțional, beneficiu entity), BreadcrumbList obligatoriu.
6. Începe cu 3–4 sate unde există inventar real (Vaideeni, Baia de Fier, Polovragi, Horezu) — restul după.

## Fișiere afectate

- `src/app/info-page/*` (componenta existentă a paginilor de sat), `src/app/utils/villages.ts` (lista de sate) și `src/app/under-the-mountain/*` (hub-ul `/oltenia-de-sub-munte`: tabelul de prețuri)
- Filtrarea anunțurilor pe sat: cere câmpul `village` pe proprietate — **definit de TASK-31** (nu-l re-defini aici); până există, filtrare client-side la 14 anunțuri e pragmatică (heuristic pe nume, marcat explicit ca provizoriu)
- `scripts/generate-sitemap.js` și `src/llms.txt` — paginile de sat și hub-ul sunt deja listate; se adaugă doar satele noi (de ex. Cerna)
- `src/app/service/seo.service.ts`
- Foto per sat: EXISTĂ deja liste statice de imagini per localitate în `src/app/service/photo-service.ts` (Horezu, Costești etc., din `assets/`) — refolosește-le pentru galeria paginii de sat

Verificat 2026-07-06: nu exista nicio rută de localitate. **Depășit 2026-11-01:** rutele `/sate/:slug` există (vezi „Stare 2026-11-01”); conținutul lor e încă narativ, fără inventar, prețuri sau Q&A.

## Efort

L (3–5 zile dezvoltare + scrierea conținutului; conținutul e partea grea — poate fi livrat incremental, sat cu sat).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hub-ul `/oltenia-de-sub-munte` are tabelul de prețuri pe sat, cu data actualizării vizibilă, iar minimum 4 pagini `/sate/:slug` au conținutul nou
- [ ] #2 Fiecare pagină-sat are ≥600 cuvinte unice (verificabil cu crawler-ul de audit), title/canonical/meta description/breadcrumbs proprii și exact 1 H1 cu numele satului
- [ ] #3 Fiecare pagină-sat listează anunțurile active din satul respectiv (cu fallback elegant „momentan nu avem anunțuri în X — vezi satele vecine" + link-uri)
- [ ] #4 Secțiune Q&A cu minimum 3 întrebări/răspunsuri self-contained (40–60 cuvinte) per sat
- [ ] #5 Linking intern: fiecare anunț are link `<a href>` spre pagina satului său și invers; hub-ul `/oltenia-de-sub-munte` e linkat din navigație (deja adevărat)
- [ ] #6 Paginile sunt în sitemap cu lastmod real și răspund 200 în HTML brut SSR cu tot conținutul
- [ ] #7 Conținutul NU e template duplicat: similaritate <40% între oricare două pagini-sat (diff manual pe secțiunile descriptive)
- [ ] #8 Tabelul de prețuri are proces de actualizare definit (lunar — cine/cum, documentat în implementation notes)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Actualizare 2026-11-01 (analiza backlog-ului față de cod): scheletul de cod e livrat pentru 7 sate (rute, SEO, sitemap, llms.txt, galerii). Rămân conținutul, lista de anunțuri pe sat (după TASK-31), hub-ul, Cerna și schema `Place`. Owner-ul a decis ca hub-ul să fie `/oltenia-de-sub-munte`, fără rută nouă `/sate`; descrierea și AC #1/#5 au fost adaptate.
<!-- SECTION:NOTES:END -->
