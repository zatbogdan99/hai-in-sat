import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  village$ = new BehaviorSubject<number>(0);
  reload$ = new BehaviorSubject<boolean>(false);

  // Semnale globale pentru deschiderea pop-up-urilor din footer
  openTerms$ = new BehaviorSubject<boolean>(false);
  openPrivacy$ = new BehaviorSubject<boolean>(false);

  openTermsPopup(): void {
    this.openTerms$.next(true);
  }

  openPrivacyPopup(): void {
    this.openPrivacy$.next(true);
  }
}
