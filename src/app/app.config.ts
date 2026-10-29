import { ApplicationConfig, inject, PLATFORM_ID, provideAppInitializer } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence
} from '@angular/fire/auth';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { PrimeNG, providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MessageService } from 'primeng/api';
import Lara from '@primeuix/themes/lara';

import { appRoutes } from './app.routes';
import { PhotoService } from './service/photo-service';
import { DataService } from './service/data-service';
import { environment } from '../environments/environment';
import { authInterceptor } from './interceptors/auth.interceptor';

/** Textele PrimeNG care apar pe paginile publice (căutarea din „Vreau și eu!”), în română. */
const TRANSLATION_RO = {
  emptyMessage: 'Nicio opțiune disponibilă',
  emptySearchMessage: 'Niciun rezultat',
  searchMessage: '{0} rezultate disponibile',
  selectionMessage: '{0} elemente selectate',
  emptySelectionMessage: 'Niciun element selectat'
};

/** Etichetele ARIA PrimeNG folosite pe site (închiderea ferestrelor și a galeriilor), în română. */
const ARIA_RO = {
  close: 'Închide',
  previous: 'Anterior',
  next: 'Următor',
  prevPageLabel: 'Pagina anterioară',
  nextPageLabel: 'Pagina următoare',
  slide: 'Imagine',
  slideNumber: 'Imaginea {slideNumber}'
};

/**
 * PrimeNG 20.4 lasă săgețile din p-galleria fără nume și cu role="navigation", iar indicatorii au
 * aria-selected pe un <li> fără rol și un buton gol în el. Pass-through-ul global le corectează în toate galeriile.
 */
const GALLERIA_A11Y_PT = {
  mask: { 'aria-label': 'Galerie foto' },
  prevButton: { 'aria-label': 'Imaginea anterioară', role: null },
  nextButton: { 'aria-label': 'Imaginea următoare', role: null },
  indicatorList: { role: 'tablist', 'aria-label': 'Alege imaginea' },
  indicator: { role: 'tab' },
  indicatorButton: { 'aria-hidden': 'true' }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          darkModeSelector: 'none'
        }
      },
      pt: { galleria: GALLERIA_A11Y_PT }
    }),
    provideAppInitializer(() => {
      const primeng = inject(PrimeNG);
      // setTranslation îmbină doar primul nivel, așa că etichetele aria se pun peste cele implicite, nu în locul lor.
      primeng.setTranslation({ ...TRANSLATION_RO, aria: { ...primeng.translation.aria, ...ARIA_RO } });
    }),
    // La Înapoi/Înainte, routerul reface poziția de derulare a paginii; la o navigare nouă pornește de sus.
    provideRouter(appRoutes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    // Autentificarea e doar cu email și parolă (login.component). Fără resolverul de popup/redirect din getAuth(),
    // Firebase nu mai încarcă iframe-ul de la apis.google.com pe fiecare pagină publică.
    provideAuth((injector) => initializeAuth(getApp(), {
      persistence: isPlatformBrowser(injector.get(PLATFORM_ID))
        ? [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
        : inMemoryPersistence
    })),
    provideClientHydration(withEventReplay(), withHttpTransferCacheOptions({
      // Răspunsurile cu poze base64 (câțiva MB fiecare) nu intră brute în starea transferată din HTML: galeria
      // le cere în browser, iar lista și detaliul pun acolo o copie fără miniaturile mari (PropertyApiService).
      filter: (req) => !['/get-photos', '/get-by-id', '/get-all-properties'].some((path) => req.url.includes(path)),
    })),
    MessageService,
    DataService,
    PhotoService
  ]
};
