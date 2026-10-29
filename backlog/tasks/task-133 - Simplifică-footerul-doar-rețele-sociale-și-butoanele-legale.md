---
id: TASK-133
title: Simplifică footerul — doar rețele sociale și butoanele legale
status: To Do
assignee: []
created_date: '2026-10-29 22:05'
labels:
  - frontend
  - ui
  - footer
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Obiectiv

Footerul se reduce la două rânduri:
1. iconițele TikTok, Facebook și Instagram (`.footer-social`);
2. cele 4 butoane de jos: Politica de confidențialitate, Termenii și condițiile, Politica de cookies, Contact (`.footer-legal`).

Se scot complet, la cererea owner-ului (2026-10-29):
- blocul de linkuri `nav.footer-links`: Proprietăți, Despre noi, Oltenia de sub Munte, Satul lunii, Găsește-mi locul;
- linia `p.footer-contact`: „Telefon: 0728 140 628 · E-mail: contact@hai-în-sat.ro”.

## Starea de pornire

Footerul descris aici este cel din `master` de după merge-ul PR #26 (`ticket/qa-vizual-2026-10`, commit `c53d63b`, 2026-10-29, „modificari vizuale si sters componente vechi”). Implementarea pornește din `master` la commit-ul `7bc1223` sau mai nou.

## Istoric: de unde vin elementele scoase

- **`nav.footer-links`** — adăugat în TASK-120 (commit `c6040dd`, 2026-10-02, PR #23), cu 7 destinații. Motiv: meniul de sus nu lega `/about-us`, `/contact-us` și `/see-the-area`, iar footerul sitewide le dădea tuturor paginilor link de intrare. Branch-ul QA a scos `/contact-us` și `/see-the-area` (redirect 301), deci au rămas 5 linkuri. Patru dintre ele sunt deja în meniul de sus (`/under-the-mountain`, `/village-of-the-month`, `/properties`, `/homes`).
- **`p.footer-contact`** — adăugat în commit-ul `c53d63b` ca înlocuitor al paginii `/contact-us` șterse în același commit. Telefonul și emailul rămân accesibile din dialogul „Contact” (buton în footer), din schema JSON-LD și de pe `/properties`.

## Decizie owner (2026-10-29): `/about-us` rămâne orfană

După scoaterea linkurilor, `/about-us` nu mai primește link de pe nicio pagină. Owner-ul a decis explicit să nu i se dea alt link: pagina e veche și va fi ștearsă complet în task-ul următor (TASK-134). Până atunci, verificarea „incoming links” din `scripts/test-ssr-cache.cjs` primește o excepție explicită și temporară **doar** pentru `/about-us`, cu un comentariu care trimite la TASK-134. TASK-134 trebuie să scoată excepția odată cu pagina.

## Scope

- `src/app/app.component.html` — șterge `nav.footer-links` și `p.footer-contact`. `.footer-social`, `.footer-legal` și toate dialogurile (inclusiv „Contact”, cu `tel:` și `mailto:`) rămân neschimbate.
- `src/app/app.component.scss` — șterge regulile `.footer-links` și `.footer-contact`, inclusiv din selectorul comun `:focus-visible`. `.footer-social a:focus-visible` rămâne. Verifică spațierea `.site-footer` (`gap`, `padding`) cu doar două rânduri; ajustează doar dacă arată dezechilibrat.
- `src/app/app.component.spec.ts`:
  - testul „exposes the logo, desktop menu and six footer destinations as real links” verifică în continuare logo-ul și meniul. Pentru footer verifică acum că `nav.footer-links` nu mai există.
  - testul „shows the official phone and email in the footer…” nu mai cere `.footer-contact`. Rețelele sociale rămân 6 linkuri reale (3 în topbar + 3 în footer), cu `target="_blank" rel="noopener"`.
  - Redenumește testele ca titlul să descrie noul comportament.
- `scripts/test-ssr-cache.cjs`:
  - verificarea telefonului (în jurul liniei 258-268, „must show the official phone in the footer”) devine: orice link `tel:` din pagină este `tel:+40728140628` cu textul `0728 140 628`. Dispare cerința de minimum un link `tel:` pe fiecare pagină. Actualizează și comentariul de deasupra.
  - verificarea incoming links: excepția temporară pentru `/about-us`, descrisă mai sus.
- `scripts/test-browser-regression.cjs` — linia ~163 (`.footer-links a` count 5) și linia ~240 (navigare la `/homes` prin `.footer-links`) se adaptează. Footerul are doar social + butoane legale; navigarea spre `/homes` se face prin meniul principal (`.nav-chips` pe desktop, popover-ul pe mobil). Linia ~89 nu mai cere selectorul `.footer-links`.
- `CLAUDE.md` — dacă descrierea `npm run test:ssr:http` sau alte rânduri mai presupun telefonul în footer, le actualizezi.

## În afara scope-ului

- Ștergerea paginii `/about-us` (ruta, componenta, sitemap, `llms.txt`, redirect): TASK-134.
- Orice schimbare de meniu de sus, de dialoguri sau de conținut al butoanelor legale.
- Redesign vizual al footerului dincolo de eliminarea celor două blocuri.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `app.component.html` nu mai conține `nav.footer-links` și nici `p.footer-contact`. Footerul (`footer.site-footer`) conține, în ordine, doar `.footer-social` (TikTok, Facebook, Instagram, neschimbate) și `.footer-legal` (cele 4 butoane, neschimbate).
- [ ] #2 Cele 4 butoane din footer deschid în continuare dialogurile lor fără schimbare de rută. Dialogul „Contact” afișează în continuare `tel:+40728140628` / `0728 140 628` și `mailto:contact@xn--hai-n-sat-t5a.ro`.
- [ ] #3 `app.component.scss` nu mai conține selectori `.footer-links` sau `.footer-contact`. Niciun alt selector din fișier nu a fost șters sau modificat în afara ajustării opționale de spațiere a `.site-footer`.
- [ ] #4 Meniul de sus (desktop și mobil) și linkurile sociale din topbar sunt neschimbate.
- [ ] #5 `app.component.spec.ts` verifică absența `nav.footer-links` și `.footer-contact` și prezența celor 6 linkuri sociale reale. Titlurile testelor descriu comportamentul nou. Nu există teste `fdescribe`/`fit`/`xdescribe`/`xit`.
- [ ] #6 `scripts/test-ssr-cache.cjs` acceptă pagini fără link `tel:`, dar cere ca orice link `tel:` existent să fie numărul oficial.
- [ ] #7 `scripts/test-ssr-cache.cjs` are o singură excepție de incoming links, pentru `/about-us`, marcată cu un comentariu care trimite la TASK-134. Toate celelalte rute din sitemap au în continuare cel puțin un incoming link și cel puțin 5 href-uri interne distincte.
- [ ] #8 `scripts/test-browser-regression.cjs` nu mai referă `.footer-links`. Navigarea spre `/homes` trece prin meniul principal.
- [ ] #9 `npm run build`, `npm run test:ci`, `npm run test:ssr` și `npm run test:ssr:http` trec. Rezumatul `test:ssr:http` (rute, incoming links, anunțuri descoperite) e lipit în `## Implementation Notes`.
- [ ] #10 Verificare vizuală la 1440, 390 și 320 px, documentată în `## Implementation Notes`: footerul are doar cele două rânduri, centrate, fără spațiu gol în locul blocurilor scoase și fără scroll orizontal.
<!-- AC:END -->

## Verificare post-deploy (owner)

NU fac parte din criteriile de acceptare: livrarea se oprește la PR, fără deploy.

1. Pe site-ul live, desktop și mobil: footerul arată doar iconițele sociale și cele 4 butoane.
2. Butonul „Contact” din footer deschide dialogul cu telefonul și emailul. Linkul `tel:` pornește apelul pe telefon.
