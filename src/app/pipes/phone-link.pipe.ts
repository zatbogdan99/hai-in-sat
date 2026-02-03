import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'phoneLink',
  standalone: true
})
export class PhoneLinkPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return value;

    // Regex pentru a detecta pattern-ul "Telefon: [număr]"
    const phoneRegex = /(Telefon:\s*)(0\d{9})/g;

    const transformed = value.replace(phoneRegex, (match, prefix, phone) => {
      return `${prefix}<a href="tel:${phone}" style="color: #1a73e8; text-decoration: none;">${phone}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(transformed);
  }
}
