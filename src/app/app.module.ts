import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomePageComponent } from './home-page/home-page.component';
import {ButtonModule} from "primeng/button";
import {MenubarModule} from "primeng/menubar";
import {ScrollTopModule} from "primeng/scrolltop";
import { LandingPageComponent } from './landing-page/landing-page.component';
import { FormPageComponent } from './home-form-page/form-page.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {InputTextareaModule} from "primeng/inputtextarea";
import {InputTextModule} from "primeng/inputtext";
import {SliderModule} from "primeng/slider";
import {PanelModule} from "primeng/panel";
import { NgxSliderModule } from 'ngx-slider-v2';
import {ToggleButtonModule} from "primeng/togglebutton";
import {ChipModule} from "primeng/chip";
import {RippleModule} from "primeng/ripple";
import { MessagesModule } from 'primeng/messages';
import {MessageService} from "primeng/api";
import { AboutUsComponent } from './about-us/about-us.component';
import {CardModule} from "primeng/card";
import { InfoPageComponent } from './info-page/info-page.component';
import { TerrainFormPageComponent } from './terrain-form-page/terrain-form-page.component';
import {GalleriaModule} from "primeng/galleria";
import {PhotoService} from "./service/photo-service";
import { ContactUsComponent } from './contact-us/contact-us.component';

@NgModule({
  declarations: [
    AppComponent,
    HomePageComponent,
    LandingPageComponent,
    FormPageComponent,
    AboutUsComponent,
    InfoPageComponent,
    TerrainFormPageComponent,
    ContactUsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ButtonModule,
    MenubarModule,
    ScrollTopModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextareaModule,
    InputTextModule,
    SliderModule,
    PanelModule,
    NgxSliderModule,
    ToggleButtonModule,
    ChipModule,
    RippleModule,
    MessagesModule,
    CardModule,
    GalleriaModule
  ],
  providers: [PhotoService],
  bootstrap: [AppComponent]
})
export class AppModule { }
