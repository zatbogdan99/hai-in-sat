import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'; // ✅ Importă HttpClientModule

import { appRoutes } from './app/app.routes';
import { provideRouter, withHashLocation } from '@angular/router';
import { PhotoService } from './app/service/photo-service';
import { DataService } from './app/service/data-service';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AppComponent } from './app/app.component';
import Lara from '@primeng/themes/lara';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Lara } }),
    provideRouter(appRoutes, withHashLocation()),
    importProvidersFrom(HttpClientModule),
    MessageService,
    DataService,
    PhotoService
  ]
});
