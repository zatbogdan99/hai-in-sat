import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeTheAreaComponent } from './see-the-area.component';

describe('SeeTheAreaComponent', () => {
  let component: SeeTheAreaComponent;
  let fixture: ComponentFixture<SeeTheAreaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SeeTheAreaComponent]
    });
    fixture = TestBed.createComponent(SeeTheAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
