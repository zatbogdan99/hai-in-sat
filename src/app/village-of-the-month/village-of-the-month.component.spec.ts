import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VillageOfTheMonthComponent } from './village-of-the-month.component';
import { PhotoService } from '../service/photo-service';

describe('VillageOfTheMonthComponent', () => {
  let component: VillageOfTheMonthComponent;
  let fixture: ComponentFixture<VillageOfTheMonthComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VillageOfTheMonthComponent],
      providers: [PhotoService]
    });
    fixture = TestBed.createComponent(VillageOfTheMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps one shared page heading when navigating between villages', () => {
    for (const villageId of component.order) {
      component.changeVillage(villageId);
      fixture.detectChanges();
      const headings = fixture.nativeElement.querySelectorAll('h1') as NodeListOf<HTMLHeadingElement>;
      expect(headings.length).withContext(`village ${villageId}`).toBe(1);
      expect(headings[0].textContent?.trim()).toBe(`Satul ${component.data[villageId].title}`);
      expect(headings[0].closest('.large-screen, .small-screen')).toBeNull();
    }
  });

  it('uses level-two headings for the village sections in both responsive layouts', () => {
    const headings = Array.from(fixture.nativeElement.querySelectorAll('h1, h2, h3, h4, h5, h6')) as HTMLHeadingElement[];
    for (const title of ['Prezentarea satului', 'Pastilă pentru suflet']) {
      const sections = headings.filter(heading => heading.textContent?.trim() === title);
      expect(sections.length).withContext(title).toBeGreaterThan(0);
      expect(sections.every(heading => heading.tagName === 'H2')).withContext(title).toBeTrue();
    }
  });
});
