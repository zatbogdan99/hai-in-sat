import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'phoneLink',
  standalone: true
})
export class PhoneLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml | string {
    if (!value) return '';

    const sanitizedValue = this.sanitizer.sanitize(SecurityContext.HTML, value) ?? '';

    // Regex pentru a detecta pattern-ul "Telefon: [număr]"
    const phoneRegex = /(Telefon:\s*)(0\d{9})/g;

    const transformed = sanitizedValue.replace(phoneRegex, (match, prefix, phone) => {
      return `${prefix}<a href="tel:${phone}" style="color: #1a73e8; text-decoration: none;">${phone}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(transformed);
  }
}
