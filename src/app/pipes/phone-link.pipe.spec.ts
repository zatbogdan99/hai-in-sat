import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneLinkPipe } from './phone-link.pipe';

@Component({
  standalone: true,
  imports: [PhoneLinkPipe],
  template: '<div class="description" [innerHTML]="description | phoneLink"></div>'
})
class PhoneLinkHostComponent {
  description = '';
}

describe('PhoneLinkPipe', () => {
  let fixture: ComponentFixture<PhoneLinkHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PhoneLinkHostComponent] });
    fixture = TestBed.createComponent(PhoneLinkHostComponent);
  });

  it('sanitizes API HTML before adding controlled phone links', () => {
    fixture.componentInstance.description = [
      '<img src="x" onerror="alert(1)">',
      '<script>alert(2)</script>',
      '<p>Telefon: 0712345678</p>'
    ].join('');

    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('.description') as HTMLElement;
    const image = host.querySelector('img');
    const phoneLink = host.querySelector('a') as HTMLAnchorElement | null;

    expect(host.querySelector('script')).toBeNull();
    expect(image?.hasAttribute('onerror')).toBeFalse();
    expect(host.innerHTML).not.toContain('onerror');
    expect(phoneLink).toBeTruthy();
    expect(phoneLink!.getAttribute('href')).toBe('tel:0712345678');
    expect(phoneLink!.textContent).toBe('0712345678');
  });

  const linksFor = (description: string) => {
    fixture.componentInstance.description = description;
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('.description a'));
  };

  it('links numbers written with spaces, dots, dashes, non-breaking spaces or the +40 prefix', () => {
    const links = linksFor([
      '<p>📞 Telefon: 0745 230 647 </p>',
      '<p>Tel. 0745.230.647</p>',
      '<p>Telefon: 0745-230-647</p>',
      '<p>Telefon: +40 728 140 628</p>',
      '<p>telefon 0040 728 140 628</p>'
    ].join(''));

    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'tel:0745230647', 'tel:0745230647', 'tel:0745230647', 'tel:+40728140628', 'tel:+40728140628'
    ]);
    // Textul rămâne cum l-a scris proprietarul.
    expect(links[0].textContent).toBe('0745 230 647');
    expect(links[3].textContent).toBe('+40 728 140 628');
  });

  it('shows phone links in the site blue, underlined', () => {
    const [link] = linksFor('<p>Telefon: 0763144967</p>');

    expect(link.style.color).toBe('rgb(0, 91, 170)');
    expect(link.style.textDecoration).toContain('underline');
  });

  it('does not link prices, areas or digit runs longer than a phone number', () => {
    const links = linksFor('<p>Preț: 240000 de euro • Suprafață: 9600 mp • Telefon: 07452306471</p>');

    expect(links.length).toBe(0);
  });

  it('preserves the existing empty-value behavior', () => {
    fixture.componentInstance.description = '';

    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.description') as HTMLElement).innerHTML).toBe('');
  });
});
