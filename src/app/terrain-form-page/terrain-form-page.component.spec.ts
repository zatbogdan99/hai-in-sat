import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { NEVER } from 'rxjs';

import { TerrainFormPageComponent } from './terrain-form-page.component';
import { TerrainFormServiceService } from '../service/terrain-form-service/terrain-form-service.service';

describe('TerrainFormPageComponent', () => {
  let component: TerrainFormPageComponent;
  let fixture: ComponentFixture<TerrainFormPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TerrainFormPageComponent],
      providers: [
        MessageService,
        {
          provide: TerrainFormServiceService,
          useValue: {
            sendTerrainEmails: () => NEVER
          }
        }
      ]
    });
    fixture = TestBed.createComponent(TerrainFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
