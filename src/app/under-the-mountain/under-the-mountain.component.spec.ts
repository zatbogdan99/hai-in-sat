import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { UnderTheMountainComponent } from './under-the-mountain.component';

describe('UnderTheMountainComponent', () => {
  let component: UnderTheMountainComponent;
  let fixture: ComponentFixture<UnderTheMountainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UnderTheMountainComponent],
      providers: [provideRouter([])]
    });
    fixture = TestBed.createComponent(UnderTheMountainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the visible introduction as the only page heading', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1') as NodeListOf<HTMLHeadingElement>;
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('De ce Oltenia de sub Munte?');
    expect(headings[0].classList.contains('why__title')).toBeTrue();
  });

  it('links every village card to its own page, with a single interactive element per card', () => {
    const cards = Array.from(fixture.nativeElement.querySelectorAll('swiper-slide') as NodeListOf<HTMLElement>);
    expect(cards.length).toBe(7);
    const hrefs = cards.map(card => card.querySelector('a.discover-card')?.getAttribute('href'));
    expect(hrefs).toEqual(['/sate/horezu', '/sate/polovragi', '/sate/baia-de-fier', '/sate/vaideeni', '/sate/slatioara', '/sate/costesti', '/sate/barbatesti']);
    for (const card of cards) {
      expect(card.querySelectorAll('a, button, [role="button"]').length).toBe(1);
    }
  });
});
