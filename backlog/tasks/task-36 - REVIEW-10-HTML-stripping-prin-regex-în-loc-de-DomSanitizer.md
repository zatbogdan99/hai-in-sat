---
id: TASK-36
title: 'REVIEW-10: HTML stripping prin regex în loc de DomSanitizer'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-07-06'
labels:
  - review
  - security
  - xss
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## De ce

În `src/app/property-details/property-details.component.ts:95`:

```typescript
description: `${propertyTypeLabel} de vânzare în Oltenia de sub Munte: ${prop.name}. ${(prop.description || '').replace(/<[^>]*>/g, '').substring(0, 150)}`,
```

Și similar la `src/app/property-details/property-details.component.ts:102`:

```typescript
description: (prop.description || '').replace(/<[^>]*>/g, '').substring(0, 300),
```

Strip-uirea HTML-ului din `prop.description` se face cu regex `/<[^>]*>/g`. **Regex-uri pentru HTML sunt fragile:**

1. Atribute cu `>` în valoare (ex: `<a title="ai > 18">` ) — regex-ul scoate parțial.
2. Comentarii HTML `<!-- ... -->` cu `>` interior — incomplete.
3. CDATA sections — netrate.
4. Caractere encodate (`&lt;script&gt;`) — supraviețuiesc strip-ului ca text.
5. Tag-uri ne-închise sau malformed — comportament nedefinit.

Risc: dacă API-ul returnează HTML „de încredere" generat de admin într-un editor (presupunând că AddProperty are richtext editor), regex-ul poate să lase script-uri parțial intacte. Mai mult, descrierea apoi merge în `<meta name="description">` și `<meta property="og:description">` — Google și Facebook procesează acel text și îl afișează în SERP/cards. Dacă rămân fragmente HTML, apare ciudat în preview.

## Cum se rezolvă

### Soluția pentru meta tags (text-only)

Folosește un simplu „strip via DOM":

```typescript
function htmlToText(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
```

Apoi `htmlToText(prop.description).substring(0, 150)`.

Avantaj: browserul parsează corect HTML-ul (toate edge cases), iar `textContent` returnează doar text. Inclusiv decodează entități (`&amp;` → `&`). Pentru meta description e ideal.

Dar la SSR (care există deja), `document` nu există. Variantă safe:

```typescript
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class HtmlTextService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  htmlToText(html: string): string {
    if (!html) return '';
    if (this.isBrowser) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || '';
    }
    // Fallback server-side: minim regex strip + decode entities
    return html.replace(/<[^>]*>/g, '').replace(/&[a-z0-9]+;/gi, '').trim();
  }
}
```

Sau folosește o lib mică: `striptags` (~3KB) sau `html-to-text` (heavier).

### Pentru randarea descrierii în template

**VERIFICAT 2026-07-06 — e mai grav decât „de verificat":** template-ul (`property-details.component.html:43` și `:114`) randează descrierea prin `[innerHTML]="propertyDescription | phoneLink"`, iar **`PhoneLinkPipe` (`src/app/pipes/phone-link.pipe.ts`) apelează `bypassSecurityTrustHtml` PE ÎNTREAGA descriere** (după ce inserează anchor-ele `tel:`). Adică sanitizarea Angular e explicit OCOLITĂ pentru un text care vine din API — orice HTML/script din descriere se execută în pagină (stored XSS dacă contul de admin e compromis sau dacă descrierea ajunge vreodată din surse neverificate; se randează și pe SSR).

**Fix pentru pipe (parte din acest task):** în `PhoneLinkPipe`, sanitizează ÎNTÂI HTML-ul cu `DomSanitizer.sanitize(SecurityContext.HTML, value)` (elimină scripturi/handler-e, păstrează formatarea benignă), apoi aplică regex-ul de telefon pe rezultat și returnează cu `bypassSecurityTrustHtml` DOAR acest conținut deja sanitizat (bypass-ul devine sigur pentru că input-ul e curățat, iar anchor-ele `tel:` sunt generate de noi). Adaugă test: o descriere cu `<img src=x onerror=alert(1)>` nu produce atribut `onerror` în DOM.

**Nit adiacent (aceeași zonă):** pe cardurile din `/properties`, `truncate(property.description, 50)` afișează descrierea BRUTĂ ca text — dacă descrierea conține tag-uri HTML, ele apar literal pe card (`<p>...`). După crearea utilului HTML→text, folosește-l și acolo.

## Fișiere afectate

- `src/app/property-details/property-details.component.ts` (regex strip la :131 meta description și :138 JSON-LD — liniile curente)
- `src/app/pipes/phone-link.pipe.ts` (sanitize înainte de bypass)
- `src/app/properties/properties.component.ts` (`truncate` pe descriere — folosește utilul)
- (eventual) alte locuri cu replace `/<[^>]*>/g` — `git grep "<\[\^>\]\*>"` să verifici

## Efort

2-3 ore (service + pipe + refactor utilizări + verificare SSR-safety).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git grep "<\[\^>\]\*>"` în `src/app` returnează 0 rezultate (regex-ul de strip a dispărut)
- [ ] #2 Există un `HtmlTextService` (sau utility function) folosit pentru convertire HTML→text plain
- [ ] #3 Pentru o descriere cu HTML real (ex: `<p>Casa <strong>frumoasă</strong> &amp; aproape</p>`), output-ul este: `Casa frumoasă & aproape`
- [ ] #4 Util-ul gestionează `null`/`undefined` întoarce string gol
- [ ] #5 La SSR (existent), service-ul nu crash-uiește (folosește `isPlatformBrowser`)
- [ ] #6 `PhoneLinkPipe` NU mai face bypass pe conținut nesanitizat: input cu `<img src=x onerror=alert(1)>` sau `<script>` NU produce cod executabil în DOM (verificat cu test unit), iar link-urile `tel:` continuă să funcționeze
- [ ] #7 Cardurile din `/properties` nu afișează tag-uri HTML literale în descrierea trunchiată
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. Regex-ul de strip HTML e acum la property-details.component.ts:128 (meta description) si :135 (RealEstateListing description) - liniile s-au mutat (erau 95/102). Niciun HtmlTextService creat. Template-ul foloseste [innerHTML] cu pipe phoneLink pentru descriere - de verificat sanitizarea separat.

Verificare 2026-07-06: SCOPE EXTINS — sanitizarea "de verificat separat" a fost verificata si e problema reala: PhoneLinkPipe face bypassSecurityTrustHtml pe descrierea bruta (vezi sectiunea noua din descriere). Liniile regex-urilor de strip sunt acum :131 (meta) si :138 (JSON-LD). Severitate urcata: security/xss confirmat pe fluxul de randare, nu doar fragilitate de meta tags.
<!-- SECTION:NOTES:END -->
