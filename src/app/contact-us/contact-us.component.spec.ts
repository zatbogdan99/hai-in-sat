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

  it('has one shared contact heading outside the responsive branches', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1') as NodeListOf<HTMLHeadingElement>;
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('Contactează Hai în Sat — agenție imobiliară în Horezu');
    expect(headings[0].closest('.large-screen, .small-screen')).toBeNull();
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

  it('links desktop social contacts to the real profiles in a separate tab', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('.large-screen a[href^="https://"]')) as HTMLAnchorElement[];
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      'https://www.instagram.com/hai.in.sat?igsh=MXh5NmFqcXhjdThtYQ%3D%3D&utm_source=qr',
      'https://www.facebook.com/profile.php?id=61560478122728&is_tour_dismissed',
      'https://www.tiktok.com/@hai.in.sat?_t=8n1yemWQQMr&_r=1'
    ]);
    for (const link of links) {
      expect(link.target).toBe('_blank');
      expect(link.relList.contains('noopener')).toBeTrue();
    }
    expect(fixture.nativeElement.querySelector('a[href="#"]')).toBeNull();
  });
});
