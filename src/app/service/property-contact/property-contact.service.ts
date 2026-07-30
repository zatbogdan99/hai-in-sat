import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyFormDTO } from '../../dto/property-form.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PropertyContactService {
  private readonly propertiesFormUrl = `${environment.apiBaseUrl}/properties-form`;

  constructor(private http: HttpClient) {}

  sendPropertyForm(dto: PropertyFormDTO): Observable<void> {
    return this.http.post<void>(this.propertiesFormUrl, dto);
  }
}
