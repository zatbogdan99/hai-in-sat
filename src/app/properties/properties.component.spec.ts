import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
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
  let propertiesState: PropertiesStateService;

  const createComponent = (queryParams: Record<string, string> = {}) => {
    TestBed.resetTestingModule();
    propertyFormService = jasmine.createSpyObj<PropertyFormServiceService>('PropertyFormServiceService', ['getPropertiesPage']);
    propertyFormService.getPropertiesPage.and.returnValue(
      of({ content: [], totalElements: 0, totalPages: 0, size: 6, number: 0 })
    );

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
          useValue: {
            sendPropertyForm: () => of(null)
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
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

    propertiesState.setCachedPage(2, 6, cachedProperties);
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

    expect(propertyFormService.getPropertiesPage).toHaveBeenCalledWith(1, 6);
    expect(component.properties).toEqual(responseProperties);
    expect(propertiesState.getCachedPage(1, 6)).toEqual(responseProperties);
  });

  it('should render the phone link with tel scheme in the contact dialog', () => {
    createComponent();
    component.displayModal = true;

    fixture.detectChanges();

    const telLink = document.querySelector('a.contact-item[href^="tel:"]') as HTMLAnchorElement | null;
    expect(telLink).toBeTruthy();
    expect(telLink!.getAttribute('href')).toBe('tel:+40728140628');
  });
});
