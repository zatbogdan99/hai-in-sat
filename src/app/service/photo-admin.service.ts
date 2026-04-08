import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReplacePhotosRequest {
  propertyId: string;
  thumbnail: string; // base64 encoded thumbnail image (Data URL acceptable)
  photos?: string[];  // omit this field when only the thumbnail changes
}

@Injectable({ providedIn: 'root' })
export class PhotoAdminService {
  private readonly baseUrl = 'https://hai-in-sat-api.lm.r.appspot.com';
  // private readonly baseUrl = 'http://localhost:8080';

  private readonly deleteAllPhotosUrl = `${this.baseUrl}/delete-all-photos`;
  private readonly replacePhotosUrl = `${this.baseUrl}/replace-photos`;

  constructor(private http: HttpClient) {}

  deleteAllPhotos(): Observable<void> {
    return this.http.delete<void>(this.deleteAllPhotosUrl);
  }

  deletePhotosForProperty(propertyId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete-property-photos?propertyId=${encodeURIComponent(propertyId)}`);
  }

  regenerateThumbnails(width: number, height: number): Observable<number> {
    return this.http.post<number>(
      `http://localhost:8080/regenerate-thumbnails?width=${width}&height=${height}`,
      null
    );
  }

  regenerateThumbnailForProperty(propertyId: string, width: number, height: number): Observable<void> {
    return this.http.post<void>(
      `http://localhost:8080/regenerate-thumbnail/${encodeURIComponent(propertyId)}?width=${width}&height=${height}`,
      null
    );
  }

  addPhoto(propertyId: string, photo: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/add-photo`, { propertyId, photo });
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
