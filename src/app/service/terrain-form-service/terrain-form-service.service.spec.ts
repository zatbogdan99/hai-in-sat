import { TestBed } from '@angular/core/testing';

import { TerrainFormServiceService } from './terrain-form-service.service';

describe('TerrainFormServiceService', () => {
  let service: TerrainFormServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerrainFormServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
