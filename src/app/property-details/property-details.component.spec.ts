import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER, of, throwError } from 'rxjs';

import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';
import { PropertyDetailsComponent } from './property-details.component';
import { PropertyDTO } from '../dto/property.dto';
import { PropertyType } from '../dto/property-type.enum';
import { createSsrRenderState, SSR_RENDER_STATE, SsrRenderState } from '../ssr-render-state';

describe('PropertyDetailsComponent', () => {
  let component: PropertyDetailsComponent;
  let fixture: ComponentFixture<PropertyDetailsComponent>;
  let propertyFormService: jasmine.SpyObj<PropertyFormServiceService>;
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
    propertyFormService = jasmine.createSpyObj<PropertyFormServiceService>('PropertyFormServiceService', ['getPropertyById', 'getPhotos']);
    propertyFormService.getPropertyById.and.returnValue(NEVER);
    propertyFormService.getPhotos.and.returnValue(NEVER);
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
          provide: PropertyFormServiceService,
          useValue: propertyFormService
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
    propertyFormService.getPropertyById.and.returnValue(throwError(() => upstreamError));
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
    propertyFormService.getPropertyById.and.returnValue(throwError(() => upstreamError));
    component.propertyId = 'prop-1';

    expect(() => component.loadPropertyDetails()).not.toThrow();

    expect(ssrRenderState.serviceUnavailable).toBeTrue();
    expect(ssrRenderState.error).toBe(upstreamError);
    expect(loadingOffSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('loads only the initial photo batch on the server', () => {
    configure('server');
    propertyFormService.getPropertyById.and.returnValue(of(property));
    propertyFormService.getPhotos.and.returnValue(of({
      photos: ['photo-1', 'photo-2'],
      total: 5
    }));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(propertyFormService.getPhotos).toHaveBeenCalledTimes(1);
    expect(propertyFormService.getPhotos).toHaveBeenCalledWith('prop-1', 0, 2);
    expect(component.photoSlides.length).toBe(2);
  });

  it('continues loading remaining photo batches in the browser', () => {
    configure('browser');
    propertyFormService.getPropertyById.and.returnValue(of(property));
    propertyFormService.getPhotos.and.callFake((_propertyId: string, offset: number) => of(
      offset === 0
        ? { photos: ['photo-1', 'photo-2'], total: 5 }
        : { photos: ['photo-3', 'photo-4', 'photo-5'], total: 5 }
    ));
    component.propertyId = 'prop-1';

    component.loadPropertyDetails();

    expect(propertyFormService.getPhotos).toHaveBeenCalledTimes(2);
    expect(propertyFormService.getPhotos).toHaveBeenCalledWith('prop-1', 0, 2);
    expect(propertyFormService.getPhotos).toHaveBeenCalledWith('prop-1', 2, 3);
    expect(component.photoSlides.length).toBe(5);
  });
});
