import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Separatorii dintre cifre, cum ies din sanitizer: spațiu, punct, cratimă și spațiul fix (devine „&#160;”).
const SEPARATOR = '(?:[ .\\-]|&#160;)';

/**
 * „Telefon:” sau „Tel.” urmat de un număr românesc de 10 cifre (0…, +40…, 0040…), scris lipit sau cu separatori.
 * Înainte se potriveau doar 10 cifre lipite: „0745 230 647” rămânea text simplu.
 */
const PHONE_REGEX = new RegExp(
  `(\\b(?:Telefon|Tel\\.?)(?:\\s|&#160;)*:?(?:\\s|&#160;)*)((?:\\+40|0040|0)${SEPARATOR}?[237](?:${SEPARATOR}?\\d){8})(?!\\d)`,
  'gi'
);

/** Numărul din href, doar cifre: 0040… devine +40…, iar 0… rămâne ca în text (tel:0763144967). */
function telHref(phone: string): string {
  const digits = phone.replace(/&#160;/g, '').replace(/[^\d+]/g, '');
  return digits.startsWith('0040') ? `+40${digits.slice(4)}` : digits;
}

@Pipe({
  name: 'phoneLink',
  standalone: true
})
export class PhoneLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml | string {
    if (!value) return '';

    const sanitizedValue = this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';

    // Textul numărului rămâne cum l-a scris proprietarul; linkul are albastrul site-ului și e subliniat.
    const transformed = sanitizedValue.replace(PHONE_REGEX, (match, prefix, phone) => {
      return `${prefix}<a href="tel:${telHref(phone)}" style="color: #005baa; text-decoration: underline;">${phone}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(transformed);
  }
}
