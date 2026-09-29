import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';

import { ContactUsComponent } from './contact-us.component';

describe('ContactUsComponent', () => {
  let component: ContactUsComponent;
  let fixture: ComponentFixture<ContactUsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContactUsComponent]
    });
    fixture = TestBed.createComponent(ContactUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the official number on desktop and mobile and keeps it out of SEO descriptions', () => {
    const links = fixture.nativeElement.querySelectorAll('a[href^="tel:"]') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(2);
    for (const link of Array.from(links)) {
      expect(link.getAttribute('href')).toBe('tel:+40728140628');
      expect(link.textContent?.replace(/\s/g, '')).toBe('0728140628');
    }
    for (const selector of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
      const content = TestBed.inject(Meta).getTag(selector)?.content;
      expect(content).toContain('Contactează echipa Hai în Sat');
      expect(content).not.toMatch(/\d/);
    }
  });
});
