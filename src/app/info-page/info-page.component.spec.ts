import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPageComponent } from './info-page.component';
import { PhotoService } from '../service/photo-service';

describe('InfoPageComponent', () => {
  let component: InfoPageComponent;
  let fixture: ComponentFixture<InfoPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InfoPageComponent],
      providers: [PhotoService]
    });
    fixture = TestBed.createComponent(InfoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
