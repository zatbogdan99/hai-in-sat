import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { TerrainFormDto } from "../../dto/terrain-form.dto";

@Injectable({
  providedIn: 'root'
})
export class TerrainFormServiceService {

  private terrainFormUrl = 'https://hai-in-sat-api.lm.r.appspot.com/terrain-form';

  constructor(private http: HttpClient) {
  }

  sendTerrainEmails(formData: TerrainFormDto) {
    return this.http.post(this.terrainFormUrl, formData);
  }
}
