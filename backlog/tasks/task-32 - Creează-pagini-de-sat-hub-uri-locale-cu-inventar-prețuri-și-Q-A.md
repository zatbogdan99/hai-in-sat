---
id: TASK-32
title: Creează pagini de sat — hub-uri locale cu inventar, prețuri și Q&A
status: To Do
assignee: []
created_date: '2026-06-12 16:13'
updated_date: '2026-07-06'
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
## De ce — OPORTUNITATEA #1 din analiza SERP a auditului

Analiza SERP backwards (findings/sxo.md): pe interogările generice („case de vânzare Vâlcea") domină portalurile (OLX/Storia/Imobiliare.ro) — nebătabile frontal. DAR pe **long-tail local** („teren de vânzare Vaideeni", „case de vânzare Baia de Fier") concurența e slabă: Storia are ~9 terenuri în Horezu, 6 case în Baia de Fier, zero conținut editorial local. O pagină-sat cu 600+ cuvinte + inventar + date practice poate intra în top 10 în 3–5 luni — exact unde agenția ARE inventar real.

Azi nu există NICIO pagină de localitate; anunțurile sunt izolate semantic (Google nu înțelege contextul geografic). Și pentru SEO local (findings/local.md), paginile de locație sunt factorul #1 organic.

Wireframe complet pentru pagina-sat ideală: în `findings/sxo.md`.

## Cum

1. **Rute noi**: `/sate` (index/hub) + `/sate/:slug` pentru cele 6 localități: horezu, vaideeni, costesti, polovragi, baia-de-fier, cerna. Componente standalone + SSR meta complet (title „Case și terenuri de vânzare în {Sat} — {Județ} | Hai în Sat", canonical, breadcrumbs).
2. **Conținutul unei pagini-sat** (≥600 cuvinte UNICE per sat — nu template umplut cu sinonime; regula 60%+ conținut unic):
   - Intro despre sat (2-3 paragrafe: poziționare, specific, de ce să te muți acolo);
   - **Anunțurile active din sat** (filtrare după localitate — necesită câmp `village`/`locality` pe proprietate, vezi TASK-31);
   - **Date practice**: utilități disponibile în zonă, acces (DN67 etc.), distanțe (Râmnicu Vâlcea, Tg. Jiu, Transalpina), școală/dispensar unde există;
   - **Prețuri orientative**: interval €/mp teren intravilan/extravilan în sat + data actualizării — pe `/sate` (index) un TABEL agregat „Preț mediu pe sat în Oltenia de sub Munte (actualizat: {luna an})" — magnetul de citare AI din findings/geo.md (G4);
   - **Q&A** (3–5 întrebări cu răspunsuri self-contained de 40–60 cuvinte: „Cât costă un teren în Vaideeni?", „Are utilități?", „Cât e până la Râmnicu Vâlcea?") — formatul extras de AI Overviews/Perplexity. FĂRĂ schema FAQPage pentru rich results (restricție Google 2023; opțional doar ca beneficiu LLM);
   - Foto din sat (există deja în `PhotoService` pentru mai multe sate!), hartă, link-uri spre anunțuri + breadcrumb.
3. **Linking intern bidirecțional**: anunț → pagina satului („Despre Vaideeni") și pagina satului → anunțuri; homepage/footer → `/sate`. Link-uri REALE `<a href>` (TASK-23).
4. **Sitemap**: include `/sate` + cele 6 pagini (TASK-25 va prelua automat dacă generatorul citește rutele statice — adaugă-le explicit).
5. Schema per pagină-sat: `Place` cu `geo` + `containedInPlace` (opțional, beneficiu entity), BreadcrumbList obligatoriu.
6. Începe cu 3–4 sate unde există inventar real (Vaideeni, Baia de Fier, Polovragi, Horezu) — restul după.

## Fișiere afectate

- `src/app/app.routes.ts` + componente noi `src/app/sate/*` (convenția repo-ului: componentele stau direct în `src/app/<nume>/`)
- Filtrarea anunțurilor pe sat: cere câmpul `village` pe proprietate — **definit de TASK-31** (nu-l re-defini aici); până există, filtrare client-side la 14 anunțuri e pragmatică (heuristic pe nume, marcat explicit ca provizoriu)
- `scripts/generate-sitemap.js` — adaugă `/sate` + paginile de sat în `STATIC_PAGES` (liniile 14-23)
- `src/app/service/seo.service.ts`
- Foto per sat: EXISTĂ deja liste statice de imagini per localitate în `src/app/service/photo-service.ts` (Horezu, Costești etc., din `assets/`) — refolosește-le pentru galeria paginii de sat

Verificat 2026-07-06: afirmațiile din task despre starea curentă sunt corecte — nu există nicio rută/pagină de localitate, iar `village-of-the-month`/`info-page` nu țin loc de pagini-sat (conținut narativ, fără inventar/prețuri/Q&A).

## Efort

L (3–5 zile dezvoltare + scrierea conținutului; conținutul e partea grea — poate fi livrat incremental, sat cu sat).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Există `/sate` (hub cu tabelul de prețuri pe sat + data actualizării vizibilă) și minimum 4 pagini `/sate/:slug` live
- [ ] #2 Fiecare pagină-sat are ≥600 cuvinte unice (verificabil cu crawler-ul de audit), title/canonical/meta description/breadcrumbs proprii și exact 1 H1 cu numele satului
- [ ] #3 Fiecare pagină-sat listează anunțurile active din satul respectiv (cu fallback elegant „momentan nu avem anunțuri în X — vezi satele vecine" + link-uri)
- [ ] #4 Secțiune Q&A cu minimum 3 întrebări/răspunsuri self-contained (40–60 cuvinte) per sat
- [ ] #5 Linking intern: fiecare anunț are link `<a href>` spre pagina satului său și invers; `/sate` e linkat din navigație sau footer
- [ ] #6 Paginile sunt în sitemap cu lastmod real și răspund 200 în HTML brut SSR cu tot conținutul
- [ ] #7 Conținutul NU e template duplicat: similaritate <40% între oricare două pagini-sat (diff manual pe secțiunile descriptive)
- [ ] #8 Tabelul de prețuri are proces de actualizare definit (lunar — cine/cum, documentat în implementation notes)
<!-- AC:END -->
