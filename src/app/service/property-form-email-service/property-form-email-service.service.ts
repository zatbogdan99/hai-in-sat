import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyFormDTO } from '../../dto/property-form.dto';

@Injectable({
  providedIn: 'root'
})
export class PropertyFormEmailServiceService {
  // private readonly propertiesFormUrl = 'http://localhost:8080/properties-form';
  private readonly propertiesFormUrl = 'https://hai-in-sat-api.lm.r.appspot.com/properties-form';

  constructor(private http: HttpClient) {}

  sendPropertyForm(dto: PropertyFormDTO): Observable<void> {
    return this.http.post<void>(this.propertiesFormUrl, dto);
  }
}
