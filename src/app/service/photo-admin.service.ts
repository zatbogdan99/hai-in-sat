import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReplacePhotosRequest {
  propertyId: string;
  thumbnail: string; // base64 encoded thumbnail image (Data URL acceptable)
  photos: string[];  // base64 encoded photos (Data URLs acceptable)
}

@Injectable({ providedIn: 'root' })
export class PhotoAdminService {
  // Align with local backend like other services in the app
  private readonly deleteAllPhotosUrl = 'http://localhost:8080/delete-all-photos';
  private readonly replacePhotosUrl = 'http://localhost:8080/replace-photos';

  constructor(private http: HttpClient) {}

  deleteAllPhotos(): Observable<void> {
    return this.http.delete<void>(this.deleteAllPhotosUrl);
  }

  replacePhotos(request: ReplacePhotosRequest): Observable<void> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token'
      })
    };
    return this.http.post<void>(this.replacePhotosUrl, request, httpOptions);
  }
}
