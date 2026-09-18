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

  function configure(platformId: 'browser' | 'server' = 'browser'): void {
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
              queryParamMap: convertToParamMap({})
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

  it('should create', () => {
    configure();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

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

  it('loads only the initial photo batch on the server', () => {
    configure('server');
    propertyApiService.getPropertyById.and.returnValue(of(property));
    propertyApiService.getPhotos.and.returnValue(of({
      photos: ['photo-1', 'photo-2'],
      total: 5
    }));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(propertyApiService.getPhotos).toHaveBeenCalledTimes(1);
    expect(propertyApiService.getPhotos).toHaveBeenCalledWith('prop-1', 0, 2);
    expect(component.photoSlides.length).toBe(2);
  });

  it('continues loading remaining photo batches in the browser', () => {
    configure('browser');
    propertyApiService.getPropertyById.and.returnValue(of(property));
    propertyApiService.getPhotos.and.callFake((_propertyId: string, offset: number) => of(
      offset === 0
        ? { photos: ['photo-1', 'photo-2'], total: 5 }
        : { photos: ['photo-3', 'photo-4', 'photo-5'], total: 5 }
    ));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(propertyApiService.getPhotos).toHaveBeenCalledTimes(2);
    expect(propertyApiService.getPhotos).toHaveBeenCalledWith('prop-1', 0, 2);
    expect(propertyApiService.getPhotos).toHaveBeenCalledWith('prop-1', 2, 3);
    expect(component.photoSlides.length).toBe(5);
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
