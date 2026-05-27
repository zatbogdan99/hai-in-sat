---
id: TASK-9
title: Adaugă llms.txt pentru AI search readiness
status: Done
assignee: []
created_date: '2026-05-07 07:57'
updated_date: '2026-05-10'
labels:
  - seo
  - geo
  - content
  - quick-win
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

`/llms.txt` curent returnează 404. `llms.txt` este o convenție emergentă (analog cu robots.txt) care oferă LLM-urilor (ChatGPT, Claude, Perplexity, Gemini) un map markdown al brandului — descriere succintă, pagini cheie, contact. Nu garantează citare, dar crește semnificativ probabilitatea ca AI-ul să răspundă coerent la întrebări despre brand.

Cost: 30 minute. Beneficiu GEO disproporționat de mare.

## Cum

1. Creează `src/llms.txt` cu conținut markdown (vezi structura recomandată mai jos).
2. Configurează ca asset static în `angular.json` (probabil deja se servesc fișierele din `src/` root via `assets` array).
3. Adaugă referință în `src/robots.txt` (deja există): linia `# AI policy: see /llms.txt`.

## Conținut recomandat

```markdown
# Hai în Sat

> Platformă de case și terenuri de vânzare în Oltenia de sub Munte, județul Vâlcea, România. Specializată în proprietăți rurale autentice din zonele Horezu, Polovragi, Costești, Vaideeni, Baia de Fier, Cerna.

## Despre

Hai în Sat (operat de S.C. CORUXMAN IMPEX S.R.L.) este o agenție imobiliară regională care listează proprietăți (case bătrânești, terenuri intravilan/extravilan, ferme) în zona montană a Olteniei, județul Vâlcea. Conținut și interfață în română.

## Pagini principale

- [Acasă](https://hai-în-sat.ro/) — landing și introducere brand
- [Toate proprietățile](https://hai-în-sat.ro/properties) — listare paginată
- [Sub munte (regiune)](https://hai-în-sat.ro/under-the-mountain) — profil regional
- [Satul lunii](https://hai-în-sat.ro/village-of-the-month) — focus pe un sat în fiecare lună
- [Vezi zona](https://hai-în-sat.ro/see-the-area) — galerie foto regională
- [Despre noi](https://hai-în-sat.ro/about-us)
- [Contact](https://hai-în-sat.ro/contact-us)

## Contact

- Telefon: +40 728 140 628
- Email: contact@xn--hai-n-sat-t5a.ro (formă ASCII)
- Adresă: Str. Tudor Vladimirescu, Horezu, Vâlcea (cod 245800), România

## Crawler policy

GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, GoogleOther — allow.
Non-commercial citation cu link-back permis.
```

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/llms.txt` (de creat)
- `hai-in-sat/hai-in-sat/angular.json` (verifică că `src/llms.txt` se include în assets — dacă nu, adaugă în `projects.hai-in-sat.architect.build.options.assets`)
- `hai-in-sat/hai-in-sat/src/robots.txt` (adaugă comentariu sau directivă spre llms.txt)

## Efort

30 min.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GET `https://xn--hai-n-sat-t5a.ro/llms.txt` returnează 200 cu content-type `text/plain` (sau `text/markdown`)
- [x] #2 Conținutul include nume brand, descriere, listă pagini cheie, contact — toate în română
- [x] #3 URL-urile din llms.txt folosesc forma IDN (`https://hai-în-sat.ro/...`) consistent cu canonicalul
- [x] #4 robots.txt menționează existența llms.txt sau întreaga structură este crawlable de AI bots
<!-- AC:END -->

## Implementation Notes (2026-05-10)

- Creat `src/llms.txt` cu structură Markdown standard llms.txt: H1 brand, blockquote descriere scurtă, secțiuni Despre / Pagini principale / Contact / Crawler policy. URL-uri în formă IDN (`https://hai-în-sat.ro/...`) consistente cu canonical-ul setat de `SeoService`.
- Adăugat `src/llms.txt` în `angular.json` `assets[]` (atât în `architect.build.options.assets` cât și în `architect.test.options.assets`) — copiat în `dist/hai-in-sat/browser/llms.txt` la build.
- Servire în producție: `app.yaml` are deja un handler regex `(.*\.(... txt ...))$` care servește orice `*.txt` ca static din `dist/hai-in-sat/browser/`. Nu sunt necesare modificări în `app.yaml`.
- Servire local cu SSR: `src/server.ts` are `server.get('*.*', express.static(distFolder))` care prinde `/llms.txt` (conține `.`) și-l servește static cu `maxAge: 1y`.
- `src/robots.txt` actualizat: două linii de comentariu `# AI policy: see /llms.txt` + URL absolut, conform recomandării din task.

## Verificare manuală post-deploy
1. `npm run build && npm run serve:ssr`
2. `curl http://localhost:4000/llms.txt` → 200, content-type `text/plain`, conținut Markdown.
3. După deploy: `curl https://hai-în-sat.ro/llms.txt` → același rezultat.
