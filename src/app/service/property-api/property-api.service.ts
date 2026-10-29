import { Inject, Injectable, PLATFORM_ID, StateKey, TransferState, makeStateKey } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { EMPTY, Observable, catchError, concat, of, retry, tap, timeout } from 'rxjs';
import { PropertyDTO } from '../../dto/property.dto';
import { environment } from '../../../environments/environment';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Miniaturile base64 peste această mărime nu intră în starea transferată din HTML. Unele au 3–13 MB
 * (AVIF-uri pe care backendul nu le poate micșora) și făceau din pagina 2 a terenurilor un HTML de 21 MB.
 */
const TRANSFER_IMAGE_LIMIT = 150 * 1024;

interface TransferredPage {
  response: PageResponse<PropertyDTO>;
  /** Unele miniaturi au rămas pe dinafară: browserul cere pagina completă imediat după afișare. */
  trimmed: boolean;
}

const isHeavyImage = (src: string | null | undefined): boolean =>
  !!src && src.startsWith('data:') && src.length > TRANSFER_IMAGE_LIMIT;

@Injectable({
  providedIn: 'root'
})
export class PropertyApiService {
  private readonly savePropertyUrl = `${environment.apiBaseUrl}/save-property`;
  private readonly deletePropertyUrl = `${environment.apiBaseUrl}/delete-property`;
  private readonly getAllPropertiesUrl = `${environment.apiBaseUrl}/get-all-properties`;
  private readonly getPropertyByIdUrl = `${environment.apiBaseUrl}/get-by-id`;
  private readonly updateSortOrderBaseUrl = `${environment.apiBaseUrl}/properties`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object,
    private transferState: TransferState
  ) {}

  saveProperty(formData: PropertyDTO): Observable<any> {
    return this.http.post(this.savePropertyUrl, formData);
  }

  updateSortOrder(id: string, sortOrder: number): Observable<void> {
    return this.http.patch<void>(
      `${this.updateSortOrderBaseUrl}/${encodeURIComponent(id)}/sort-order`,
      { sortOrder }
    );
  }

  getAllProperties(): Observable<PageResponse<PropertyDTO>> {
    return this.http.get<PageResponse<PropertyDTO>>(this.getAllPropertiesUrl);
  }

  /**
   * Pe server, pagina intră în starea transferată fără miniaturile mari (Angular nu mai pune răspunsul brut acolo,
   * vezi filtrul din app.config.ts). În browser, lista apare imediat din copia asta, fără să se golească la
   * hidratare; dacă lipseau miniaturi, răspunsul complet le aduce imediat după.
   */
  getPropertiesPage(page: number, size: number, type?: string | null): Observable<PageResponse<PropertyDTO>> {
    let url = `${this.getAllPropertiesUrl}?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    const request = this.http.get<PageResponse<PropertyDTO>>(url);
    const key = makeStateKey<TransferredPage>(`properties-page:${page}:${size}:${type ?? ''}`);
    if (isPlatformServer(this.platformId)) {
      return request.pipe(tap(response => this.transferState.set(key, this.lightPage(response))));
    }
    const transferred = this.takeTransferred(key);
    if (!transferred) {
      return request;
    }
    // Dacă pagina completă nu vine, rămâne copia ușoară (cu „Fără fotografie” la miniaturile lipsă).
    return transferred.trimmed
      ? concat(of(transferred.response), request.pipe(catchError(() => EMPTY)))
      : of(transferred.response);
  }

  /**
   * Detaliul folosește miniatura doar ca poster al videoului, deci în starea transferată ea rămâne numai la
   * proprietățile cu video (miniaturile de 3–13 MB sunt toate la terenuri fără video).
   */
  getPropertyById(id: string): Observable<PropertyDTO> {
    const request = this.withSsrTimeoutAndRetry(
      this.http.get<PropertyDTO>(`${this.getPropertyByIdUrl}?id=${encodeURIComponent(id)}`)
    );
    const key = makeStateKey<PropertyDTO>(`property:${id}`);
    if (isPlatformServer(this.platformId)) {
      return request.pipe(tap(property => {
        if (property) {
          this.transferState.set(key, property.videoUrl ? property : { ...property, thumbnail: '' });
        }
      }));
    }
    const transferred = this.takeTransferred(key);
    return transferred ? of(transferred) : request;
  }

  private lightPage(response: PageResponse<PropertyDTO>): TransferredPage {
    const content = Array.isArray(response?.content) ? response.content : [];
    const trimmed = content.some(property => isHeavyImage(property.thumbnail));
    return {
      response: trimmed
        ? { ...response, content: content.map(property => isHeavyImage(property.thumbnail) ? { ...property, thumbnail: '' } : property) }
        : response,
      trimmed
    };
  }

  /** Citește o singură dată ce a lăsat serverul în HTML; la următoarea navigare se cere din nou API-ul. */
  private takeTransferred<T>(key: StateKey<T>): T | null {
    if (!this.transferState.hasKey(key)) {
      return null;
    }
    const value = this.transferState.get(key, null);
    this.transferState.remove(key);
    return value;
  }

  getPhotos(propertyId: string, offset: number, limit: number): Observable<{ photos: string[]; total: number }> {
    const baseUrl = this.getPropertyByIdUrl.replace('/get-by-id', '');
    return this.withSsrTimeoutAndRetry(
      this.http.get<{ photos: string[]; total: number }>(
        `${baseUrl}/get-photos?propertyId=${encodeURIComponent(propertyId)}&offset=${offset}&limit=${limit}`
      )
    );
  }

  updateDescription(id: string, description: string): Observable<PropertyDTO> {
    return this.http.patch<PropertyDTO>(
      `${this.updateSortOrderBaseUrl}/${encodeURIComponent(id)}/description`,
      { description }
    );
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.deletePropertyUrl}?id=${encodeURIComponent(id)}`);
  }

  /**
   * Golește cache-ul video al backend-ului pentru o proprietate și întoarce starea
   * proaspătă. Fără asta, un video urcat în bucket poate să nu apară până la 10 minute,
   * fiindcă se memorează și răspunsul „nu are video".
   */
  refreshVideo(id: string): Observable<{ videoUrl: string | null; bucket: string; folder: string }> {
    return this.http.patch<{ videoUrl: string | null; bucket: string; folder: string }>(
      `${this.updateSortOrderBaseUrl}/${encodeURIComponent(id)}/refresh-video`,
      {}
    );
  }

  private withSsrTimeoutAndRetry<T>(request$: Observable<T>): Observable<T> {
    if (!isPlatformServer(this.platformId)) {
      return request$;
    }

    return request$.pipe(
      timeout({ each: 8000 }),
      retry({ count: 1, delay: 1500 })
    );
  }
}
