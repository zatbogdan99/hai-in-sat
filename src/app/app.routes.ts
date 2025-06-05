// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { FormPageComponent } from './home-form-page/form-page.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { InfoPageComponent } from './info-page/info-page.component';
import { TerrainFormPageComponent } from './terrain-form-page/terrain-form-page.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { UnderTheMountainComponent } from './under-the-mountain/under-the-mountain.component';
import { SeeTheAreaComponent } from './see-the-area/see-the-area.component';
import { VillageOfTheMonthComponent } from './village-of-the-month/village-of-the-month.component';
import { PropertiesComponent } from './properties/properties.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';

export const appRoutes: Routes = [
  { path: 'terrain-form-page', component: TerrainFormPageComponent },
  { path: 'homes', component: FormPageComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'info-page', component: InfoPageComponent },
  { path: 'contact-us', component: ContactUsComponent },
  { path: 'under-the-mountain', component: UnderTheMountainComponent },
  { path: 'see-the-area', component: SeeTheAreaComponent },
  { path: 'properties', component: PropertiesComponent },
  { path: 'property/:id', component: PropertyDetailsComponent },
  { path: 'village-of-the-month', component: VillageOfTheMonthComponent },
  { path: '**', component: LandingPageComponent }
];
