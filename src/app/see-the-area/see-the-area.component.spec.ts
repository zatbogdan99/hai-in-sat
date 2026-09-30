import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeTheAreaComponent } from './see-the-area.component';
import { PhotoService } from '../service/photo-service';

describe('SeeTheAreaComponent', () => {
  let component: SeeTheAreaComponent;
  let fixture: ComponentFixture<SeeTheAreaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SeeTheAreaComponent],
      providers: [PhotoService]
    });
    fixture = TestBed.createComponent(SeeTheAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('retains one shared page heading through buy, rent and back navigation', () => {
    const root = fixture.nativeElement as HTMLElement;
    const pageHeading = root.querySelector('h1');
    expect(pageHeading?.textContent?.trim()).toBe('Haide să vezi zona');

    for (const state of ['initial', 'buy', 'rent', 'back']) {
      if (state === 'buy') component.changeToBuy();
      if (state === 'rent') component.changeToRent();
      if (state === 'back') component.onBack();
      fixture.detectChanges();

      // Count the whole DOM, including the CSS-hidden responsive branch.
      expect(root.querySelectorAll('h1').length).withContext(state).toBe(1);
      expect(root.querySelector('h1')).withContext(state).toBe(pageHeading);
      expect(pageHeading?.closest('.large-screen, .small-screen')).toBeNull();

      const buy = root.querySelectorAll('app-see-the-area-buy');
      const rent = root.querySelectorAll('app-see-the-area-rent');
      if (state === 'buy' || state === 'rent') {
        const children = state === 'buy' ? buy : rent;
        expect(children.length).withContext(state).toBeGreaterThan(0);
        for (const child of Array.from(children)) {
          expect(child.querySelectorAll('h2').length).withContext(state).toBeGreaterThan(0);
          expect(child.querySelectorAll('h1, h3, h4, h5, h6').length).withContext(state).toBe(0);
        }
      }
      expect(state === 'buy' ? rent.length : buy.length).withContext(state).toBe(0);
      if (state === 'initial' || state === 'back') expect(rent.length).toBe(0);
    }
  });
});
