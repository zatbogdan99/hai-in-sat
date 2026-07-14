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

  it('preserves the existing empty-value behavior', () => {
    fixture.componentInstance.description = '';

    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('.description') as HTMLElement).innerHTML).toBe('');
  });
});
