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

  describe('autoplay (TASK-136)', () => {
    type SwiperHost = HTMLElement & { swiper: any };
    const swiperOf = (target: ComponentFixture<UnderTheMountainComponent>) =>
      (target.nativeElement as HTMLElement).querySelector('swiper-container') as SwiperHost;
    const toggle = (target: ComponentFixture<UnderTheMountainComponent>) =>
      (target.nativeElement as HTMLElement).querySelector('.discover__autoplay') as HTMLButtonElement;
    // Swiper se inițializează într-un setTimeout din ngAfterViewInit.
    const initialized = async (target: ComponentFixture<UnderTheMountainComponent>) => {
      for (let i = 0; i < 50 && !swiperOf(target).swiper?.initialized; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      target.detectChanges();
    };

    it('advances every 5 seconds and stops for good on manual interaction', async () => {
      await initialized(fixture);
      const swiper = swiperOf(fixture).swiper;

      expect(swiper.params.autoplay.enabled).toBeTrue();
      expect(swiper.params.autoplay.delay).toBe(5000);
      expect(swiper.params.autoplay.disableOnInteraction).toBeTrue();
      expect(swiper.autoplay.running).toBeTrue();
      expect(swiper.wrapperEl.getAttribute('aria-live')).toBe('off');
      expect(toggle(fixture).getAttribute('aria-label')).toBe('Oprește derularea automată');
    });

    it('stops for good when an arrow is used, and the button shows Play', async () => {
      await initialized(fixture);
      (fixture.nativeElement.querySelector('.discover-next') as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 0));
      fixture.detectChanges();

      expect(swiperOf(fixture).swiper.autoplay.running).toBeFalse();
      expect(toggle(fixture).getAttribute('aria-label')).toBe('Pornește derularea automată');
      expect(swiperOf(fixture).swiper.wrapperEl.getAttribute('aria-live')).toBe('polite');
    });

    it('toggles with the Pause/Play button', async () => {
      await initialized(fixture);
      const swiper = swiperOf(fixture).swiper;

      toggle(fixture).click();
      fixture.detectChanges();
      expect(swiper.autoplay.running).toBeFalse();
      expect(toggle(fixture).getAttribute('aria-label')).toBe('Pornește derularea automată');
      expect(toggle(fixture).type).toBe('button');

      toggle(fixture).click();
      fixture.detectChanges();
      expect(swiper.autoplay.running).toBeTrue();
      expect(toggle(fixture).getAttribute('aria-label')).toBe('Oprește derularea automată');
    });

    it('pauses while keyboard focus is inside the carousel and resumes when it leaves', async () => {
      await initialized(fixture);
      const swiper = swiperOf(fixture).swiper;
      const cards = fixture.nativeElement.querySelector('.discover__cards') as HTMLElement;
      const next = fixture.nativeElement.querySelector('.discover-next') as HTMLButtonElement;

      next.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(swiper.autoplay.paused).toBeTrue();
      expect(swiper.autoplay.running).toBeTrue();

      next.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
      expect(swiper.autoplay.paused).toBeFalse();
      expect(swiper.autoplay.running).toBeTrue();
      expect(cards.contains(next)).toBeTrue();
      expect(toggle(fixture).getAttribute('aria-label')).toBe('Oprește derularea automată');
    });

    it('starts stopped when the visitor prefers reduced motion', async () => {
      const realMatchMedia = window.matchMedia.bind(window);
      spyOn(window, 'matchMedia').and.callFake((query: string) => query.includes('prefers-reduced-motion')
        ? { matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {},
            addListener() {}, removeListener() {}, dispatchEvent: () => false } as MediaQueryList
        : realMatchMedia(query));
      const reduced = TestBed.createComponent(UnderTheMountainComponent);
      reduced.detectChanges();
      await initialized(reduced);

      expect(swiperOf(reduced).swiper.autoplay.running).toBeFalse();
      expect(toggle(reduced).getAttribute('aria-label')).toBe('Pornește derularea automată');
      reduced.destroy();
    });
  });
});
