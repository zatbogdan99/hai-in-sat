import {AfterViewInit, Component} from '@angular/core';

@Component({
  selector: 'app-see-the-area',
  templateUrl: './see-the-area.component.html',
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
