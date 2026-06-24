import {AfterViewInit, Component, OnInit} from '@angular/core';
import {SeeTheAreaBuyComponent} from "../see-the-area-buy/see-the-area-buy.component";
import {SeeTheAreaRentComponent} from "../see-the-area-rent/see-the-area-rent.component";
import {Button} from "primeng/button";
import {Card} from "primeng/card";
import {NgIf} from "@angular/common";
import {SeoService} from "../service/seo.service";

@Component({
  selector: 'app-see-the-area',
  templateUrl: './see-the-area.component.html',
  imports: [
    SeeTheAreaBuyComponent,
    SeeTheAreaRentComponent,
    Button,
    Card,
    NgIf
  ],
  styleUrls: ['./see-the-area.component.scss']
})
export class SeeTheAreaComponent implements OnInit {

  rent: number = -1;

  constructor(private seo: SeoService) {

  }

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Vezi zona – Peisaje din Oltenia de sub Munte | Hai în Sat',
      description: 'Galerie foto din Oltenia de sub Munte: peisaje, sate și locuri de la munte din Horezu, Polovragi, Baia de Fier și Vaideeni. Vezi zona unde te chemăm la sat.',
      ogImage: 'https://hai-în-sat.ro/assets/teren_polovragi1.avif',
      canonicalPath: '/see-the-area'
    });
    this.seo.setBreadcrumbs([
      { name: 'Acasă', path: '/' },
      { name: 'Vezi zona', path: '/see-the-area' }
    ]);
  }

  isRentSelected() {
    return this.rent === 1;
  }

  isBuySelected() {
    return this.rent === 0;
  }

  changeToRent() {
    this.rent = 1;
  }

  isRentValid() {
    return this.rent === -1;
  }

  onBack() {
    this.rent = -1;
  }

  changeToBuy() {
    this.rent = 0;
  }
}
