import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HomeFormDto} from "../../dto/home-form.dto";

@Injectable({
  providedIn: 'root'
})
export class HomeFormServiceService {

  private homeFormUrl = 'http://localhost:8080/home-form';

  constructor(private http: HttpClient) { }

  sendHomeEmails(formData: HomeFormDto) {
    return this.http.post(this.homeFormUrl, formData);
  }
}
