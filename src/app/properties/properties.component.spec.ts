import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PropertiesComponent } from './properties.component';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertyContactService } from '../service/property-contact/property-contact.service';
import { PropertyApiService } from '../service/property-api/property-api.service';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';
import { PropertyDTO } from '../dto/property.dto';
import { createSsrRenderState, SSR_RENDER_STATE, SsrRenderState } from '../ssr-render-state';

describe('PropertiesComponent', () => {
  let component: PropertiesComponent;
  let fixture: ComponentFixture<PropertiesComponent>;
  let propertyApiService: jasmine.SpyObj<PropertyApiService>;
  let propertyContactService: jasmine.SpyObj<PropertyContactService>;
  let propertiesState: PropertiesStateService;
  let ssrRenderState: SsrRenderState;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const createComponent = (queryParams: Record<string, string> = {}) => {
    TestBed.resetTestingModule();
    ssrRenderState = createSsrRenderState();
    propertyApiService = jasmine.createSpyObj<PropertyApiService>('PropertyApiService', ['getPropertiesPage']);
    propertyContactService = jasmine.createSpyObj<PropertyContactService>('PropertyContactService', ['sendPropertyForm']);
    queryParamMap = new BehaviorSubject(convertToParamMap(queryParams));

    propertyApiService.getPropertiesPage.and.returnValue(
      of({ content: [], totalElements: 0, totalPages: 0, size: 6, number: 0 })
    );
    propertyContactService.sendPropertyForm.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [PropertiesComponent, RouterTestingModule],
      providers: [
        provideNoopAnimations(),
        LoadingService,
        PropertiesStateService,
        { provide: SSR_RENDER_STATE, useValue: ssrRenderState },
        {
          provide: PropertyApiService,
          useValue: propertyApiService
        },
        {
          provide: PropertyContactService,
          useValue: propertyContactService
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap.asObservable(),
            snapshot: {
              queryParamMap: convertToParamMap(queryParams)
            }
          }
        }
      ]
    });

    propertiesState = TestBed.inject(PropertiesStateService);
    fixture = TestBed.createComponent(PropertiesComponent);
    component = fixture.componentInstance;
  };

  it('does not cache an empty page caused by a failed API request during SSR', () => {
    createComponent();
    propertyApiService.getPropertiesPage.and.returnValue(throwError(() => ({ status: 503 })));
    fixture.detectChanges();
    expect(ssrRenderState.cacheable).toBeFalse();
    expect(ssrRenderState.serviceUnavailable).toBeFalse();
    expect(component.properties).toEqual([]);
  });

  it('keeps a genuinely empty API result cacheable', () => {
    createComponent();
    fixture.detectChanges();
    expect(ssrRenderState.cacheable).toBeTrue();
  });

  it('does not discard a valid rendered page when only prefetch fails', () => {
    createComponent();
    propertyApiService.getPropertiesPage.and.callFake(page => page === 0
      ? of({ content: [], totalElements: 7, totalPages: 2, size: 6, number: 0 })
      : throwError(() => ({ status: 503 })));
    fixture.detectChanges();
    expect(propertyApiService.getPropertiesPage).toHaveBeenCalledTimes(2);
    expect(ssrRenderState.cacheable).toBeTrue();
  });

  it('should restore page, size and filter from query params and use cache', () => {
    createComponent({ page: '2', size: '6', type: 'house' });

    const cachedProperties: PropertyDTO[] = [
      {
        id: '1',
        name: 'Casa test',
        description: 'Descriere',
        type: 'house',
        thumbnail: 'thumb.jpg'
      } as PropertyDTO
    ];

    propertiesState.setCachedPage(2, 6, 'house', cachedProperties);
    propertiesState.setTotalRecords(10);
    propertiesState.setTotalPages(2);

    fixture.detectChanges();

    expect(component.page).toBe(2);
    expect(component.size).toBe(6);
    expect(component.propertyType).toBe('house');
    expect(component.properties).toEqual(cachedProperties);
    expect(propertyApiService.getPropertiesPage).not.toHaveBeenCalled();
  });

  it('should fetch page data when cache is missing', () => {
    const responseProperties: PropertyDTO[] = [
      {
        id: '2',
        name: 'Teren test',
        description: 'Descriere 2',
        type: 'land',
        thumbnail: 'thumb-2.jpg'
      } as PropertyDTO
    ];

    createComponent({ page: '1', size: '6', type: 'land' });
    propertyApiService.getPropertiesPage.and.returnValue(
      of({ content: responseProperties, totalElements: 1, totalPages: 1, size: 6, number: 1 })
    );

    fixture.detectChanges();

    expect(propertyApiService.getPropertiesPage).toHaveBeenCalledWith(1, 6, 'land');
    expect(component.properties).toEqual(responseProperties);
    expect(propertiesState.getCachedPage(1, 6, 'land')).toEqual(responseProperties);
  });

  it('should render the phone link with tel scheme in the contact dialog', () => {
    createComponent();
    component.displayModal = true;

    fixture.detectChanges();

    const telLink = fixture.nativeElement.querySelector('a.contact-item[href^="tel:"]') as HTMLAnchorElement | null;
    expect(telLink).toBeTruthy();
    expect(telLink!.getAttribute('href')).toBe('tel:+40728140628');
  });

  it('should require name, village and at least one contact method before submit', () => {
    createComponent();

    component.saveProperty();

    expect(component.propertyForm.get('firstName')?.hasError('required')).toBeTrue();
    expect(component.propertyForm.get('village')?.hasError('required')).toBeTrue();
    expect(component.propertyForm.hasError('contactRequired')).toBeTrue();
    expect(propertyContactService.sendPropertyForm).not.toHaveBeenCalled();
  });

  it('should validate phone as digits only and minimum 10 digits', () => {
    createComponent();

    component.propertyForm.patchValue({
      firstName: 'Ion Popescu',
      village: 'Malaia',
      phone: '07123abc'
    });

    component.saveProperty();

    expect(component.propertyForm.get('phone')?.hasError('pattern')).toBeTrue();
    expect(propertyContactService.sendPropertyForm).not.toHaveBeenCalled();

    component.propertyForm.patchValue({ phone: '071234567' });

    component.saveProperty();

    expect(component.propertyForm.get('phone')?.hasError('minlength')).toBeTrue();
    expect(propertyContactService.sendPropertyForm).not.toHaveBeenCalled();
  });

  it('should validate email format when email is used as contact method', () => {
    createComponent();

    component.propertyForm.patchValue({
      firstName: 'Ion Popescu',
      village: 'Malaia',
      email: 'email-invalid'
    });

    component.saveProperty();

    expect(component.propertyForm.get('email')?.hasError('email')).toBeTrue();
    expect(propertyContactService.sendPropertyForm).not.toHaveBeenCalled();
  });

  it('should submit when required fields are completed and phone is valid', () => {
    createComponent();

    component.propertyForm.patchValue({
      firstName: 'Ion Popescu',
      village: 'Malaia',
      phone: '0728140628'
    });

    component.saveProperty();

    expect(propertyContactService.sendPropertyForm).toHaveBeenCalled();

    const sentDto = propertyContactService.sendPropertyForm.calls.mostRecent().args[0];

    expect(sentDto.firstName).toBe('Ion Popescu');
    expect(sentDto.email).toBe('');
    expect(sentDto.phone).toBe('0728140628');
    expect(sentDto.village).toBe('Malaia');
    expect(sentDto.propertyType as any).toBe('');
    expect(sentDto.propertyDescription).toBe('');
  });

  it('renders decoded plain-text descriptions and image alt text on property cards', () => {
    const plainDescription = 'Casa frumoasă & aproape de pădure, cu o priveliște foarte liniștită';
    const propertyWithHtml = {
      id: '3',
      name: 'Casa cu vedere',
      description: `<p>Casa <strong>frumoasă</strong> &amp; aproape de pădure, cu o priveliște foarte liniștită</p>`,
      type: 'house',
      thumbnail: 'thumb-3.jpg'
    } as PropertyDTO;

    createComponent();
    propertyApiService.getPropertiesPage.and.returnValue(
      of({ content: [propertyWithHtml], totalElements: 1, totalPages: 1, size: 6, number: 0 })
    );

    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.property-card') as HTMLElement | null;
    const description = card?.querySelector('p');
    const image = card?.querySelector('img');
    expect(description?.textContent?.trim()).toBe(component.truncate(plainDescription, 50));
    expect(description?.textContent).not.toContain('<p>');
    expect(description?.textContent).not.toContain('<strong>');
    expect(image?.getAttribute('alt')).toBe(`Casă de vânzare: Casa cu vedere - ${component.truncate(plainDescription, 60)}`);
  });

  it('removes phones from image alt before truncation without changing visible card text', () => {
    createComponent();
    const intro = 'Teren '.repeat(9);
    const property = {
      id: 'phone-alt', name: 'Casa +40 768 915 198', type: 'house', thumbnail: 'thumb.jpg',
      description: `<p>${intro}0763&nbsp;144&nbsp;967 ideal, preț 75.000 euro.</p>`
    } as PropertyDTO;

    expect(component.getImageAlt(property))
      .toBe(`Casă de vânzare: Casa - ${component.truncate(`${intro}ideal, preț 75.000 euro.`, 60)}`);
    expect(component.truncateDescription(property.description, 500)).toContain('0763\u00a0144\u00a0967');
    expect(property.name).toBe('Casa +40 768 915 198');
  });

  it('uses the land fallback for alt text and navigation when the API returns an unknown property type', () => {
    const invalidProperty = {
      id: 'invalid-1',
      name: 'Lot experimental',
      description: 'Descriere',
      type: 'farm',
      thumbnail: 'thumb-invalid.jpg'
    } as unknown as PropertyDTO;

    createComponent();
    propertyApiService.getPropertiesPage.and.returnValue(
      of({ content: [invalidProperty], totalElements: 1, totalPages: 1, size: 6, number: 0 })
    );
    fixture.detectChanges();

    expect(component.getImageAlt(invalidProperty)).toBe(
      'Teren de vânzare: Lot experimental - Descriere'
    );

    const titleLink = fixture.nativeElement.querySelector('.property-card h2 a') as HTMLAnchorElement;
    expect(titleLink.getAttribute('href'))
      .toBe('/property/invalid-1/teren-de-vanzare-lot-experimental?page=0&size=6&type=land');
  });

  it('renders title and details links with the current list state in both layouts', () => {
    createComponent({ page: '2', size: '12', type: 'house' });
    propertyApiService.getPropertiesPage.and.returnValue(of({
      content: [{ id: 'house-1', name: 'Casă în sat', type: 'house', description: 'Descriere', thumbnail: 'thumb.jpg' } as PropertyDTO],
      totalElements: 25, totalPages: 3, size: 12, number: 2
    }));
    fixture.detectChanges();

    for (const layout of ['grid', 'list'] as const) {
      component.layout = layout;
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector(layout === 'grid' ? '.property-card' : '.property-list-item') as HTMLElement;
      const links = Array.from(container.querySelectorAll('a'));
      expect(links.length).toBe(2);
      for (const link of links) {
        expect(link.getAttribute('href')).toBe('/property/house-1/casa-de-vanzare-casa-in-sat?page=2&size=12&type=house');
      }
    }
  });

  it('does not publish a broken detail URL for a property without an id', () => {
    createComponent();
    propertyApiService.getPropertiesPage.and.returnValue(of({
      content: [{ id: null, name: 'Fără identificator', type: 'land', description: '', thumbnail: 'thumb.jpg' } as unknown as PropertyDTO],
      totalElements: 1, totalPages: 1, size: 6, number: 0
    }));
    fixture.detectChanges();

    for (const layout of ['grid', 'list'] as const) {
      component.layout = layout;
      fixture.detectChanges();
      const container = fixture.nativeElement.querySelector(layout === 'grid' ? '.property-card' : '.property-list-item') as HTMLElement;
      expect(container.querySelector('a[href]')).toBeNull();
    }
  });

  it('publishes filter and pagination URLs preserving size and the selected type', () => {
    createComponent({ page: '1', size: '12', type: 'house' });
    propertyApiService.getPropertiesPage.and.returnValue(of({ content: [], totalElements: 25, totalPages: 3, size: 12, number: 1 }));
    fixture.detectChanges();

    const filters = Array.from(fixture.nativeElement.querySelectorAll('a.filter-button')) as HTMLAnchorElement[];
    expect(filters.map(link => link.getAttribute('href'))).toEqual([
      '/properties?page=0&size=12&type=house',
      '/properties?page=0&size=12&type=land'
    ]);
    const pages = Array.from(fixture.nativeElement.querySelectorAll('.property-pagination a[href]')) as HTMLAnchorElement[];
    expect(pages.length).toBeGreaterThan(0);
    const pageIndexes = pages.map(link => {
      const url = new URL(link.href);
      expect(url.pathname).toBe('/properties');
      expect(url.searchParams.get('size')).toBe('12');
      expect(url.searchParams.get('type')).toBe('house');
      return url.searchParams.get('page');
    });
    expect(pageIndexes).toContain('0');
    expect(pageIndexes).toContain('2');
  });

  it('reloads the reused list on query changes and restores the cached page when navigating back', () => {
    createComponent({ page: '0', size: '6', type: 'land' });
    const land = { id: 'land-1', name: 'Teren', type: 'land' } as PropertyDTO;
    const house = { id: 'house-1', name: 'Casă', type: 'house' } as PropertyDTO;
    propertyApiService.getPropertiesPage.and.callFake((page, size, type) => of({
      content: [type === 'house' ? house : land], totalElements: 1, totalPages: 1, size, number: page
    }));
    fixture.detectChanges();
    expect(component.properties).toEqual([land]);

    queryParamMap.next(convertToParamMap({ page: '2', size: '12', type: 'house' }));
    fixture.detectChanges();
    expect(propertyApiService.getPropertiesPage).toHaveBeenCalledWith(2, 12, 'house');
    expect(component.properties).toEqual([house]);
    expect([component.page, component.size, component.propertyType]).toEqual([2, 12, 'house']);

    propertyApiService.getPropertiesPage.calls.reset();
    queryParamMap.next(convertToParamMap({ page: '0', size: '6', type: 'land' }));
    fixture.detectChanges();
    expect(component.properties).toEqual([land]);
    expect([component.page, component.size, component.propertyType]).toEqual([0, 6, 'land']);
    expect(propertyApiService.getPropertiesPage).not.toHaveBeenCalled();
  });

  it('ignores a previous filter request that completes after the next filter has loaded', () => {
    createComponent({ page: '0', size: '6', type: 'land' });
    const land = { id: 'land-1', name: 'Teren', type: 'land' } as PropertyDTO;
    const house = { id: 'house-1', name: 'Casă', type: 'house' } as PropertyDTO;
    const landResponse = new Subject<{ content: PropertyDTO[]; totalElements: number; totalPages: number; size: number; number: number }>();
    propertyApiService.getPropertiesPage.and.callFake((_page, _size, type) => type === 'land'
      ? landResponse.asObservable()
      : of({ content: [house], totalElements: 1, totalPages: 1, size: 6, number: 0 }));
    fixture.detectChanges();

    queryParamMap.next(convertToParamMap({ page: '0', size: '6', type: 'house' }));
    landResponse.next({ content: [land], totalElements: 20, totalPages: 4, size: 6, number: 0 });
    landResponse.complete();
    fixture.detectChanges();

    expect(component.properties).toEqual([house]);
    expect(component.propertyType).toBe('house');
    expect(component.totalRecords).toBe(1);
    expect(component.totalPages).toBe(1);
    expect(propertiesState.getCachedPage(0, 6, 'house')).toEqual([house]);
  });

  it('uses URL defaults for an empty query, including when returning from a filtered page', () => {
    createComponent();
    propertiesState.setPage(3);
    propertiesState.setSize(12);
    propertiesState.setPropertyType('house');
    fixture.detectChanges();
    expect([component.page, component.size, component.propertyType]).toEqual([0, 6, 'land']);
    expect(propertyApiService.getPropertiesPage).toHaveBeenCalledWith(0, 6, 'land');

    queryParamMap.next(convertToParamMap({ page: '1', size: '12', type: 'house' }));
    fixture.detectChanges();
    expect([component.page, component.size, component.propertyType]).toEqual([1, 12, 'house']);

    queryParamMap.next(convertToParamMap({}));
    fixture.detectChanges();
    expect([component.page, component.size, component.propertyType]).toEqual([0, 6, 'land']);
    expect([propertiesState.page, propertiesState.size, propertiesState.propertyType]).toEqual([0, 6, 'land']);
  });

  it('restores pagination totals for the cached filter instead of reusing the last filter totals', () => {
    createComponent({ page: '0', size: '6', type: 'land' });
    const land = { id: 'land-1', name: 'Teren', type: 'land' } as PropertyDTO;
    const house = { id: 'house-1', name: 'Casă', type: 'house' } as PropertyDTO;
    propertyApiService.getPropertiesPage.and.callFake((page, size, type) => of({
      content: [type === 'house' ? house : land],
      totalElements: type === 'house' ? 1 : 13,
      totalPages: type === 'house' ? 1 : 3,
      size, number: page
    }));
    fixture.detectChanges();
    expect(component.totalPages).toBe(3);

    queryParamMap.next(convertToParamMap({ page: '0', size: '6', type: 'house' }));
    fixture.detectChanges();
    expect(component.totalRecords).toBe(1);
    expect(component.totalPages).toBe(1);

    propertyApiService.getPropertiesPage.calls.reset();
    queryParamMap.next(convertToParamMap({ page: '0', size: '6', type: 'land' }));
    fixture.detectChanges();
    expect(component.properties).toEqual([land]);
    expect(component.totalRecords).toBe(13);
    expect(component.totalPages).toBe(3);
    expect(propertyApiService.getPropertiesPage).not.toHaveBeenCalled();
  });
});
