import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsComponent } from './about-us.component';

describe('AboutUsComponent', () => {
  let component: AboutUsComponent;
  let fixture: ComponentFixture<AboutUsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AboutUsComponent]
    });
    fixture = TestBed.createComponent(AboutUsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shares one page heading between the desktop story and mobile hero', () => {
    const headings = fixture.nativeElement.querySelectorAll('h1') as NodeListOf<HTMLHeadingElement>;
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBe('Despre noi');
    expect(headings[0].closest('.large-screen, .small-screen')).toBeNull();
  });
});
