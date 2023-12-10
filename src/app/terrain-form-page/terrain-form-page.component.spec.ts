import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerrainFormPageComponent } from './terrain-form-page.component';

describe('TerrainFormPageComponent', () => {
  let component: TerrainFormPageComponent;
  let fixture: ComponentFixture<TerrainFormPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TerrainFormPageComponent]
    });
    fixture = TestBed.createComponent(TerrainFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
