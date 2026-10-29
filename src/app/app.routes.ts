// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { FormPageComponent } from './home-form-page/form-page.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { InfoPageComponent } from './info-page/info-page.component';
import { UnderTheMountainComponent } from './under-the-mountain/under-the-mountain.component';
import { VillageOfTheMonthComponent } from './village-of-the-month/village-of-the-month.component';
import { PropertiesComponent } from './properties/properties.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';
import { AddPropertyComponent } from './add-property/add-property.component';
import { NewLandingPageComponent } from './new-landing-page/new-landing-page.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { NotFoundComponent } from './not-found/not-found.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', component: NewLandingPageComponent },
  { path: 'homes', component: FormPageComponent },
  { path: 'about-us', component: AboutUsComponent },
  // Fiecare sat are adresa lui (titlu, canonical și sitemap proprii). /info-page depindea de satul ales în memorie
  // și, încărcată direct, arăta satul lunii; acum duce la lista satelor (server.ts răspunde cu 301).
  { path: 'sate/:slug', component: InfoPageComponent },
  { path: 'info-page', redirectTo: 'under-the-mountain', pathMatch: 'full' },
  // Pagina de contact a fost scoasă: datele de contact sunt în fereastra Contact (butonul din subsol).
  { path: 'contact-us', redirectTo: '', pathMatch: 'full' },
  { path: 'under-the-mountain', component: UnderTheMountainComponent },
  // „Vezi zona” a fost scoasă: „Cumpără” repeta două anunțuri din /properties, iar „Închiriază” era doar „Va urma”.
  { path: 'see-the-area', redirectTo: 'properties', pathMatch: 'full' },
  { path: 'properties', component: PropertiesComponent },
  { path: 'property/:id/:slug', component: PropertyDetailsComponent },
  { path: 'property/:id', component: PropertyDetailsComponent },
  { path: 'village-of-the-month', component: VillageOfTheMonthComponent },
  { path: 'login', component: LoginComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent }
];
