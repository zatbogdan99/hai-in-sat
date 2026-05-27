---
id: TASK-14
title: Lazy-load YouTube iframe API doar pe rute cu video
status: To Do
assignee: []
created_date: '2026-05-07 08:01'
updated_date: '2026-05-07 08:14'
labels:
  - seo
  - performance
  - perf
dependencies: []
documentation:
  - ../../seo-audit-output/ACTION-PLAN.md
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

În `src/index.html`, înainte de bundle-urile Angular: `<script src="https://www.youtube.com/iframe_api"></script>`. Se încarcă pe FIECARE pagină (homepage, contact, about, properties listing) — chiar dacă acea pagină nu embed-ează video. Adaugă request extra + JS execution pe rutele care nu au nevoie de YouTube.

Impact CWV: TBT (Total Blocking Time) și INP cresc fără justificare pe ~80% din rute.

## Cum

1. Șterge tag-ul global din `src/index.html`.
2. Identifică componentele care folosesc YouTube embed (probabil componenta `UnderTheMountainComponent` sau `VillageOfTheMonthComponent` — `under-the-mountain` și `village-of-the-month` au cel mai mare potențial de conținut video).
3. În componenta respectivă, în `ngOnInit()` (sau un service `VideoService` care cache-uiește), inserează scriptul dinamic:

```typescript
ngOnInit() {
  if (!document.getElementById("yt-iframe-api")) {
    const s = document.createElement("script");
    s.id = "yt-iframe-api";
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  }
}
```

4. Alternativă mai bună: folosește YouTube embed cu `loading="lazy"` direct în `<iframe>`, fără `iframe_api`, dacă nu ai nevoie de Player API control.

## Fișiere afectate

- `hai-in-sat/hai-in-sat/src/index.html` (delete `<script src="https://www.youtube.com/iframe_api">`)
- `src/app/components/<component-cu-video>/*.ts` (adaugă lazy load)
- (opțional) `src/app/service/video.service.ts` pentru reuse

## Efort

1 oră.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `src/index.html` NU mai conține `<script src="https://www.youtube.com/iframe_api">`
- [ ] #2 Pe rutele FĂRĂ video (`/`, `/properties`, `/about-us`, `/contact-us`, `/property/...`) Network tab DevTools NU încarcă `iframe_api`
- [ ] #3 Pe ruta cu video (probabil `/under-the-mountain` sau `/village-of-the-month`) `iframe_api` se încarcă și player-ul funcționează
- [ ] #4 Lighthouse mobile pe homepage raportează cu 1+ request mai puțin și TBT/INP îmbunătățit
<!-- AC:END -->
