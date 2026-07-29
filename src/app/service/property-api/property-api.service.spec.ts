import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PropertyType } from '../../dto/property-type.enum';
import { PropertyDTO } from '../../dto/property.dto';
import { PropertyApiService } from './property-api.service';

describe('PropertyApiService', () => {
  let service: PropertyApiService;
  let httpMock: HttpTestingController;

  const propertyUrl = 'https://hai-in-sat-api.lm.r.appspot.com/get-by-id?id=prop%201';
  const photosUrl = 'https://hai-in-sat-api.lm.r.appspot.com/get-photos?propertyId=prop%201&offset=0&limit=2';
  const property: PropertyDTO = {
    id: 'prop 1',
    name: 'Test property',
    description: 'Description',
    type: PropertyType.LAND,
    thumbnail: 'thumbnail'
  };

  afterEach(() => {
    httpMock.verify({ ignoreCancelled: true });
    TestBed.resetTestingModule();
  });

  function configure(platformId: 'browser' | 'server'): void {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId }
      ]
    });

    service = TestBed.inject(PropertyApiService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  it('should be created', () => {
    configure('browser');

    expect(service).toBeTruthy();
  });

  it('applies timeout and one retry to getPropertyById on the server', fakeAsync(() => {
    configure('server');
    let result: PropertyDTO | undefined;

    service.getPropertyById('prop 1').subscribe(value => {
      result = value;
    });

    const firstRequest = httpMock.expectOne(propertyUrl);
    expect(firstRequest.request.method).toBe('GET');

    tick(8000);
    expect(firstRequest.cancelled).toBeTrue();

    tick(1500);
    const retryRequest = httpMock.expectOne(propertyUrl);
    retryRequest.flush(property);

    expect(result).toEqual(property);
  }));

  it('does not apply timeout or retry to getPropertyById in the browser', fakeAsync(() => {
    configure('browser');
    let result: PropertyDTO | undefined;

    service.getPropertyById('prop 1').subscribe(value => {
      result = value;
    });

    const request = httpMock.expectOne(propertyUrl);

    tick(10000);
    expect(request.cancelled).toBeFalse();
    expect(httpMock.match(propertyUrl).length).toBe(0);

    request.flush(property);

    expect(result).toEqual(property);
  }));

  it('applies timeout and one retry to getPhotos on the server', fakeAsync(() => {
    configure('server');
    let result: { photos: string[]; total: number } | undefined;

    service.getPhotos('prop 1', 0, 2).subscribe(value => {
      result = value;
    });

    const firstRequest = httpMock.expectOne(photosUrl);
    expect(firstRequest.request.method).toBe('GET');

    tick(8000);
    expect(firstRequest.cancelled).toBeTrue();

    tick(1500);
    const retryRequest = httpMock.expectOne(photosUrl);
    retryRequest.flush({ photos: ['photo'], total: 1 });

    expect(result).toEqual({ photos: ['photo'], total: 1 });
  }));
});
