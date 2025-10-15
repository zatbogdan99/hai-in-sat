import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyDTO } from '../../dto/property.dto';

@Injectable({
  providedIn: 'root'
})
export class PropertyFormServiceService {
  // private savePropertyUrl = 'https://hai-in-sat-api.lm.r.appspot.com/save-property';
  private savePropertyUrl = 'http://localhost:8080/save-property';
  private getAllPropertiesUrl = 'http://localhost:8080/get-all-properties';
  private getPropertyByIdUrl = 'http://localhost:8080/get-by-id';
  private deletePropertyUrl = 'http://localhost:8080/delete-property';

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

  getAllProperties(): Observable<any> {
    return this.http.get(this.getAllPropertiesUrl);
  }

  getPropertyById(id: string): Observable<PropertyDTO> {
    return this.http.get<PropertyDTO>(`${this.getPropertyByIdUrl}?id=${encodeURIComponent(id)}`);
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.deletePropertyUrl}?id=${encodeURIComponent(id)}`);
  }
}
