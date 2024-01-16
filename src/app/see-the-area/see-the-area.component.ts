import { Component } from '@angular/core';
import {AreaDto} from "../dto/area.dto";
import Swiper from "swiper";

@Component({
  selector: 'app-see-the-area',
  templateUrl: './see-the-area.component.html',
  styleUrls: ['./see-the-area.component.scss']
})
export class SeeTheAreaComponent {

  constructor() {
    let swiper = new Swiper(".swiper", {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 100,
        modifier: 3,
        slideShadows: true
      },
      loop: true,
      pagination: {
        el: ".swiper-pagination",
        clickable: true
      }
    });
  }

}
