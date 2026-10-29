import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PropertyType } from '../../dto/property-type.enum';
import { PropertyDTO } from '../../dto/property.dto';
import { environment } from '../../../environments/environment';
import { PropertyApiService } from './property-api.service';

describe('PropertyApiService', () => {
  let service: PropertyApiService;
  let httpMock: HttpTestingController;

  const propertyUrl = `${environment.apiBaseUrl}/get-by-id?id=prop%201`;
  const photosUrl = `${environment.apiBaseUrl}/get-photos?propertyId=prop%201&offset=0&limit=2`;
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

  describe('state transferred from the server HTML', () => {
    const heavy = `data:image/avif;base64,${'A'.repeat(200 * 1024)}`;
    const pageUrl = `${environment.apiBaseUrl}/get-all-properties?page=1&size=6&type=land`;
    const pageKey = makeStateKey<unknown>('properties-page:1:6:land');
    const page = (thumbnail: string) => ({
      content: [{ ...property, thumbnail }, { ...property, id: 'p2', thumbnail: 'data:image/jpeg;base64,small' }],
      totalElements: 2, totalPages: 1, size: 6, number: 1
    });

    it('stores the list page on the server without the heavy thumbnails', () => {
      configure('server');
      service.getPropertiesPage(1, 6, 'land').subscribe();
      httpMock.expectOne(pageUrl).flush(page(heavy));

      const stored = TestBed.inject(TransferState).get(pageKey, null) as { response: { content: PropertyDTO[] }; trimmed: boolean };
      expect(stored.trimmed).toBeTrue();
      expect(stored.response.content.map(item => item.thumbnail)).toEqual(['', 'data:image/jpeg;base64,small']);
    });

    it('shows the transferred page at once in the browser and fetches the full page only when thumbnails were left out', () => {
      configure('browser');
      const state = TestBed.inject(TransferState);
      state.set(pageKey, { response: page(''), trimmed: true });
      const thumbnails: string[][] = [];

      service.getPropertiesPage(1, 6, 'land').subscribe(response => thumbnails.push(response.content.map(item => item.thumbnail)));
      expect(thumbnails).toEqual([['', 'data:image/jpeg;base64,small']]);
      httpMock.expectOne(pageUrl).flush(page(heavy));

      expect(thumbnails.length).toBe(2);
      expect(thumbnails[1][0]).toBe(heavy);
      expect(state.hasKey(pageKey)).toBeFalse();
    });

    it('keeps the transferred page when the full page fails, instead of emptying the list', () => {
      configure('browser');
      TestBed.inject(TransferState).set(pageKey, { response: page(''), trimmed: true });
      const emitted: number[] = [];
      let failed = false;

      service.getPropertiesPage(1, 6, 'land').subscribe({ next: response => emitted.push(response.content.length), error: () => failed = true });
      httpMock.expectOne(pageUrl).flush('down', { status: 503, statusText: 'Service Unavailable' });

      expect(emitted).toEqual([2]);
      expect(failed).toBeFalse();
    });

    it('drops the thumbnail of a property without video from the transferred detail and reuses it in the browser', () => {
      configure('server');
      service.getPropertyById('prop 1').subscribe();
      httpMock.expectOne(propertyUrl).flush({ ...property, thumbnail: heavy });
      const key = makeStateKey<PropertyDTO>('property:prop 1');
      const stored = TestBed.inject(TransferState).get(key, null);
      expect(stored?.thumbnail).toBe('');
      expect(stored?.name).toBe(property.name);
    });

    it('keeps the thumbnail of a property with video, which the detail page uses as poster', () => {
      configure('server');
      service.getPropertyById('prop 1').subscribe();
      httpMock.expectOne(propertyUrl).flush({ ...property, thumbnail: heavy, videoUrl: 'https://storage.googleapis.com/b/v.mp4' });
      expect(TestBed.inject(TransferState).get(makeStateKey<PropertyDTO>('property:prop 1'), null)?.thumbnail).toBe(heavy);
    });

    it('answers the detail from the transferred state in the browser, without a request', () => {
      configure('browser');
      TestBed.inject(TransferState).set(makeStateKey<PropertyDTO>('property:prop 1'), property);
      let result: PropertyDTO | undefined;

      service.getPropertyById('prop 1').subscribe(value => result = value);

      expect(result).toEqual(property);
      httpMock.expectNone(propertyUrl);
    });
  });
});
