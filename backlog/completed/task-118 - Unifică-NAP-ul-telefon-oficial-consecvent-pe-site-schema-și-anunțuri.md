---
id: TASK-118
title: 'Unifică NAP-ul — telefon oficial consecvent pe site, schema și anunțuri'
status: Done
assignee:
  - '@codex'
created_date: '2026-06-12 16:10'
updated_date: '2026-09-29 08:39'
labels:
  - seo
  - local
  - trust
  - content
dependencies: []
documentation:
  - ../../../../seo-audit-2026-06-12/findings/local.md
  - ../../../../seo-audit-2026-06-12/findings/content.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Scop si decizii existente

Unifica telefonul oficial al agentiei: +40728140628 in tel:, JSON-LD RealEstateAgent.telephone si llms.txt; 0728 140 628 in UI. Pe contact desktop numarul afisat se termina gresit in 650, desi linkul suna la numarul corect. Dialogul Contact din footer nu are link tel:.

Numerele proprietarilor raman afisate si apelabile EXACT ca acum in descrierile anunturilor, fara etichete sau schimbari vizuale. Se elimina numai din description SEO (inclusiv OG/Twitter), RealEstateListing.description si alt-ul imaginilor din lista. Acest lucru nu face private numerele publicate in body.

## Implementare

1. Corecteaza ultimele doua cifre din contact desktop si aliniaza numarul oficial in UI, linkurile tel: si llms.txt. Pastreaza RealEstateAgent.telephone, deja corect. Adauga link pentru numarul din dialogul Contact al footerului.
2. Scoate telefonul din meta description a paginii Contact.
3. Creeaza helperul comun stripPhones(text: string): string pentru numere mobile romanesti 07..., +407..., 407..., inclusiv spatii (si non-breaking spaces), puncte sau cratime. Foloseste limite numerice astfel incat sa nu elimine fragmente din identificatori mai lungi; pastreaza preturi, suprafete, ani si alte numere obisnuite.
4. In property-details, aplica helperul dupa HtmlTextService.htmlToText si INAINTE de substring(0,150)/(0,300). Curata si numele proprietatii acolo unde contribuie la description. HtmlTextService existent inlocuieste vechea referinta din task la strip HTML prin regex.
5. In properties.getImageAlt, curata numele si descrierea inainte de scurtarea descrierii la 60 de caractere. Nu modifica truncateDescription folosit pentru textul vizibil.
6. Template-ul property-details si pipe-ul phoneLink raman neschimbate. Nu se modifica datele din backend.

## Corecturi acceptate la discutia task-ului

Patternul initial recomandat se adapteaza cu limite numerice. Curatarea precede trunchierea si acopera numele cand intra in description/alt. Testarea numarului desktop se face pe textul concatenat al span-urilor, deoarece grep-ul unui numar complet nu detecteaza cifrele separate in HTML.

## Verificare

Teste pentru helper si integrare (browser/SSR), build browser + SSR, suita Angular si regresiile SSR. Protocolul HTTP local verifica description standard/OG/Twitter pentru toate rutele statice si o pagina de proprietate cu API fixture, JSON-LD description, alt, numarul oficial in schema si contact, precum si pastrarea telefoanelor vizibile. Dovezi in Implementation Notes.

## Post-deploy (owner)

Dupa merge si deploy manual, verifica apelarea linkurilor tel: pe dispozitiv. Agentul livreaza branch ticket/... si PR; nu face deploy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Telefonul oficial din RealEstateAgent.telephone si llms.txt este +40728140628; llms.txt foloseste o singura forma.
- [x] #2 Pe contact desktop si mobil, cifrele vizibile concatenate sunt 0728140628; formatul UI este 0728 140 628 si href este tel:+40728140628.
- [x] #3 Numarul gresit 0728140650 nu apare in src; verificarea include textul concatenat al span-urilor din contact.
- [x] #4 Exista stripPhones in utils: elimina telefoane 07/+407/407 cu spatii, puncte, cratime; limitele numerice protejeaza identificatorii mai lungi, iar testele pastreaza preturi/suprafete/ani.
- [x] #5 Helperul curata description meta/OG/Twitter si JSON-LD in property-details, plus getImageAlt in properties, inainte de trunchiere; include numele proprietatii cand contribuie la description/alt.
- [x] #6 Meta description a paginii Contact nu mai contine numar de telefon.
- [x] #7 Body-ul anunturilor, template-ul property-details si pipe-ul phoneLink raman neschimbate; numerele proprietarilor raman vizibile si apelabile.
- [x] #8 Numarul din dialogul Contact al footerului este link tel:+40728140628, afisat 0728 140 628.
- [x] #9 Linkurile oficiale tel: folosesc +40728140628; linkurile generate pentru proprietari raman neschimbate.
- [x] #10 Build browser+SSR si verificarea HTTP locala pentru toate rutele statice plus proprietate trec; dovezi pentru descrieri fara telefoane, JSON-LD/alt si numarul oficial sunt salvate in Implementation Notes.
- [x] #11 npm run test:ci si regresiile SSR existente trec, inclusiv testele adaugate pentru helper si integrare.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Actualizeaza specificatia cu ajustarile acceptate: limite numerice la detectarea telefoanelor, curatare inainte de trunchiere si acoperirea numelui proprietatii in description/alt.
2. Corecteaza telefonul oficial in contact, footer si llms.txt; pastreaza RealEstateAgent.telephone si descrierile vizibile ale proprietatilor.
3. Implementeaza stripPhones si integrarea in description SEO/JSON-LD si alt, reutilizand HtmlTextService.
4. Teste pentru detectare, trunchiere si integrare; build, teste existente si HTML SSR local pe toate rutele statice plus proprietate.
5. Review independent, rezolvare blocante, dovezi in backlog, commit/PR. Fara pipeline sau deploy.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revizuire 2026-07-27 (pregatire pentru pipeline). Task-ul era deja bine decis (numar oficial fixat 2026-06-28, comportamentul anunturilor fixat tot atunci). Modificari:
1. Helperul `stripPhones` era „optional dar recomandat" → devine OBLIGATORIU, ca sa nu ajunga acelasi regex copiat in trei locuri cu trei variante subtil diferite.
2. AC-ul vechi #1 cerea numarul si pe „/about-us" si in „header/footer" fara sa spuna unde anume in cod → inlocuit cu fisiere si linii verificabile.
3. AC-ul vechi #3 („verificare pe toate cele 22 pagini, grep pe HTML brut") presupunea crawl pe productie → devine protocolul SSR local pe `http://localhost:4000`.
4. „include decizia de business" din Efort a fost scos — nu mai exista decizie deschisa.

2026-09-29: implementare directa autorizata dupa explicarea task-ului si a corecturilor. Regexul initial se adapteaza cu limite numerice pentru a evita fragmente din identificatori mai lungi. Curatarea se face dupa htmlToText, inainte de trunchiere; acopera si numele proprietatii cand contribuie la description/alt. truncateDescription pentru textul vizibil ramane neschimbat. Numerele proprietarilor raman in body si phoneLink; nu se promite imposibilitatea indexarii lor. UI foloseste 0728 140 628; tel/JSON-LD/llms.txt folosesc +40728140628. Backend nemodificat.

Validare finala 2026-09-29:
- npm run build: PASS browser + SSR. Browser hash 369c1adfb7ca62f5, main.21c2dd4dd3dd8315.js; SSR hash 0203dbcefd9873e3. Avertismentele existente pentru bugetele SCSS raman, fara erori.
- npm run test:ci: TOTAL 82 SUCCESS (9 teste noi); log local C:\Users\Bogd\AppData\Local\Temp\task118-angular-14ebe78ad40f4431a91f84f8827c1bc2.log. npm run test:ssr: 26 PASS, 0 FAIL.
- npm run test:ssr:http: PASS, 80 raspunsuri HTTP. Dovezi locale: C:\Users\Bogd\AppData\Local\Temp\hai-in-sat-ssr-cache-o7Z3zx (responses.json si server.log). Server temporar cu API fixture, inchis de script.
- PASS description standard/OG/Twitter fara telefoane pe TOATE rutele statice: /, /homes, /about-us, /info-page, /contact-us, /under-the-mountain, /see-the-area, /properties, /village-of-the-month, /login, /add-property. Pe fiecare ruta, schema RealEstateAgent.telephone ramane +40728140628.
- Exemplu SSR /contact-us: Contactează echipa Hai în Sat pentru informații despre case și terenuri de vânzare în Oltenia de sub Munte. Scrie-ne la contact@hai-în-sat.ro. Contact desktop si mobil: href tel:+40728140628, cifre vizibile concatenate 0728140628.
- Proprietate fixture /property/44444444-4444-4444-4444-444444444444/teren-de-vanzare-proprietate-test-40-768-915-198: PASS pe MISS si HIT. Numerele din nume si descriere dispar din meta description/OG/Twitter si RealEstateListing.description; pretul 75.000 euro si suprafata 1.250 mp raman. In body se pastreaza Telefon: 0763144967 cu link tel:0763144967 si numarul +40 728 140 628 cu spatii non-breaking. Alt-ul cardului verificat pe /properties?seo-test=1 este curatat identic. GET /llms.txt confirma +40728140628.
- Helper testat pe 10 formate de telefon, mai multe numere in acelasi text, numere singure, text gol, identificatori numerici compacți mai lungi, preturi/suprafete/ani. Integrare browser si server cu telefoane care intersecteaza limitele de trunchiere 150/300; alt cu numar la limita de 60.
- Verificare surse cu parser HTML: PASS 4 official phone links: correct href and visible digits, including desktop spans and footer dialog. rg pentru 0728140650 in src: 0 rezultate. git diff confirma template-ul property-details, phoneLink, src/index.html si dependentele neschimbate.
- Regresiile SSR existente trecute: cache GET/HEAD/304, Date/Age, admin/noindex, erori 404/503, API degradat, redirect, cache bundle/asset/static.
- Review independent dupa implementare si reverificare dupa ajustarea fixture-urilor: fara blocante sau regresii concrete. Cele doua teste noi verificau initial linkuri fara prefixul Telefon: necesar pipe-ului existent; fixture-urile au fost corectate, fara schimbarea comportamentului aplicatiei. Restrictiile sandbox spawn EPERM au fost rezolvate prin rularea aprobata a build-ului/testelor cu permisiunile necesare.
- git diff --check: PASS. Backend nemodificat. Fara pipeline, merge sau deploy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Telefonul oficial este consecvent in UI, linkuri si llms.txt; contact desktop corectat si footer apelabil. stripPhones curata description SEO/OG/Twitter, JSON-LD description si alt inainte de trunchiere, inclusiv numele proprietatii folosit in acele campuri. Descrierile vizibile si phoneLink raman neschimbate. Build, 82 teste Angular, 26 teste Node si 80 verificari HTTP trecute; review independent fara blocante. Livrare pe ticket/task-118-official-phone prin PR, fara deploy.
<!-- SECTION:FINAL_SUMMARY:END -->
