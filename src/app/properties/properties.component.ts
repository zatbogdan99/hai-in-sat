import { AfterViewInit, Component } from '@angular/core';
import { Swiper } from 'swiper';
import { PhotoService } from "../service/photo-service";
import { BuyEnum } from "../dto/buy.enum";
import { LoadingService } from "../service/loading-service/loading-service.service";
import { GalleriaModule } from "primeng/galleria";
import { Divider } from "primeng/divider";
import { Dialog } from "primeng/dialog";
import { InputSwitch } from "primeng/inputswitch";
import { ProgressSpinner } from "primeng/progressspinner";
import { Button } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { DataViewModule } from "primeng/dataview";
import { Router } from "@angular/router";
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from "primeng/tag";

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  imports: [
    GalleriaModule,
    Divider,
    Dialog,
    InputSwitch,
    ProgressSpinner,
    Button,
    FormsModule,
    DataViewModule,
    SelectButtonModule,
    TagModule
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
  properties: any[] = [];
  layout: 'grid' | 'list' = 'grid';

  // ✅ MODIFICAT - opțiuni compatibile cu p-selectbutton
  options = [
    { label: 'Listă', value: 'list' },
    { label: 'Grid', value: 'grid' }
  ];

  getSeverity(property: any): string {
    return 'success';
  }

  private _propertyType: boolean = true;

  get propertyType(): boolean {
    return this._propertyType;
  }

  set propertyType(value: boolean) {
    this._propertyType = value;
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
    private router: Router
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
    this.properties = [
      {
        id: BuyEnum.MILOSTEA,
        name: 'Pensiune în Milostea',
        description: 'Pensiune cu 16 camere. Utilități: Gratar/Restaurant/Terasa/Sala de evenimente. Afacere la cheie.',
        type: 'house',
        thumbnail: 'assets/pensiune1.avif'
      },
      {
        id: BuyEnum.BAIA,
        name: 'Casă în Baia de Fier',
        description: 'Casă în Baia de Fier, aproape de Peștera Muierilor. Zonă cu tradiții și peisaje montane.',
        type: 'house',
        thumbnail: 'assets/baia1.avif'
      },
      {
        id: BuyEnum.POLOVRAGI,
        name: 'Casă în Polovragi',
        description: 'Casă în Polovragi, aproape de mănăstire și de intrarea în Cheile Oltețului.',
        type: 'house',
        thumbnail: 'assets/polovragi1.avif'
      },
      {
        id: BuyEnum.HOREZU,
        name: 'Casă în Horezu',
        description: 'Casă tradițională în Horezu, zonă renumită pentru ceramica sa.',
        type: 'house',
        thumbnail: 'assets/horezu1.avif'
      },
      {
        id: BuyEnum.COSTESTI,
        name: 'Casă în Costești',
        description: 'Proprietate în Costești, aproape de Cheile Oltețului și Peștera Polovragi.',
        type: 'house',
        thumbnail: 'assets/costesti1.avif'
      },
      {
        id: BuyEnum.SLATIOARA,
        name: 'Casă în Slătioara',
        description: 'Casă în Slătioara, zonă liniștită, perfectă pentru relaxare.',
        type: 'house',
        thumbnail: 'assets/slatioara1.avif'
      },
      {
        id: BuyEnum.VAIDEENI,
        name: 'Casă în Vaideeni',
        description: 'Proprietate în Vaideeni, zonă pastorală cu peisaje montane spectaculoase.',
        type: 'house',
        thumbnail: 'assets/vaideeni1.avif'
      },
      {
        id: BuyEnum.BARBATESTI,
        name: 'Casă în Bărbătești',
        description: 'Casă în Bărbătești, zonă liniștită cu acces la natură.',
        type: 'house',
        thumbnail: 'assets/barbatesti1.avif'
      },
      {
        id: BuyEnum.BAIA_TEREN,
        name: 'Teren în Baia de Fier',
        description: 'Teren la drum asfaltat. Intravilan: 1948 mp. Extravilan: 5840 mp',
        type: 'land',
        thumbnail: 'assets/teren_baia1.jpg'
      },
      {
        id: BuyEnum.POLOVRAGI_TEREN,
        name: 'Teren în Polovragi',
        description: 'Teren cu utilități. Suprafață: 8000 mp. Zonă pitorească.',
        type: 'land',
        thumbnail: 'assets/teren_polovragi1.avif'
      }
    ];

    this.loadingService.loadingOff();
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
  }

  initializeSwiper(): void {
    if (this._propertyType === false) {
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

  viewPropertyDetails(property: any) {
    this.router.navigate(['/property', BuyEnum[property.id]]);
  }

  getFilteredProperties() {
    return this.properties.filter(property =>
      (this._propertyType && property.type === 'house') ||
      (!this._propertyType && property.type === 'land')
    );
  }
}
