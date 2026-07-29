import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { HomeFormService } from './home-form-service.service';

describe('HomeFormService', () => {
  let service: HomeFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(HomeFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
