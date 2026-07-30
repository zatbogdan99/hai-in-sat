import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { HomeFormDto } from "../../dto/home-form.dto";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeFormService {

  private readonly homeFormUrl = `${environment.apiBaseUrl}/home-form`;

  constructor(private http: HttpClient) { }

  sendHomeEmails(formData: HomeFormDto) {
    return this.http.post(this.homeFormUrl, formData);
  }
}
