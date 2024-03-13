import { TestBed } from '@angular/core/testing';

import { HomeFormServiceService } from './home-form-service.service';

describe('HomeFormServiceService', () => {
  let service: HomeFormServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HomeFormServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
