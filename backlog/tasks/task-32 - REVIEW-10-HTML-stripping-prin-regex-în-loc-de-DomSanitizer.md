---
id: TASK-32
title: 'REVIEW-10: HTML stripping prin regex în loc de DomSanitizer'
status: To Do
assignee: []
created_date: '2026-05-07 08:46'
updated_date: '2026-06-17 14:24'
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

Dacă template-ul folosește `[innerHTML]="prop.description"`, Angular sanitize-ază automat (DomSanitizer). Verifică template-ul `property-details.component.html`. Dacă da, OK. Dacă cumva folosește `bypassSecurityTrustHtml`, atenție: explicit unsafe.

## Fișiere afectate

- `src/app/property-details/property-details.component.ts:95, 102`
- (eventual) alte locuri cu replace `/<[^>]*>/g` — `git grep "<\[\^>\]\*>"` să verifici

## Efort

1-2 ore (creează service, refactor 2 utilizări, verifică SSR-safety).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `git grep "<\[\^>\]\*>"` în `src/app` returnează 0 rezultate (regex-ul de strip a dispărut)
- [ ] #2 Există un `HtmlTextService` (sau utility function) folosit pentru convertire HTML→text plain
- [ ] #3 Pentru o descriere cu HTML real (ex: `<p>Casa <strong>frumoasă</strong> &amp; aproape</p>`), output-ul este: `Casa frumoasă & aproape`
- [ ] #4 Util-ul gestionează `null`/`undefined` întoarce string gol
- [ ] #5 La SSR (existent), service-ul nu crash-uiește (folosește `isPlatformBrowser`)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verificare 2026-06-08: Inca valid. Regex-ul de strip HTML e acum la property-details.component.ts:128 (meta description) si :135 (RealEstateListing description) - liniile s-au mutat (erau 95/102). Niciun HtmlTextService creat. Template-ul foloseste [innerHTML] cu pipe phoneLink pentru descriere - de verificat sanitizarea separat.
<!-- SECTION:NOTES:END -->
