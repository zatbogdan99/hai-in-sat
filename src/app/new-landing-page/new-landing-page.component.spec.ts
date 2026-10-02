import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NewLandingPageComponent } from './new-landing-page.component';

describe('NewLandingPageComponent', () => {
  it('offers the form CTA as a crawlable link', () => {
    TestBed.configureTestingModule({ imports: [NewLandingPageComponent, RouterTestingModule] });
    const fixture = TestBed.createComponent(NewLandingPageComponent);
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('a.cta') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/homes');
    expect(link.textContent?.trim()).toBe('Completează formularul');
  });
});
