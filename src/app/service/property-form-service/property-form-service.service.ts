import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  saveProperty(formData: PropertyDTO): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
      })
    };
    return this.http.post(this.savePropertyUrl, formData, httpOptions);
  }

  updateSortOrder(id: string, sortOrder: number): Observable<void> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
      })
    };
    return this.http.patch<void>(
      `${this.updateSortOrderBaseUrl}/${encodeURIComponent(id)}/sort-order`,
      { sortOrder },
      httpOptions
    );
  }

  getAllProperties(): Observable<PageResponse<PropertyDTO>> {
    return this.http.get<PageResponse<PropertyDTO>>(this.getAllPropertiesUrl);
  }

  getPropertiesPage(page: number, size: number): Observable<PageResponse<PropertyDTO>> {
    return this.http.get<PageResponse<PropertyDTO>>(`${this.getAllPropertiesUrl}?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`);
  }

  getPropertyById(id: string): Observable<PropertyDTO> {
    return this.http.get<PropertyDTO>(`${this.getPropertyByIdUrl}?id=${encodeURIComponent(id)}`);
  }

  getPhotos(propertyId: string, offset: number, limit: number): Observable<{ photos: string[]; total: number }> {
    const baseUrl = this.getPropertyByIdUrl.replace('/get-by-id', '');
    return this.http.get<{ photos: string[]; total: number }>(
      `${baseUrl}/get-photos?propertyId=${encodeURIComponent(propertyId)}&offset=${offset}&limit=${limit}`
    );
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.deletePropertyUrl}?id=${encodeURIComponent(id)}`);
  }
}
