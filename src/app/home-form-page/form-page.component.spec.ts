import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';

import { FormPageComponent } from './form-page.component';
import { HomeFormService } from '../service/home-form-service/home-form-service.service';

describe('FormPageComponent', () => {
  let component: FormPageComponent;
  let fixture: ComponentFixture<FormPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormPageComponent],
      providers: [
        {
          provide: HomeFormService,
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

  it('has one shared heading even when both responsive forms exist in the DOM', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1') as NodeListOf<HTMLHeadingElement>;
    expect(headings.length).toBe(1);
    expect(headings[0].textContent).toContain('Spune-ne ce cauți,');
    expect(headings[0].textContent).toContain('iar noi găsim pentru tine');
    expect(headings[0].closest('.large-screen, .small-screen')).toBeNull();
  });
});
