import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LandingPageComponent} from "./landing-page/landing-page.component";
import {FormPageComponent} from "./home-form-page/form-page.component";
import {AboutUsComponent} from "./about-us/about-us.component";
import {InfoPageComponent} from "./info-page/info-page.component";
import {TerrainFormPageComponent} from "./terrain-form-page/terrain-form-page.component";
import {ContactUsComponent} from "./contact-us/contact-us.component";
import {UnderTheMountainComponent} from "./under-the-mountain/under-the-mountain.component";
import {SeeTheAreaComponent} from "./see-the-area/see-the-area.component";
import {VillageOfTheMonthComponent} from "./village-of-the-month/village-of-the-month.component";

const routes: Routes = [
  {path: 'home-form-page', component: FormPageComponent},
  {path: 'terrain-form-page', component: TerrainFormPageComponent},
  {path: 'about-us', component: AboutUsComponent},
  {path: 'info-page', component: InfoPageComponent},
  {path: 'contact-us', component: ContactUsComponent},
  {path: 'under-the-mountain', component: UnderTheMountainComponent},
  {path: 'see-the-area', component:SeeTheAreaComponent},
  {path: 'village-of-the-month', component:VillageOfTheMonthComponent},
  {path: '**', component: LandingPageComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
