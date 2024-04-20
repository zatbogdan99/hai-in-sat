import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {HomeFormDto} from "../../dto/home-form.dto";

@Injectable({
  providedIn: 'root'
})
export class HomeFormServiceService {

  private homeFormUrl = 'http://localhost:8080/home-form';

  constructor(private http: HttpClient) { }

  sendHomeEmails(formData: HomeFormDto) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
      })
    };
    return this.http.post(this.homeFormUrl, formData, httpOptions);
  }
}
