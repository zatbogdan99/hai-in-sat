import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Observable, retry, timeout } from 'rxjs';
import { PropertyDTO } from '../../dto/property.dto';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyFormServiceService {
  private savePropertyUrl = 'https://hai-in-sat-api.lm.r.appspot.com/save-property';
  private deletePropertyUrl = 'https://hai-in-sat-api.lm.r.appspot.com/delete-property';
  private getAllPropertiesUrl = 'https://hai-in-sat-api.lm.r.appspot.com/get-all-properties';
  private getPropertyByIdUrl = 'https://hai-in-sat-api.lm.r.appspot.com/get-by-id';
  private updateSortOrderBaseUrl = 'https://hai-in-sat-api.lm.r.appspot.com/properties';

  // private savePropertyUrl = 'http://localhost:8080/save-property';
  // private deletePropertyUrl = 'http://localhost:8080/delete-property';
  // private getAllPropertiesUrl = 'http://localhost:8080/get-all-properties';
  // private getPropertyByIdUrl = 'http://localhost:8080/get-by-id';
  // private updateSortOrderBaseUrl = 'http://localhost:8080/properties';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  saveProperty(formData: PropertyDTO): Observable<any> {
    return this.http.post(this.savePropertyUrl, formData);
  }

  updateSortOrder(id: string, sortOrder: number): Observable<void> {
    return this.http.patch<void>(
      `${this.updateSortOrderBaseUrl}/${encodeURIComponent(id)}/sort-order`,
      { sortOrder }
    );
  }

  getAllProperties(): Observable<PageResponse<PropertyDTO>> {
    return this.http.get<PageResponse<PropertyDTO>>(this.getAllPropertiesUrl);
  }

  getPropertiesPage(page: number, size: number, type?: string | null): Observable<PageResponse<PropertyDTO>> {
    let url = `${this.getAllPropertiesUrl}?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    return this.http.get<PageResponse<PropertyDTO>>(url);
  }

  getPropertyById(id: string): Observable<PropertyDTO> {
    return this.withSsrTimeoutAndRetry(
      this.http.get<PropertyDTO>(`${this.getPropertyByIdUrl}?id=${encodeURIComponent(id)}`)
    );
  }

  getPhotos(propertyId: string, offset: number, limit: number): Observable<{ photos: string[]; total: number }> {
    const baseUrl = this.getPropertyByIdUrl.replace('/get-by-id', '');
    return this.withSsrTimeoutAndRetry(
      this.http.get<{ photos: string[]; total: number }>(
        `${baseUrl}/get-photos?propertyId=${encodeURIComponent(propertyId)}&offset=${offset}&limit=${limit}`
      )
    );
  }

  updateDescription(id: string, description: string): Observable<PropertyDTO> {
    return this.http.patch<PropertyDTO>(
      `${this.updateSortOrderBaseUrl}/${encodeURIComponent(id)}/description`,
      { description }
    );
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.deletePropertyUrl}?id=${encodeURIComponent(id)}`);
  }

  private withSsrTimeoutAndRetry<T>(request$: Observable<T>): Observable<T> {
    if (!isPlatformServer(this.platformId)) {
      return request$;
    }

    return request$.pipe(
      timeout({ each: 8000 }),
      retry({ count: 1, delay: 1500 })
    );
  }
}
