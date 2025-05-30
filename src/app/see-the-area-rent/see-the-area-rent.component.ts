import {AfterViewInit, Component} from '@angular/core';
import { Swiper } from 'swiper';

@Component({
  selector: 'app-see-the-area-rent',
  templateUrl: './see-the-area-rent.component.html',
  styleUrls: ['./see-the-area-rent.component.scss']
})
export class SeeTheAreaRentComponent implements AfterViewInit{

  ngAfterViewInit(): void {
    const swiper = new Swiper(".mySwiper", {
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
      },
      breakpoints: {
        640: {
          slidesPerView: 2
        },
        768: {
          slidesPerView: 1
        },
        1024: {
          slidesPerView: 2
        },
        1560: {
          slidesPerView: 3
        }
      }
    });
  }

}
