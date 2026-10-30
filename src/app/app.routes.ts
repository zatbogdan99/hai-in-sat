// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { FormPageComponent } from './home-form-page/form-page.component';
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
  { path: 'gaseste-mi-locul', component: FormPageComponent },
  // Pagina „Despre noi” a fost scoasă: adresa veche (sitemap, Google) duce la prima pagină (server.ts răspunde cu 301).
  { path: 'about-us', redirectTo: '', pathMatch: 'full' },
  // Fiecare sat are adresa lui (titlu, canonical și sitemap proprii). /info-page depindea de satul ales în memorie
  // și, încărcată direct, arăta satul lunii; acum duce la lista satelor (server.ts răspunde cu 301).
  { path: 'sate/:slug', component: InfoPageComponent },
  { path: 'info-page', redirectTo: 'oltenia-de-sub-munte', pathMatch: 'full' },
  // Pagina de contact a fost scoasă: datele de contact sunt în fereastra Contact (butonul din subsol).
  { path: 'contact-us', redirectTo: '', pathMatch: 'full' },
  { path: 'oltenia-de-sub-munte', component: UnderTheMountainComponent },
  // „Vezi zona” a fost scoasă: „Cumpără” repeta două anunțuri din /proprietati, iar „Închiriază” era doar „Va urma”.
  { path: 'see-the-area', redirectTo: 'proprietati', pathMatch: 'full' },
  { path: 'proprietati', component: PropertiesComponent },
  { path: 'proprietati/:id/:slug', component: PropertyDetailsComponent },
  { path: 'proprietati/:id', component: PropertyDetailsComponent },
  { path: 'satul-lunii', component: VillageOfTheMonthComponent },
  // Căile vechi, în engleză: server.ts răspunde cu 301 (cu query string-ul păstrat); aici, pentru navigarea în aplicație
  // dintr-un HTML vechi sau din istoric. Routerul păstrează parametrii de query la redirect.
  { path: 'homes', redirectTo: 'gaseste-mi-locul', pathMatch: 'full' },
  { path: 'under-the-mountain', redirectTo: 'oltenia-de-sub-munte', pathMatch: 'full' },
  { path: 'properties', redirectTo: 'proprietati', pathMatch: 'full' },
  { path: 'property/:id/:slug', redirectTo: 'proprietati/:id/:slug' },
  { path: 'property/:id', redirectTo: 'proprietati/:id' },
  { path: 'village-of-the-month', redirectTo: 'satul-lunii', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'add-property', component: AddPropertyComponent, canActivate: [authGuard] },
  { path: '**', component: NotFoundComponent }
];
