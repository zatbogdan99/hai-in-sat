import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyFormDTO } from '../../dto/property-form.dto';

@Injectable({
  providedIn: 'root'
})
export class PropertyFormEmailServiceService {
  // Backend endpoint to send the property form emails
  private readonly propertiesFormUrl = 'http://localhost:8080/properties-form';
  // If you deploy the API, you can swap the URL above with the production one
  // private readonly propertiesFormUrl = 'https://hai-in-sat-api.lm.r.appspot.com/properties-form';

  constructor(private http: HttpClient) {}

  sendPropertyForm(dto: PropertyFormDTO): Observable<void> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.post<void>(this.propertiesFormUrl, dto, httpOptions);
  }
}
