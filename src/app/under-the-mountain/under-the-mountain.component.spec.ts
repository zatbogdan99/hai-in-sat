import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnderTheMountainComponent } from './under-the-mountain.component';

describe('UnderTheMountainComponent', () => {
  let component: UnderTheMountainComponent;
  let fixture: ComponentFixture<UnderTheMountainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UnderTheMountainComponent]
    });
    fixture = TestBed.createComponent(UnderTheMountainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
