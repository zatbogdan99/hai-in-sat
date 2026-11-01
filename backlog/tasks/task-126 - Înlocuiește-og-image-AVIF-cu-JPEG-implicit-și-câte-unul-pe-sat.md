---
id: TASK-126
title: 'Înlocuiește og:image AVIF cu JPEG: implicit și câte unul pe sat'
status: To Do
assignee: []
created_date: '2026-05-07 07:55'
updated_date: '2026-11-01'
labels:
  - seo
  - social
  - images
  - schema
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

Crawlerele Facebook / WhatsApp / Messenger (canalele dominante de descoperire imobiliară în România) nu afișează fiabil imagini AVIF în preview. Azi, aproape toate paginile publice declară un `og:image` AVIF (re-verificat 2026-11-01):

| Pagina | `og:image` azi | Unde |
|---|---|---|
| implicit (orice pagină care nu setează imaginea: `/proprietati`, `/satul-lunii`, `/gaseste-mi-locul`, 404) | `assets/poza_landing1.avif` | `src/index.html:17` și `:26` |
| `/` | `assets/poza_landing1.avif` | `new-landing-page.component.ts:18` |
| `/oltenia-de-sub-munte` | `assets/poza1_oltenia.avif` | `under-the-mountain.component.ts:153` |
| `/sate/:slug` | originalul AVIF al satului (1–7 MB, până la 6000 px) | `info-page.component.ts:397` |
| `/proprietati/:id/:slug` | **deja corect**: `assets/og-hai-in-sat.jpg` sau URL-ul http(s) al thumbnail-ului | `property-details.component.ts:25`, `:360-362` |

`src/index.html:18-19` declară și `og:image:width` 1200 / `og:image:height` 630, care nu se potrivesc cu niciunul dintre AVIF-uri.

`src/assets/og-hai-in-sat.jpg` există deja: JPEG 1200×630, 155 KB, folosit azi doar de pagina de anunț. Planul vechi („generează `og-default.jpg` din `poza_landing1.avif`”) nu mai e necesar.

## Cum (decizie owner 2026-11-01: JPEG propriu pe fiecare sat)

1. **Imaginea implicită:** `og-hai-in-sat.jpg` pentru `index.html` (`og:image` + `twitter:image`), `/` și `/oltenia-de-sub-munte`. Adaugă `<meta property="og:image:type" content="image/jpeg">` în `index.html`.
2. **Fallback în `SeoService.updatePageMeta`:** când `ogImage` lipsește sau e gol, setează `og:image` și `twitter:image` la URL-ul absolut al lui `og-hai-in-sat.jpg`. Azi, tag-ul nu e atins, deci rămâne cel din `index.html` (pe SSR) sau cel al paginii anterioare (la navigarea în aplicație). Constanta `SEO_FALLBACK_IMAGE` se mută din `property-details.component.ts` în `SeoService` (exportată) și e folosită din ambele locuri.
3. **Câte un JPEG pe sat:** `scripts/generate-village-images.js` (TASK-140) generează, pe lângă variantele AVIF, un JPEG **1200×630** (crop `cover`, centrat, `mozjpeg`, calitate ~80) pentru poza principală a fiecăruia dintre cele 7 sate (`data.photo` din `InfoPageComponent`: `horezu1`, `polovragi1`, `baia1`, `vaideeni1`, `slatioara1`, `costesti1`, `barbatesti1`). Fișierele merg în `src/assets/sate/` (de ex. `<nume>-og.jpg`), iar calea apare în manifestul `village-image-variants.ts` (de ex. câmpul `og`). Scriptul rămâne idempotent (`--force` le regenerează) și păstrează rotația EXIF (`.rotate()`).
4. **`/sate/:slug`** folosește JPEG-ul satului prin manifest (un helper în `src/app/utils/village-image.ts`, de ex. `villageOgImage(src)`), cu fallback la `og-hai-in-sat.jpg` dacă lipsește din manifest.

## Ce NU intră în scope

- **Poza reală a anunțului în `og:image`.** Depinde de TASK-3 (poze ca URL-uri reale, în `backlog/manual/`). Până atunci anunțurile rămân pe `og-hai-in-sat.jpg`, cum sunt azi.
- **Compozit cu brand** (logo + poză + preț). Task separat, dacă se dorește.
- `poza_landing1.avif` și `poza1_oltenia.avif` rămân pentru afișare și pentru `<link rel="preload">`; se schimbă doar meta tag-urile.

## Fișiere afectate

- `src/index.html` (liniile 17 și 26, plus `og:image:type`)
- `src/app/service/seo.service.ts` (fallback + constanta exportată)
- `src/app/property-details/property-details.component.ts` (doar importă constanta din `SeoService`; comportamentul nu se schimbă)
- `src/app/new-landing-page/new-landing-page.component.ts`, `src/app/under-the-mountain/under-the-mountain.component.ts`, `src/app/info-page/info-page.component.ts`
- `scripts/generate-village-images.js`, `src/app/service/village-image-variants.ts` (regenerat), `src/app/utils/village-image.ts`
- `src/assets/sate/*-og.jpg` (7 fișiere noi)

## Efort

S (2–3 ore).

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare.

Rulează **Facebook Sharing Debugger** (https://developers.facebook.com/tools/debug/) cu „Scrape Again” pe `https://hai-în-sat.ro/`, pe `/oltenia-de-sub-munte` și pe o pagină de sat (de ex. `/sate/horezu`). Trebuie să apară imaginea, iar pe pagina satului poza satului. Pe o pagină de anunț apare imaginea generică (așteptat până la TASK-3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/index.html`: `og:image` și `twitter:image` pointează spre `https://hai-în-sat.ro/assets/og-hai-in-sat.jpg`, iar `og:image:type` este `image/jpeg`. `git grep -n "\.avif" src/index.html` nu mai returnează nicio linie `og:image` / `twitter:image` (preload-ul AVIF poate rămâne)
- [ ] #2 `SeoService.updatePageMeta`: fără `ogImage` (sau cu string gol), `og:image` și `twitter:image` primesc URL-ul absolut al lui `og-hai-in-sat.jpg`. Constanta e exportată din `SeoService` și folosită și de `PropertyDetailsComponent`. Test unitar nou pentru fallback
- [ ] #3 `/` și `/oltenia-de-sub-munte` folosesc `og-hai-in-sat.jpg`. `git grep -n "ogImage: .*\.avif" src/app` nu returnează nimic
- [ ] #4 `npm run generate-village-images` generează câte un JPEG 1200×630 pentru fiecare dintre cele 7 sate. Implementatorul a lipit în `## Implementation Notes` ieșirea lui `node -e "..."` (sharp `metadata()`) pentru fiecare fișier: `jpeg 1200 630`, plus dimensiunea în KB (ținta: sub 300 KB fiecare)
- [ ] #5 `/sate/:slug` setează `og:image` și `twitter:image` la JPEG-ul satului respectiv (URL absolut, `https://hai-în-sat.ro/assets/sate/...jpg`), cu fallback la `og-hai-in-sat.jpg`. Test unitar pentru cel puțin un sat
- [ ] #6 Pagina de anunț păstrează comportamentul de azi (`og-hai-in-sat.jpg` sau URL-ul http(s) al thumbnail-ului); testul existent din `property-details.component.spec.ts` trece nemodificat
- [ ] #7 Implementatorul a rulat `npm run build` + SSR local (`backlog/docs/verificare-locala-ssr.md`) și a lipit `og:image` extras din `/`, `/oltenia-de-sub-munte`, `/sate/horezu` și `/proprietati`: niciunul nu e `.avif`
- [ ] #8 `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Mecanism implementat in cod - property-details.component.ts:126-131 cheama seo.updatePageMeta cu ogImage=prop.thumbnail, iar SeoService seteaza og:image + twitter:image, randate de SSR. CAVEAT: prop.thumbnail e adesea data-URL base64, pe care crawlerii social NU il pot incarca - pentru og:image real e nevoie de un URL public. Raman AC#2 (Facebook Debugger, extern) si AC#4 (min 1200x630 + fallback, neimplementat).

Cross-ref: AC nou adaugat reconciliaza referinta din TASK-3 (care listeaza TASK-126 ca deblocat de migrarea pozelor). Mecanismul og:image e gata in cod, dar valoarea reala (poza in share-uri sociale) cere TASK-3 - thumbnail-ul e azi data:URI base64.
Revizuire 2026-07-27 (pregatire pentru pipeline). Scope REDUS, fiindca TASK-3 a fost mutat in `backlog/manual/` (decizie owner): fara URL-uri publice de poze, `og:image` pe anunturi nu poate deveni real. Ce ramane e problema descoperita la verificarea din 2026-07-06 — og:image-ul GLOBAL din `index.html` e AVIF, format pe care crawlerele Facebook/WhatsApp nu-l suporta fiabil, deci si share-urile paginilor STATICE apar azi fara imagine.

AC-uri eliminate: vechiul #6 (URL public real — depinde de TASK-3) si vechiul #4 (verificare „minimum 1200×630" pe pozele proprietatilor — ar cere decodare base64 la runtime; TASK-3 o rezolva din radacina). AC-ul vechi #2 si partea de Facebook Debugger din #7 → mutate in `## Verificare post-deploy (owner)`.

AC-urile #1, #3, #5 din varianta veche erau deja bifate (mecanismul SSR exista) — au fost inlocuite cu criterii pentru munca ramasa.
Revizuire 2026-11-01 (analiza backlog-ului față de cod, decizii owner). Pagina de anunț are deja imagine JPEG de rezervă (`og-hai-in-sat.jpg`, 1200×630, adăugată în commit-ul c53d63b), deci problema rămasă e AVIF-ul de pe celelalte pagini. Titlul și scope-ul au fost rescrise: imaginea implicită devine `og-hai-in-sat.jpg` (nu se mai generează `og-default.jpg`), iar fiecare sat primește propriul JPEG 1200×630 generat de `scripts/generate-village-images.js` (decizie owner: „JPEG propriu pe fiecare sat”). AC-urile vechi (bazate pe `og-default.jpg` și pe „property-details nu se modifică”) au fost înlocuite.
<!-- SECTION:NOTES:END -->
