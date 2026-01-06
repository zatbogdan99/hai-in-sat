import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeeTheAreaBuyComponent } from './see-the-area-buy.component';
import { PhotoService } from '../service/photo-service';

describe('SeeTheAreaBuyComponent', () => {
  let component: SeeTheAreaBuyComponent;
  let fixture: ComponentFixture<SeeTheAreaBuyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SeeTheAreaBuyComponent],
      providers: [PhotoService]
    });
    fixture = TestBed.createComponent(SeeTheAreaBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
