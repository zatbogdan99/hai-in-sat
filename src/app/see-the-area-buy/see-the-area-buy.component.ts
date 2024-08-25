import {AfterViewInit, Component} from '@angular/core';
import Swiper, { Pagination } from 'swiper';
import {PhotoService} from "../service/photo-service";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-see-the-area-buy',
  templateUrl: './see-the-area-buy.component.html',
  styleUrls: ['./see-the-area-buy.component.scss']
})
export class SeeTheAreaBuyComponent implements AfterViewInit{
  displayGalleria: boolean;
  images: any[] | undefined;

  responsiveOptions: any[] = [
    {
      breakpoint: '1500px',
      numVisible: 5
    },
    {
      breakpoint: '1024px',
      numVisible: 3
    },
    {
      breakpoint: '768px',
      numVisible: 2
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];

  constructor(private photoService: PhotoService) {
    this.photoService.getHorezuImages().then((images) => {
      this.images = images;
    });
    this.displayGalleria = false;
  }

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
