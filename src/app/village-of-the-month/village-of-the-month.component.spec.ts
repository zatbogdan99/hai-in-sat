import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VillageOfTheMonthComponent } from './village-of-the-month.component';

describe('VillageOfTheMonthComponent', () => {
  let component: VillageOfTheMonthComponent;
  let fixture: ComponentFixture<VillageOfTheMonthComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VillageOfTheMonthComponent]
    });
    fixture = TestBed.createComponent(VillageOfTheMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
