import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HomeFormServiceService } from './home-form-service.service';

describe('HomeFormServiceService', () => {
  let service: HomeFormServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(HomeFormServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
