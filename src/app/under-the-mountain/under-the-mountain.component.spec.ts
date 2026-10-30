import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideRouter } from '@angular/router';

import { UnderTheMountainComponent } from './under-the-mountain.component';
import { ImageLoadTracker } from '../utils/image-load-tracker';

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

  it('shows a skeleton on every card photo until it loads, and removes it on load or error', () => {
    // O instanță nouă, fără citirea stării din DOM: în Karma pozele dau 404 și pot fi deja „complete” din cache.
    spyOn(ImageLoadTracker.prototype, 'syncFrom');
    // Doar evenimentele trimise de test contează (cele reale, 404 în Karma, pot sosi oricând).
    const markLoaded = ImageLoadTracker.prototype.markLoaded;
    let fromTest = false;
    spyOn(ImageLoadTracker.prototype, 'markLoaded').and.callFake(function (this: ImageLoadTracker, src) {
      if (fromTest) {
        markLoaded.call(this, src);
      }
    });
    const send = (img: HTMLImageElement, type: 'load' | 'error') => { fromTest = true; img.dispatchEvent(new Event(type)); fromTest = false; };
    const fresh = TestBed.createComponent(UnderTheMountainComponent);
    fresh.detectChanges();
    const images = Array.from(fresh.nativeElement.querySelectorAll('.discover-card__img img') as NodeListOf<HTMLImageElement>);
    expect(images.length).toBe(7);
    expect(images.every(img => img.classList.contains('skeleton'))).toBeTrue();

    send(images[0], 'load');
    send(images[1], 'error');
    fresh.detectChanges();

    expect(images[0].classList.contains('skeleton')).toBeFalse();
    expect(images[1].classList.contains('skeleton')).toBeFalse();
    expect(images[2].classList.contains('skeleton')).toBeTrue();
    fresh.destroy();
  });

  it('marks the carousel ready only once Swiper is initialized', async () => {
    const cards = fixture.nativeElement.querySelector('.discover__cards') as HTMLElement;
    for (let i = 0; i < 50 && !(fixture.nativeElement.querySelector('swiper-container') as any).swiper?.initialized; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    fixture.detectChanges();
    expect(cards.classList.contains('is-ready')).toBeTrue();
  });

  describe('autoplay (TASK-136)', () => {
    type SwiperHost = HTMLElement & { swiper: any };
    const swiperOf = (target: ComponentFixture<UnderTheMountainComponent>) =>
      (target.nativeElement as HTMLElement).querySelector('swiper-container') as SwiperHost;
    // Swiper se inițializează într-un setTimeout din ngAfterViewInit.
    const initialized = async (target: ComponentFixture<UnderTheMountainComponent>) => {
      for (let i = 0; i < 50 && !swiperOf(target).swiper?.initialized; i++) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      target.detectChanges();
    };

    it('advances every 5 seconds and stops for good on manual interaction, without a control button', async () => {
      await initialized(fixture);
      const swiper = swiperOf(fixture).swiper;

      expect(swiper.params.autoplay.enabled).toBeTrue();
      expect(swiper.params.autoplay.delay).toBe(5000);
      expect(swiper.params.autoplay.disableOnInteraction).toBeTrue();
      expect(swiper.autoplay.running).toBeTrue();
      expect(swiper.wrapperEl.getAttribute('aria-live')).toBe('off');
      expect(fixture.nativeElement.querySelector('.discover__autoplay')).toBeNull();
    });

    it('stops for good when an arrow is used', async () => {
      await initialized(fixture);
      (fixture.nativeElement.querySelector('.discover-next') as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(swiperOf(fixture).swiper.autoplay.running).toBeFalse();
      expect(swiperOf(fixture).swiper.wrapperEl.getAttribute('aria-live')).toBe('polite');
    });

    it('pauses while keyboard focus is inside the carousel and resumes when it leaves', async () => {
      await initialized(fixture);
      const swiper = swiperOf(fixture).swiper;
      const next = fixture.nativeElement.querySelector('.discover-next') as HTMLButtonElement;

      next.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(swiper.autoplay.running).toBeFalse();
      expect(swiper.wrapperEl.getAttribute('aria-live')).toBe('off');

      next.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
      expect(swiper.autoplay.running).toBeTrue();
    });

    it('treats an arrow used during the temporary pause as a definitive stop', async () => {
      await initialized(fixture);
      const swiper = swiperOf(fixture).swiper;
      const next = fixture.nativeElement.querySelector('.discover-next') as HTMLButtonElement;

      next.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      next.click();
      next.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));

      expect(swiper.autoplay.running).toBeFalse();
      expect(swiper.wrapperEl.getAttribute('aria-live')).toBe('polite');
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
      expect(swiperOf(reduced).swiper.wrapperEl.getAttribute('aria-live')).toBe('polite');
      reduced.destroy();
    });
  });
});
