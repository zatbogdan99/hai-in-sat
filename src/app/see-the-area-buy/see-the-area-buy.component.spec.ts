import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeTheAreaBuyComponent } from './see-the-area-buy.component';

describe('SeeTheAreaBuyComponent', () => {
  let component: SeeTheAreaBuyComponent;
  let fixture: ComponentFixture<SeeTheAreaBuyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SeeTheAreaBuyComponent]
    });
    fixture = TestBed.createComponent(SeeTheAreaBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
