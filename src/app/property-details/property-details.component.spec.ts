import { makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER, of, throwError } from 'rxjs';

import { PropertyApiService } from '../service/property-api/property-api.service';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';
import { PropertyDetailsComponent } from './property-details.component';
import { PropertyDTO } from '../dto/property.dto';
import { PropertyType } from '../dto/property-type.enum';
import { createSsrRenderState, SSR_RENDER_STATE, SsrRenderState } from '../ssr-render-state';
import { SeoService } from '../service/seo.service';
import { LoggerService } from '../service/logger.service';

describe('PropertyDetailsComponent', () => {
  let component: PropertyDetailsComponent;
  let fixture: ComponentFixture<PropertyDetailsComponent>;
  let propertyApiService: jasmine.SpyObj<PropertyApiService>;
  let router: Router;
  let ssrRenderState: SsrRenderState;

  const property: PropertyDTO = {
    id: 'prop-1',
    name: 'Test property',
    description: 'Description',
    type: PropertyType.LAND,
    thumbnail: 'thumbnail'
  };

  function configure(platformId: 'browser' | 'server' = 'browser', queryParams: Record<string, string> = {}): void {
    propertyApiService = jasmine.createSpyObj<PropertyApiService>('PropertyApiService', ['getPropertyById', 'getPhotos']);
    propertyApiService.getPropertyById.and.returnValue(NEVER);
    propertyApiService.getPhotos.and.returnValue(NEVER);
    ssrRenderState = createSsrRenderState();

    TestBed.configureTestingModule({
      imports: [PropertyDetailsComponent, RouterTestingModule],
      providers: [
        LoadingService,
        PropertiesStateService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: NEVER,
            snapshot: {
              params: {},
              queryParamMap: convertToParamMap(queryParams)
            }
          }
        },
        {
          provide: PropertyApiService,
          useValue: propertyApiService
        },
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: SSR_RENDER_STATE, useValue: ssrRenderState }
      ]
    });

    fixture = TestBed.createComponent(PropertyDetailsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('leaves the photos to the browser during SSR, keeping the HTML small and cacheable', () => {
    configure('server');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    propertyApiService.getPropertyById.and.returnValue(of(property));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();
    fixture.detectChanges();

    expect(propertyApiService.getPhotos).not.toHaveBeenCalled();
    expect(ssrRenderState.cacheable).toBeTrue();
    expect(ssrRenderState.serviceUnavailable).toBeFalse();
    expect(component.propertyName).toBe(property.name);
    // Galeria și banda de miniaturi rămân loc rezervat (fără mesajul „fără fotografii”): pozele vin după hidratare.
    expect(fixture.nativeElement.querySelector('.gallery')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.gallery-empty')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.thumb-strip .thumb--pending').length).toBe(4);
  });

  for (const platform of ['server', 'browser'] as const) {
    it(`${platform === 'server' ? 'leaves out' : 'keeps'} a large base64 video poster on the ${platform}`, () => {
      configure(platform);
      spyOn(router, 'navigate').and.resolveTo(true);
      const poster = `data:image/jpeg;base64,${'A'.repeat(200 * 1024)}`;
      propertyApiService.getPropertyById.and.returnValue(of({ ...property, videoUrl: 'https://storage.googleapis.com/b/v.mp4', thumbnail: poster }));
      propertyApiService.getPhotos.and.returnValue(of({ photos: [], total: 0 }));
      component.propertyId = 'prop-1';

      component.loadPropertyDetails();
      fixture.detectChanges();

      expect(component.propertyVideoPoster).toBe(platform === 'server' ? null : poster);
      // Fără poster, atributul lipsește: legătura pe proprietate scria „null” și browserul cerea /null.
      for (const video of Array.from(fixture.nativeElement.querySelectorAll('video')) as HTMLVideoElement[]) {
        expect(video.getAttribute('poster')).toBe(platform === 'server' ? null : poster);
      }
      expect(fixture.nativeElement.querySelectorAll('video').length).toBeGreaterThan(0);
    });
  }

  it('uses the static share image instead of a base64 thumbnail in meta tags and JSON-LD', () => {
    configure('server');
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const seo = TestBed.inject(SeoService);
    const metaSpy = spyOn(seo, 'updatePageMeta');
    const listingSpy = spyOn(seo, 'setRealEstateListing');
    propertyApiService.getPropertyById.and.returnValue(of({ ...property, thumbnail: 'data:image/jpeg;base64,AAAA' }));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    const shareImage = 'https://hai-în-sat.ro/assets/og-hai-in-sat.jpg';
    expect(metaSpy).toHaveBeenCalledWith(jasmine.objectContaining({ ogImage: shareImage }));
    expect(listingSpy).toHaveBeenCalledWith(jasmine.objectContaining({ image: shareImage }));
  });

  it('should create', () => {
    configure();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders both back links with the page, size and filter from the detail URL', () => {
    configure('browser', { page: '2', size: '12', type: 'house' });
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a.back-btn') as NodeListOf<HTMLAnchorElement>;
    expect(links.length).toBe(2);
    for (const link of Array.from(links)) {
      expect(link.getAttribute('href')).toBe('/properties?page=2&size=12&type=house');
    }
  });

  for (const queryParams of [{}, { page: 'invalid', size: 'Infinity', type: 'farm' }] as Record<string, string>[]) {
    it(`uses saved list state in back links when query values are ${Object.keys(queryParams).length ? 'invalid' : 'absent'}`, () => {
      configure('browser', queryParams);
      const state = TestBed.inject(PropertiesStateService);
      state.setPage(3);
      state.setSize(12);
      state.setPropertyType('house');
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('a.back-btn') as NodeListOf<HTMLAnchorElement>;
      expect(links.length).toBe(2);
      for (const link of Array.from(links)) {
        expect(link.getAttribute('href')).toBe('/properties?page=3&size=12&type=house');
      }
    });
  }

  it('should render the description in the dedicated paragraph element', () => {
    configure();
    component.propertyDescription = 'Linia 1\nLinia 2';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const descEl = compiled.querySelector('.property-description') as HTMLElement | null;
    expect(descEl).toBeTruthy();
    expect(descEl!.classList.contains('property-description')).toBeTrue();
    expect(descEl!.textContent).toContain('Linia 1');
    expect(descEl!.textContent).toContain('Linia 2');
  });

  it('keeps the browser redirect behavior when getPropertyById fails', () => {
    configure('browser');
    const loadingService = TestBed.inject(LoadingService);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const loadingOffSpy = spyOn(loadingService, 'loadingOff').and.callThrough();
    const upstreamError = new Error('Network error');
    (upstreamError as Error & { status: number }).status = 0;
    propertyApiService.getPropertyById.and.returnValue(throwError(() => upstreamError));
    component.propertyId = 'prop-1';

    expect(() => component.loadPropertyDetails()).not.toThrow();

    expect(loadingOffSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/properties']);
  });

  it('marks transient upstream errors on the server so SSR can return 503', () => {
    configure('server');
    const loadingService = TestBed.inject(LoadingService);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const loadingOffSpy = spyOn(loadingService, 'loadingOff').and.callThrough();
    const upstreamError = new Error('Backend unavailable');
    (upstreamError as Error & { status: number }).status = 503;
    propertyApiService.getPropertyById.and.returnValue(throwError(() => upstreamError));
    component.propertyId = 'prop-1';

    expect(() => component.loadPropertyDetails()).not.toThrow();

    expect(ssrRenderState.serviceUnavailable).toBeTrue();
    expect(ssrRenderState.notFound).toBeFalse();
    expect(ssrRenderState.error).toBe(upstreamError);
    expect(loadingOffSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  for (const response of ['empty', '404', '400']) {
    it(`renders a noindex 404 during SSR for a ${response} property response`, () => {
      configure('server');
      const navigateSpy = spyOn(router, 'navigate');
      propertyApiService.getPropertyById.and.returnValue(response === 'empty'
        ? of(null as unknown as PropertyDTO)
        : throwError(() => ({ status: Number(response) })));
      component.propertyId = 'missing-property';

      component.loadPropertyDetails();
      fixture.detectChanges();

      expect(ssrRenderState.notFound).toBeTrue();
      expect(ssrRenderState.serviceUnavailable).toBeFalse();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(propertyApiService.getPhotos).not.toHaveBeenCalled();
      expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Pagina nu a fost găsită');
      expect(fixture.nativeElement.querySelector('a[href="/properties"]')).toBeTruthy();
      expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');
      expect(TestBed.inject(TransferState).get(makeStateKey<boolean>('property-not-found:missing-property'), false)).toBeTrue();
    });
  }

  it('preserves the SSR missing-property page during browser hydration without refetching', () => {
    configure('browser');
    const transferState = TestBed.inject(TransferState);
    const key = makeStateKey<boolean>('property-not-found:missing-property');
    transferState.set(key, true);
    component.propertyId = 'missing-property';

    component.loadPropertyDetails();
    fixture.detectChanges();

    expect(component.propertyNotFound).toBeTrue();
    expect(propertyApiService.getPropertyById).not.toHaveBeenCalled();
    expect(transferState.hasKey(key)).toBeFalse();
    expect(ssrRenderState.notFound).toBeFalse();
    expect(fixture.nativeElement.querySelector('a[href="/properties"]')).toBeTruthy();
  });

  it('restores indexable metadata when the reused component loads an existing property', () => {
    configure('browser');
    propertyApiService.getPropertyById.and.returnValue(throwError(() => ({ status: 404 })));
    component.propertyId = 'missing-property';
    component.loadPropertyDetails();
    fixture.detectChanges();
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');

    propertyApiService.getPropertyById.and.returnValue(of(property));
    propertyApiService.getPhotos.and.returnValue(of({ photos: [], total: 0 }));
    spyOn(router, 'navigate').and.resolveTo(true);
    component.propertyId = 'prop-1';
    component.loadPropertyDetails();
    fixture.detectChanges();

    expect(component.propertyNotFound).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-not-found')).toBeNull();
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('index, follow');
  });

  it('says the photos failed to load, not that there are none, when the first batch fails in the browser', () => {
    configure('browser');
    spyOn(router, 'navigate').and.resolveTo(true);
    propertyApiService.getPropertyById.and.returnValue(of(property));
    propertyApiService.getPhotos.and.returnValue(throwError(() => ({ status: 503 })));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();
    fixture.detectChanges();

    expect(component.photosLoaded).toBeTrue();
    expect(fixture.nativeElement.querySelector('.gallery')).toBeNull();
    expect(fixture.nativeElement.querySelector('.gallery-empty').textContent).toContain('nu s-au putut încărca');
  });

  it('replaces the empty gallery with a message when the property has no photos', () => {
    configure('browser');
    spyOn(router, 'navigate').and.resolveTo(true);
    propertyApiService.getPropertyById.and.returnValue(of(property));
    propertyApiService.getPhotos.and.returnValue(of({ photos: [], total: 0 }));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.gallery')).toBeNull();
    expect(fixture.nativeElement.querySelector('.gallery-nav')).toBeNull();
    expect(fixture.nativeElement.querySelector('.gallery-empty').textContent).toContain('Proprietatea nu are încă fotografii.');
  });

  it('continues loading remaining photo batches in the browser with aligned offsets', () => {
    configure('browser');
    propertyApiService.getPropertyById.and.returnValue(of(property));
    propertyApiService.getPhotos.and.callFake((_propertyId: string, offset: number) => of(
      offset === 0
        ? { photos: ['photo-1', 'photo-2', 'photo-3'], total: 5 }
        : { photos: ['photo-4', 'photo-5'], total: 5 }
    ));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(propertyApiService.getPhotos).toHaveBeenCalledTimes(2);
    expect(propertyApiService.getPhotos).toHaveBeenCalledWith('prop-1', 0, 3);
    expect(propertyApiService.getPhotos).toHaveBeenCalledWith('prop-1', 3, 3);
    expect(component.photoSlides.map(slide => slide.src)).toEqual(['photo-1', 'photo-2', 'photo-3', 'photo-4', 'photo-5']);
  });

  it('never duplicates a photo when a batch repeats earlier ones, and stops on an empty batch', () => {
    configure('browser');
    propertyApiService.getPropertyById.and.returnValue(of(property));
    // Backendul vechi întorcea aceleași poze pentru offseturi nealiniate.
    propertyApiService.getPhotos.and.callFake((_propertyId: string, offset: number) => of(
      offset === 0 ? { photos: ['photo-1', 'photo-2', 'photo-3'], total: 8 }
        : offset === 3 ? { photos: ['photo-1', 'photo-2', 'photo-4'], total: 8 }
          : { photos: [], total: 8 }
    ));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(component.photoSlides.map(slide => slide.src)).toEqual(['photo-1', 'photo-2', 'photo-3', 'photo-4']);
    expect(propertyApiService.getPhotos).toHaveBeenCalledTimes(3);
  });

  describe('gallery controls', () => {
    function loadPhotos(count: number): void {
      configure('browser');
      spyOn(router, 'navigate').and.resolveTo(true);
      propertyApiService.getPropertyById.and.returnValue(of(property));
      const photos = Array.from({ length: count }, (_, i) => `photo-${i + 1}`);
      propertyApiService.getPhotos.and.callFake((_propertyId: string, offset: number, limit: number) =>
        of({ photos: photos.slice(offset, offset + limit), total: count }));
      component.propertyId = 'prop-1';
      component.loadPropertyDetails();
      fixture.detectChanges();
    }

    it('offers a focusable thumbnail for every photo, not only the first four', () => {
      loadPhotos(7);

      const thumbs = fixture.nativeElement.querySelectorAll('.thumb-strip button.thumb') as NodeListOf<HTMLButtonElement>;
      expect(thumbs.length).toBe(7);
      expect(fixture.nativeElement.querySelector('.thumb--pending')).toBeNull();
      expect(thumbs[6].getAttribute('aria-label')).toBe('Fotografia 7 din 7');
      expect(thumbs[0].getAttribute('aria-current')).toBe('true');
    });

    it('hides the arrows and the thumbnails for a single photo', () => {
      loadPhotos(1);

      expect(fixture.nativeElement.querySelector('.gallery-nav')).toBeNull();
      expect(fixture.nativeElement.querySelector('.thumb-strip')).toBeNull();
      expect(fixture.nativeElement.querySelector('.gallery-counter').textContent.trim()).toBe('1 / 1');
    });

    it('changes the photo with the arrow keys when the gallery has focus', () => {
      loadPhotos(3);
      const gallery = fixture.nativeElement.querySelector('.gallery') as HTMLElement;
      expect(gallery.getAttribute('tabindex')).toBe('0');

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true });
      gallery.dispatchEvent(event);

      expect(component.currentIndex).toBe(1);
      expect(event.defaultPrevented).toBeTrue();
    });

    it('changes the photo with a horizontal finger swipe but ignores mouse drags and vertical scrolls', () => {
      loadPhotos(3);
      const touch = (x: number, y: number, pointerType = 'touch') =>
        ({ pointerType, isPrimary: true, clientX: x, clientY: y, target: null }) as unknown as PointerEvent;

      component.onSwipeStart(touch(200, 100, 'mouse'));
      component.onSwipeEnd(touch(100, 100, 'mouse'), 'photos');
      expect(component.currentIndex).toBe(0);

      component.onSwipeStart(touch(200, 100));
      component.onSwipeEnd(touch(180, 220), 'photos');
      expect(component.currentIndex).toBe(0);

      component.onSwipeStart(touch(200, 100));
      component.onSwipeEnd(touch(120, 110), 'photos');
      expect(component.currentIndex).toBe(1);
    });
  });

  it('uses decoded plain text for meta and JSON-LD descriptions', () => {
    configure('browser');
    const seo = TestBed.inject(SeoService);
    const updatePageMetaSpy = spyOn(seo, 'updatePageMeta');
    const setRealEstateListingSpy = spyOn(seo, 'setRealEstateListing');
    propertyApiService.getPropertyById.and.returnValue(of({
      ...property,
      name: 'Casa test',
      description: '<p>Casa <strong>frumoasă</strong> &amp; aproape</p>'
    }));
    propertyApiService.getPhotos.and.returnValue(of({ photos: [], total: 0 }));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(updatePageMetaSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      description: 'Teren de vânzare în Oltenia de sub Munte: Casa test. Casa frumoasă & aproape'
    }));
    expect(setRealEstateListingSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      description: 'Casa frumoasă & aproape'
    }));
    expect(component.propertyDescription).toBe('<p>Casa <strong>frumoasă</strong> &amp; aproape</p>');
  });

  for (const platform of ['browser', 'server'] as const) {
    it(`removes phones before SEO truncation but preserves visible content on ${platform}`, () => {
      configure(platform);
      spyOn(router, 'navigate').and.resolveTo(true);
      const seo = TestBed.inject(SeoService);
      const listingSpy = spyOn(seo, 'setRealEstateListing').and.callThrough();
      // Both phones cross the old 150/300 character truncation boundaries.
      const intro = `${'a'.repeat(139)} Telefon:`;
      const middle = 'b'.repeat(136);
      const description = `<p>${intro} 0763144967 ${middle} +40&nbsp;728&nbsp;140&nbsp;628 final</p>`;
      const name = 'Casa +40 768 915 198';
      propertyApiService.getPropertyById.and.returnValue(of({ ...property, name, description }));
      propertyApiService.getPhotos.and.returnValue(of({ photos: [], total: 0 }));
      component.propertyId = 'prop-1';

      component.loadPropertyDetails();
      fixture.detectChanges();

      const expectedPlainText = `${intro} ${middle} final`;
      const meta = TestBed.inject(Meta);
      for (const selector of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
        expect(meta.getTag(selector)?.content)
          .toBe(`Teren de vânzare în Oltenia de sub Munte: Casa. ${expectedPlainText.substring(0, 150)}`);
      }
      expect(listingSpy).toHaveBeenCalledWith(jasmine.objectContaining({
        description: expectedPlainText.substring(0, 300)
      }));
      expect(component.propertyName).toBe(name);
      expect(component.propertyDescription).toBe(description);
      const visibleDescription = fixture.nativeElement.querySelector('.property-description') as HTMLElement;
      expect(visibleDescription.textContent).toContain('0763144967');
      expect(visibleDescription.querySelector('a[href="tel:0763144967"]')).toBeTruthy();
    });
  }

  it('warns and uses the land fallback when the API returns an unknown property type', () => {
    configure('browser');
    const invalidProperty = {
      ...property,
      id: 'prop-invalid',
      name: 'Proprietate experimentală',
      type: 'farm'
    } as unknown as PropertyDTO;
    const logger = TestBed.inject(LoggerService);
    const seo = TestBed.inject(SeoService);
    const warnSpy = spyOn(logger, 'warn');
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    const setRealEstateListingSpy = spyOn(seo, 'setRealEstateListing');
    propertyApiService.getPropertyById.and.returnValue(of(invalidProperty));
    propertyApiService.getPhotos.and.returnValue(of({ photos: [], total: 0 }));
    component.propertyId = 'prop-invalid';

    expect(() => component.loadPropertyDetails()).not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      'Tip de proprietate necunoscut: farm (proprietatea prop-invalid)'
    );
    expect(component.propertyKind).toBe(PropertyType.LAND);
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/property', 'prop-invalid', 'teren-de-vanzare-proprietate-experimentala'],
      {
        replaceUrl: true,
        queryParamsHandling: 'preserve'
      }
    );
    expect(setRealEstateListingSpy).toHaveBeenCalledWith(jasmine.objectContaining({
      url: '/property/prop-invalid/teren-de-vanzare-proprietate-experimentala',
      propertyType: 'land'
    }));
  });
});
