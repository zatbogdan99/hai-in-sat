import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeTheAreaRentComponent } from './see-the-area-rent.component';

describe('SeeTheAreaRentComponent', () => {
  let component: SeeTheAreaRentComponent;
  let fixture: ComponentFixture<SeeTheAreaRentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SeeTheAreaRentComponent]
    });
    fixture = TestBed.createComponent(SeeTheAreaRentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
