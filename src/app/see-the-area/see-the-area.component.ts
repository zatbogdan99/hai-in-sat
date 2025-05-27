import {AfterViewInit, Component} from '@angular/core';
import {SeeTheAreaBuyComponent} from "../see-the-area-buy/see-the-area-buy.component";
import {SeeTheAreaRentComponent} from "../see-the-area-rent/see-the-area-rent.component";
import {Button} from "primeng/button";
import {Card} from "primeng/card";
import {NgIf} from "@angular/common";

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
export class SeeTheAreaComponent{

  rent: number = -1;

  constructor() {

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
