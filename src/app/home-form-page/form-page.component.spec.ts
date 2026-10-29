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

  it('explains invalid fields under each field instead of only colouring them', () => {
    component.formGroup.patchValue({ mail: 'abc', phoneNumber: 'telefon' });
    component.formGroup.markAllAsTouched();
    fixture.detectChanges();

    const errors = Array.from(fixture.nativeElement.querySelectorAll('.large-screen .field-error') as NodeListOf<HTMLElement>)
      .map(error => error.textContent?.trim());
    expect(errors).toContain('Numele este obligatoriu.');
    expect(errors).toContain('Adresa de e-mail nu este validă.');
    expect(errors).toContain('Numărul de telefon trebuie să conțină doar cifre.');
    expect(errors).toContain('Bifează acordul ca să-ți putem trimite variante.');
  });

  it('accepts a phone number made only of digits, with at least 10 of them', () => {
    const phone = component.formGroup.get('phoneNumber')!;
    phone.setValue('0728 140');
    expect(phone.valid).toBeFalse();
    phone.setValue('072814062');
    expect(phone.hasError('minlength')).toBeTrue();
    phone.setValue('0728140628');
    expect(phone.valid).toBeTrue();
  });

  it('labels both consent checkboxes and opens the policies from real buttons', () => {
    for (const id of ['terms', 'terms_mobile']) {
      const input = fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
      const labelledBy = input.getAttribute('aria-labelledby')!;
      expect(fixture.nativeElement.querySelector(`#${labelledBy}`).textContent).toContain('Sunt de acord cu');
      expect(fixture.nativeElement.querySelector(`label[for="${id}"]`)).toBeTruthy();
    }
    expect(fixture.nativeElement.querySelector('a[href^="javascript:"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.consent-text button[type="button"]').length).toBe(4);
  });

  it('keeps the desktop and mobile radio groups separate but showing the same choice', () => {
    const desktop = fixture.nativeElement.querySelector('#optLand') as HTMLInputElement;
    const mobile = fixture.nativeElement.querySelector('#optLandMobile') as HTMLInputElement;
    expect(desktop.name).not.toBe(mobile.name);

    desktop.click();
    fixture.detectChanges();

    expect(component.formGroup.get('propertyType')!.value).toBe('land');
    expect(desktop.checked).toBeTrue();
    expect(mobile.checked).toBeTrue();
  });

  it('does not autofocus the radio buttons or the consent checkboxes on load', () => {
    expect(fixture.nativeElement.querySelectorAll('[autofocus]').length).toBe(0);
  });
});
