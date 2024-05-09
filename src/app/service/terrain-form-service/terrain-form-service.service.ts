import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {TerrainFormDto} from "../../dto/terrain-form.dto";

@Injectable({
  providedIn: 'root'
})
export class TerrainFormServiceService {

  private terrainFormUrl = 'https://hai-in-sat-api.lm.r.appspot.com/terrain-form';

  constructor(private http: HttpClient) {
  }

  sendTerrainEmails(formData: TerrainFormDto) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
      })
    };
    return this.http.post(this.terrainFormUrl, formData, httpOptions);
  }
}
