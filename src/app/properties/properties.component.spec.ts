import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PropertiesComponent } from './properties.component';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertyFormEmailServiceService } from '../service/property-form-email-service/property-form-email-service.service';
import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';
import { PropertyDTO } from '../dto/property.dto';

describe('PropertiesComponent', () => {
  let component: PropertiesComponent;
  let fixture: ComponentFixture<PropertiesComponent>;
  let propertyFormService: jasmine.SpyObj<PropertyFormServiceService>;
  let propertyFormEmailService: jasmine.SpyObj<PropertyFormEmailServiceService>;
  let router: jasmine.SpyObj<Router>;
  let propertiesState: PropertiesStateService;

  const createComponent = (queryParams: Record<string, string> = {}) => {
    TestBed.resetTestingModule();
    propertyFormService = jasmine.createSpyObj<PropertyFormServiceService>('PropertyFormServiceService', ['getPropertiesPage']);
    propertyFormEmailService = jasmine.createSpyObj<PropertyFormEmailServiceService>('PropertyFormEmailServiceService', ['sendPropertyForm']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    propertyFormService.getPropertiesPage.and.returnValue(
      of({ content: [], totalElements: 0, totalPages: 0, size: 6, number: 0 })
    );
    propertyFormEmailService.sendPropertyForm.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [PropertiesComponent],
      providers: [
        provideNoopAnimations(),
        LoadingService,
        PropertiesStateService,
        {
          provide: PropertyFormServiceService,
          useValue: propertyFormService
        },
        {
          provide: PropertyFormEmailServiceService,
          useValue: propertyFormEmailService
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams)
            }
          }
        },
        {
          provide: Router,
          useValue: router
        }
      ]
    });

    propertiesState = TestBed.inject(PropertiesStateService);
    fixture = TestBed.createComponent(PropertiesComponent);
    component = fixture.componentInstance;
  };

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
    expect(propertyFormService.getPropertiesPage).not.toHaveBeenCalled();
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
    propertyFormService.getPropertiesPage.and.returnValue(
      of({ content: responseProperties, totalElements: 1, totalPages: 1, size: 6, number: 1 })
    );

    fixture.detectChanges();

    expect(propertyFormService.getPropertiesPage).toHaveBeenCalledWith(1, 6, 'land');
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
    expect(propertyFormEmailService.sendPropertyForm).not.toHaveBeenCalled();
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
    expect(propertyFormEmailService.sendPropertyForm).not.toHaveBeenCalled();

    component.propertyForm.patchValue({ phone: '071234567' });

    component.saveProperty();

    expect(component.propertyForm.get('phone')?.hasError('minlength')).toBeTrue();
    expect(propertyFormEmailService.sendPropertyForm).not.toHaveBeenCalled();
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
    expect(propertyFormEmailService.sendPropertyForm).not.toHaveBeenCalled();
  });

  it('should submit when required fields are completed and phone is valid', () => {
    createComponent();

    component.propertyForm.patchValue({
      firstName: 'Ion Popescu',
      village: 'Malaia',
      phone: '0728140628'
    });

    component.saveProperty();

    expect(propertyFormEmailService.sendPropertyForm).toHaveBeenCalled();

    const sentDto = propertyFormEmailService.sendPropertyForm.calls.mostRecent().args[0];

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
    propertyFormService.getPropertiesPage.and.returnValue(
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
});
