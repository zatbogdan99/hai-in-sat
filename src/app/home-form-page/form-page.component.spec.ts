import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';

import { FormPageComponent } from './form-page.component';
import { HomeFormServiceService } from '../service/home-form-service/home-form-service.service';

describe('FormPageComponent', () => {
  let component: FormPageComponent;
  let fixture: ComponentFixture<FormPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormPageComponent],
      providers: [
        {
          provide: HomeFormServiceService,
          useValue: {
            sendHomeEmails: () => NEVER
          }
        }
      ]
    });
    fixture = TestBed.createComponent(FormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
