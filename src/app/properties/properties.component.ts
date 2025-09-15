import { AfterViewInit, Component } from '@angular/core';
import { Swiper } from 'swiper';
import { PhotoService } from "../service/photo-service";
import { BuyEnum } from "../dto/buy.enum";
import { LoadingService } from "../service/loading-service/loading-service.service";
import { GalleriaModule } from "primeng/galleria";
import { Divider } from "primeng/divider";
import { Dialog } from "primeng/dialog";
import { ProgressSpinner } from "primeng/progressspinner";
import { Button } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { DataViewModule } from "primeng/dataview";
import { Router } from "@angular/router";
import { PropertyFormServiceService } from "../service/property-form-service/property-form-service.service";
import { PropertyDTO } from "../dto/property.dto";
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from "primeng/tag";
import {InputText} from "primeng/inputtext";
import {Textarea} from "primeng/textarea";
import {FloatLabel} from "primeng/floatlabel";
import {DropdownModule} from "primeng/dropdown";
import {AutoComplete} from "primeng/autocomplete";

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  imports: [
    GalleriaModule,
    ProgressSpinner,
    Button,
    FormsModule,
    DataViewModule,
    SelectButtonModule,
    TagModule,
    Divider,
    Dialog,
    InputText,
    Textarea,
    FloatLabel,
    DropdownModule,
    AutoComplete
  ],
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements AfterViewInit {
  displayGalleria: boolean;
  images: any[] | undefined;
  terenBaiaImages: any[] | undefined;
  terenPolovragiImages: any[] | undefined;
  milosteaImages: any[] | undefined;
  displayModal: boolean = false;

  // Properties for DataView
  properties: PropertyDTO[] = [];
  layout: 'grid' | 'list' = 'grid';
  propertyType: 'house' | 'land' = 'house'; // Default to 'house'

  // ✅ MODIFICAT - opțiuni compatibile cu p-selectbutton
  options = [
    { label: 'Listă', value: 'list' },
    { label: 'Grid', value: 'grid' }
  ];

  setPropertyType(type: 'house' | 'land') {
    this.propertyType = type;
  }

  getSeverity(property: any): string {
    return 'success';
  }


  firstName: string = '';
  lastName: string = '';
  email: string = '';
  propertyDescription: string = '';

  responsiveOptions: any[] = [
    { breakpoint: '1500px', numVisible: 5 },
    { breakpoint: '1024px', numVisible: 3 },
    { breakpoint: '768px', numVisible: 2 },
    { breakpoint: '560px', numVisible: 1 }
  ];

  constructor(
    private photoService: PhotoService,
    public loadingService: LoadingService,
    private router: Router,
    private propertyFormService: PropertyFormServiceService
  ) {
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
    });

    this.initializeProperties();
  }

  initializeProperties() {
    this.loadingService.loadingOn();
    this.propertyFormService.getAllProperties().subscribe({
      next: (props: PropertyDTO[]) => {
        this.properties = Array.isArray(props) ? props : [];
        this.loadingService.loadingOff();
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.properties = [];
        this.loadingService.loadingOff();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
  }

  initializeSwiper(): void {
    setTimeout(() => {
      const existingSwipers = document.querySelectorAll('.swiper');
      existingSwipers.forEach(swiperEl => {
        const swiperInstance = (swiperEl as any).swiper;
        if (swiperInstance) {
          swiperInstance.destroy(true, true);
        }
      });

      const swiperBaia = new Swiper(".swiper-baia", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        coverflowEffect: { rotate: 0, stretch: 0, depth: 100, modifier: 3, slideShadows: true },
        loop: true,
        loopAdditionalSlides: 3,
        watchSlidesProgress: true,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        pagination: { el: ".swiper-baia .swiper-pagination", clickable: true },
        breakpoints: { 640: { slidesPerView: 2 }, 768: { slidesPerView: 1 }, 1024: { slidesPerView: 2 }, 1560: { slidesPerView: 3 } }
      } as any);

      const swiperPolovragi = new Swiper(".swiper-polovragi", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        coverflowEffect: { rotate: 0, stretch: 0, depth: 100, modifier: 3, slideShadows: true },
        loop: true,
        loopAdditionalSlides: 3,
        watchSlidesProgress: true,
        watchOverflow: true,
        observer: true,
        observeParents: true,
        pagination: { el: ".swiper-polovragi .swiper-pagination", clickable: true },
        breakpoints: { 640: { slidesPerView: 2 }, 768: { slidesPerView: 1 }, 1024: { slidesPerView: 2 }, 1560: { slidesPerView: 3 } }
      } as any);
    }, 100);
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
    console.log('Property details:', {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      propertyDescription: this.propertyDescription
    });

    this.firstName = '';
    this.lastName = '';
    this.email = '';
    this.propertyDescription = '';
    this.displayModal = false;
  }

  viewPropertyDetails(property: PropertyDTO) {
    console.log('Viewing property details:', property);
    if (property && property.id) {
      this.router.navigate(['/property', property.id]);
    }
  }

  getFilteredProperties() {
    return this.properties.filter(property => property.type === this.propertyType);
  }
}
