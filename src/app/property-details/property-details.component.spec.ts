import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER } from 'rxjs';

import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertyDetailsComponent } from './property-details.component';

describe('PropertyDetailsComponent', () => {
  let component: PropertyDetailsComponent;
  let fixture: ComponentFixture<PropertyDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PropertyDetailsComponent, RouterTestingModule],
      providers: [
        LoadingService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: NEVER
          }
        },
        {
          provide: PropertyFormServiceService,
          useValue: {
            getPropertyById: () => NEVER
          }
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

  it('should preserve line breaks for the description using white-space: pre-line', () => {
    component.propertyDescription = 'Linia 1\nLinia 2';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const descEl = compiled.querySelector('p.property-description') as HTMLParagraphElement | null;
    expect(descEl).toBeTruthy();
    expect(descEl!.style.whiteSpace).toBe('pre-line');
    expect(descEl!.textContent).toContain('Linia 1');
    expect(descEl!.textContent).toContain('Linia 2');
  });
});
