import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER } from 'rxjs';

import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';
import { PropertyDetailsComponent } from './property-details.component';

describe('PropertyDetailsComponent', () => {
  let component: PropertyDetailsComponent;
  let fixture: ComponentFixture<PropertyDetailsComponent>;
  let propertyFormService: jasmine.SpyObj<PropertyFormServiceService>;

  beforeEach(() => {
    propertyFormService = jasmine.createSpyObj<PropertyFormServiceService>('PropertyFormServiceService', ['getPropertyById']);
    propertyFormService.getPropertyById.and.returnValue(NEVER);

    TestBed.configureTestingModule({
      imports: [PropertyDetailsComponent, RouterTestingModule],
      providers: [
        LoadingService,
        PropertiesStateService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: NEVER
          }
        },
        {
          provide: PropertyFormServiceService,
          useValue: propertyFormService
        }
      ]
    });

    fixture = TestBed.createComponent(PropertyDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render the description in the dedicated paragraph element', () => {
    component.propertyDescription = 'Linia 1\nLinia 2';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const descEl = compiled.querySelector('p.property-description') as HTMLParagraphElement | null;
    expect(descEl).toBeTruthy();
    expect(descEl!.classList.contains('property-description')).toBeTrue();
    expect(descEl!.textContent).toContain('Linia 1');
    expect(descEl!.textContent).toContain('Linia 2');
  });

});
