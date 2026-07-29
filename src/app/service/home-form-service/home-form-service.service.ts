import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { HomeFormDto } from "../../dto/home-form.dto";

@Injectable({
  providedIn: 'root'
})
export class HomeFormService {

  private homeFormUrl = 'https://hai-in-sat-api.lm.r.appspot.com/home-form';

  constructor(private http: HttpClient) { }

  sendHomeEmails(formData: HomeFormDto) {
    return this.http.post(this.homeFormUrl, formData);
  }
}
