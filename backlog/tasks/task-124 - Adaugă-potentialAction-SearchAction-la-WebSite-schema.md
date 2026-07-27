---
id: TASK-124
title: Adaugă potentialAction SearchAction la WebSite schema
status: To Do
assignee: []
created_date: '2026-05-07 08:02'
updated_date: '2026-07-27'
labels:
  - seo
  - schema
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`WebSite` schema curentă din `src/index.html` este minimală — doar `@type`, `name`, `url`, `description`, `inLanguage`, `publisher`. Adăugarea unui `potentialAction` `SearchAction` face site-ul ELIGIBIL pentru „sitelinks search box" în Google SERP (un input de search dedicat sub rezultatul brand-ului).

Precondiție: trebuie să existe o rută reală de căutare care primește un query string (ex: `/properties?q=horezu`).

## Cum

1. **Implementează filtrul `?q=` pe `/properties` — plan concret (stare verificată 2026-07-06):** componenta citește deja `page`/`size`/`type` din queryParams (`properties.component.ts:159-176`), iar backend-ul filtrează după `type` — dar NU există căutare text (nici în backend). La ~14 anunțuri, NU are rost un endpoint nou: când `q` e prezent, adu TOATE proprietățile (endpoint public existent `GET /get-all-properties`, folosit deja de generate-sitemap) și filtrează client-side, case-insensitive și fără diacritice, pe `name` + `description` (refolosește `removeDiacritics` din `src/app/utils/slug.util.ts`); combină cu filtrul `type` existent și afișează fără paginare (sau paginare client-side). Fără `q`, comportamentul actual rămâne neschimbat.
2. În `src/index.html`, blocul `WebSite` JSON-LD (liniile 84–98), adaugă:

```json
"potentialAction": {
  "@type": "SearchAction",
  "target": {
    "@type": "EntryPoint",
    "urlTemplate": "https://hai-în-sat.ro/properties?q={search_term_string}"
  },
  "query-input": "required name=search_term_string"
}
```

3. **Input de căutare pe `/properties` — OBLIGATORIU (decizie 2026-07-27), nu optional.** Un `<input>` simplu deasupra listei, cu buton/submit care face `router.navigate([], { queryParams: { q: valoare }, queryParamsHandling: 'merge' })`. Motivul pentru care nu e optional: `SearchAction` declara catre Google ca site-ul ARE cautare. Daca singura cale de a ajunge la `?q=` e sa scrii URL-ul de mana, declaratia e goala si vizitatorul care vine din sitelinks search box aterizeaza pe o pagina fara camp de cautare.

   Fara stilizare elaborata — un input, un buton, textul „Caută", consecvent cu tema Lara.

## Ce NU intra in scope

- **Endpoint de cautare in backend.** La ~14 anunturi nu are rost; filtrarea e client-side, pe rezultatul lui `GET /get-all-properties` (endpoint public, deja folosit de `generate-sitemap.js`).
- **Paginare peste rezultatele filtrate.** Cand `q` e prezent, afiseaza toate rezultatele intr-o singura lista.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/index.html` (JSON-LD `WebSite`, liniile 84–98)
- `src/app/properties/properties.component.ts` (calea REALĂ — nu există folder `components/`; citește `queryParams.q`, filtrare client-side)
- `src/app/service/property-form-service/property-form-service.service.ts` (metodă de fetch-all dacă lipsește în frontend)

## Efort

3-4 ore (JSON-LD + filtru + input).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare — pipeline-ul se opreste la PR, fara deploy.

1. Google Rich Results Test (https://search.google.com/test/rich-results) pe `https://hai-în-sat.ro/` — schema `WebSite` cu `SearchAction`, fara erori.
2. Sitelinks search box apare in SERP doar daca brandul e destul de cunoscut — poate sa nu apara niciodata, si asta NU inseamna ca implementarea e gresita.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/index.html`, blocul JSON-LD `WebSite` (azi liniile 84-98), contine `potentialAction` cu `"@type": "SearchAction"`, `target` de tip `EntryPoint` cu `urlTemplate: "https://hai-în-sat.ro/properties?q={search_term_string}"` si `"query-input": "required name=search_term_string"`
- [ ] #2 `urlTemplate` foloseste forma **unicode IDN** a domeniului (`hai-în-sat.ro`), consecvent cu restul `index.html` si cu decizia din TASK-128
- [ ] #3 `src/app/properties/properties.component.ts` citeste `queryParams.q` in acelasi loc unde citeste deja `page`/`size`/`type` (azi liniile 159-176)
- [ ] #4 Cand `q` e prezent: componenta aduce TOATE proprietatile prin endpoint-ul public `GET /get-all-properties` si filtreaza client-side pe campurile `name` si `description`, case-insensitive si FARA diacritice — refolosind `removeDiacritics` din `src/app/utils/slug.util.ts`, nu o reimplementare
- [ ] #5 Filtrul `q` se combina cu filtrul `type` existent (ambele active simultan produc intersectia)
- [ ] #6 Cand `q` LIPSESTE, comportamentul actual (paginare prin API) ramane exact cum e — nicio regresie pe fluxul normal
- [ ] #7 `/properties` are un camp de cautare vizibil care seteaza `?q=` in URL prin `router.navigate` cu `queryParamsHandling: 'merge'` (ca sa nu piarda `type`)
- [ ] #8 NU se adauga endpoint de cautare in backend — repo-ul Java nu e atins de acest task
- [ ] #9 Exista spec pentru functia de filtrare, cu cel putin un caz care demonstreaza insensibilitatea la diacritice (ex. cautarea „valcea" gaseste un anunt care contine „Vâlcea")
- [ ] #10 Implementatorul a rulat protocolul SSR local si a lipit in `## Implementation Notes`: `curl -s http://localhost:4000/ | grep -o 'SearchAction'` returneaza o potrivire, iar `curl -s "http://localhost:4000/properties?q=horezu"` randeaza o lista filtrata (nu toate anunturile)
- [ ] #11 `npx ng test --watch=false --browsers=ChromeHeadless` trece
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid, neimplementat. index.html:84-98 WebSite schema nu are potentialAction/SearchAction. /properties suporta acum filtrare pe ?type=house|land (backend, implementat recent), dar NU pe ?q= text liber (necesar pt SearchAction). De adaugat schema + citirea queryParams.q in properties.component.ts.
Revizuire 2026-07-27 (pregatire pentru pipeline). Ambiguitati eliminate:
1. Punctul 3 („optional, UX") era exact genul de fork care il face pe agent sa se opreasca sau sa aleaga aleator → input-ul devine OBLIGATORIU, cu motivul scris.
2. AC-ul vechi #4 spunea „poate fi simplu — substring in nume sau locatie", desi descrierea cerea `name` + `description` fara diacritice — doua specificatii diferite in acelasi task. Aliniate pe varianta din descriere.
3. AC-ul vechi #3 (Google Rich Results Test) cere productie → mutat in `## Verificare post-deploy (owner)`.
4. Adaugata precizarea ca `urlTemplate` foloseste forma unicode IDN, consecvent cu TASK-128.
<!-- SECTION:NOTES:END -->
