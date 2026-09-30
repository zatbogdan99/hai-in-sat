import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnderTheMountainComponent } from './under-the-mountain.component';

describe('UnderTheMountainComponent', () => {
  let component: UnderTheMountainComponent;
  let fixture: ComponentFixture<UnderTheMountainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UnderTheMountainComponent]
    });
    fixture = TestBed.createComponent(UnderTheMountainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the visible introduction as the only page heading', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1') as NodeListOf<HTMLHeadingElement>;
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('De ce Oltenia de sub Munte?');
    expect(headings[0].classList.contains('why__title')).toBeTrue();
  });
});
