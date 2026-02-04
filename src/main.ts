import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { appRoutes } from './app/app.routes';
import { provideRouter, withHashLocation } from '@angular/router';
import { PhotoService } from './app/service/photo-service';
import { DataService } from './app/service/data-service';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppComponent } from './app/app.component';
import Lara from '@primeng/themes/lara';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara,
        options: {
          // Disable automatic dark mode handling from Prime Theme engine
          darkModeSelector: 'none'
        }
      }
    }),
    provideRouter(appRoutes, withHashLocation()),
    importProvidersFrom(HttpClientModule),
    // Firebase providers
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    MessageService,
    DataService,
    PhotoService
  ]
});
