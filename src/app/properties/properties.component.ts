import {AfterViewInit, Component} from '@angular/core';
import { Swiper } from 'swiper';
import {PhotoService} from "../service/photo-service";
import {BuyEnum} from "../dto/buy.enum";
import {LoadingService} from "../service/loading-service/loading-service.service";
import {GalleriaModule} from "primeng/galleria";
import {YoutubePlayerComponent} from "../youtube-player/youtube-player.component";
import {Divider} from "primeng/divider";
import {Dialog} from "primeng/dialog";
import {InputSwitch} from "primeng/inputswitch";
import {ProgressSpinner} from "primeng/progressspinner";
import {Button} from "primeng/button";

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  imports: [
    GalleriaModule,
    YoutubePlayerComponent,
    Divider,
    Dialog,
    InputSwitch,
    ProgressSpinner,
    Button
  ],
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements AfterViewInit{
  displayGalleria: boolean;
  images: any[] | undefined;
  terenBaiaImages: any[] | undefined;
  terenPolovragiImages: any[] | undefined;
  milosteaImages: any[] | undefined;
  displayModal: boolean = false;

  // Property with getter and setter to detect changes
  private _propertyType: boolean = true; // true for "Case" (Houses), false for "Terenuri" (Lands)

  get propertyType(): boolean {
    return this._propertyType;
  }

  set propertyType(value: boolean) {
    this._propertyType = value;
    // Re-initialize Swiper after DOM update
    setTimeout(() => {
      this.initializeSwiper();
    }, 0);
  }

  // Form fields
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  propertyDescription: string = '';

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

  constructor(private photoService: PhotoService, public loadingService: LoadingService) {
    this.loadingService.loadingOn();
    this.photoService.getBaiaTeren().then((images) => {
      this.terenBaiaImages = images;
    });
    this.photoService.getTerenPolovragi().then((images) => {
      this.terenPolovragiImages = images;
    });
    this.displayGalleria = false;
    this.photoService.getMilosteaPension().then((images) => {
      this.milosteaImages = images;
    }).finally(() => this.loadingService.loadingOff())
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
  }
  /**
   * Initialize Swiper for image galleries
   * This method is called both on component initialization and when propertyType changes
   */
  initializeSwiper(): void {
    // Only initialize Swiper if we're in the lands section (propertyType is false)
    if (this._propertyType === false) {
      // Short delay to ensure DOM is ready
      setTimeout(() => {
        // Destroy existing Swiper instances if any
        const existingSwipers = document.querySelectorAll('.swiper');
        existingSwipers.forEach(swiperEl => {
          const swiperInstance = (swiperEl as any).swiper;
          if (swiperInstance) {
            swiperInstance.destroy(true, true);
          }
        });

        // Initialize Baia de Fier Swiper with type assertion to bypass TypeScript checking
        const swiperBaiaOptions = {
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
          loopAdditionalSlides: 3, // Add more slides for loop to prevent disappearing
          watchSlidesProgress: true, // Watch slides progress for better transition
          watchOverflow: true, // Better handling of few slides
          observer: true, // Update swiper when DOM elements inside are modified
          observeParents: true, // Update swiper if parent elements change
          pagination: {
            el: ".swiper-baia .swiper-pagination",
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
        };
        const swiperBaia = new Swiper(".swiper-baia", swiperBaiaOptions as any);

        // Initialize Polovragi Swiper with type assertion to bypass TypeScript checking
        const swiperPolovragiOptions = {
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
          loopAdditionalSlides: 3, // Add more slides for loop to prevent disappearing
          watchSlidesProgress: true, // Watch slides progress for better transition
          watchOverflow: true, // Better handling of few slides
          observer: true, // Update swiper when DOM elements inside are modified
          observeParents: true, // Update swiper if parent elements change
          pagination: {
            el: ".swiper-polovragi .swiper-pagination",
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
        };
        const swiperPolovragi = new Swiper(".swiper-polovragi", swiperPolovragiOptions as any);
      }, 100); // Small delay to ensure DOM is ready
    }
  }

  protected readonly BuyEnum = BuyEnum;

  openGalleria(type: BuyEnum) {
    this.displayGalleria = true;
    if (type === BuyEnum.BAIA) {
      this.images = this.terenBaiaImages;
    } else if (type === BuyEnum.POLOVRAGI) {
      this.images = this.terenPolovragiImages;
    }
  }

  showAddPropertyModal() {
    this.displayModal = true;
  }

  hideModal() {
    this.displayModal = false;
  }

  saveProperty() {
    // This will be implemented later
    console.log('Property details:', {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      propertyDescription: this.propertyDescription
    });

    // Reset form fields
    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.propertyDescription = '';

    this.displayModal = false;
  }
}
