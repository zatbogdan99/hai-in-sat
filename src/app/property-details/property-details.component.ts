import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PhotoService } from '../service/photo-service';
import { BuyEnum } from '../dto/buy.enum';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { gsap } from 'gsap';
import {ProgressSpinner} from "primeng/progressspinner";
import {Button} from "primeng/button";
import {YoutubePlayerComponent} from "../youtube-player/youtube-player.component";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  imports: [
    ProgressSpinner,
    Button,
    YoutubePlayerComponent,
    NgIf,
    AsyncPipe,
    NgForOf
  ],
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;
  propertyId: string = '';
  propertyType: BuyEnum = BuyEnum.MILOSTEA;
  propertyName: string = '';
  propertyDescription: string = '';
  images: any[] = [];
  currentIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    public loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loadingService.loadingOn();
    this.route.params.subscribe(params => {
      this.propertyId = params['id'];
      this.loadPropertyDetails();
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.goToSlide(0));
  }

  loadPropertyDetails(): void {
    this.propertyType = BuyEnum[this.propertyId as keyof typeof BuyEnum];
    console.log('Aici incarc detaliile pentru: ', this.propertyType);
    console.log('Property ID:', this.propertyId);
    console.log('Property Type (enum value):', this.propertyType);
    console.log('BuyEnum values:', {
      MILOSTEA: BuyEnum.MILOSTEA,
      BAIA: BuyEnum.BAIA,
      BAIA_TEREN: BuyEnum.BAIA_TEREN
    });

    switch (this.propertyType) {
      case BuyEnum.MILOSTEA:
        this.propertyName = 'Pensiune în Milostea';
        this.propertyDescription = 'Pensiune cu 16 camere. Utilități: Gratar/Restaurant/Terasa/Sala de evenimente. Afacere la cheie.';
        this.photoService.getMilosteaPension().then((images) => {
          console.log('Loaded Milostea images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.BAIA:
        this.propertyName = 'Casă în Baia de Fier';
        this.propertyDescription = 'Casă în Baia de Fier, aproape de Peștera Muierilor. Zonă cu tradiții și peisaje montane.';
        this.photoService.getBaiaImages().then((images) => {
          console.log('Loaded Baia images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.BAIA_TEREN:
        this.propertyName = 'Teren în Baia de Fier';
        this.propertyDescription = 'Teren la drum asfaltat. Intravilan: 1948 mp. Extravilan: 5840 mp';
        this.photoService.getBaiaTeren().then((images) => {
          console.log('Loaded Baia Teren images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.POLOVRAGI:
        this.propertyName = 'Casă în Polovragi';
        this.propertyDescription = 'Casă în Polovragi, aproape de mănăstire și de intrarea în Cheile Oltețului.';
        this.photoService.getPolovragiImages().then((images) => {
          console.log('Loaded Polovragi images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.POLOVRAGI_TEREN:
        this.propertyName = 'Teren în Polovragi';
        this.propertyDescription = 'Teren cu utilități. Suprafață: 8000 mp. Zonă pitorească.';
        this.photoService.getTerenPolovragi().then((images) => {
          console.log('Loaded Polovragi Teren images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.HOREZU:
        this.propertyName = 'Casă în Horezu';
        this.propertyDescription = 'Casă tradițională în Horezu, zonă renumită pentru ceramica sa.';
        this.photoService.getHorezuImages().then((images) => {
          console.log('Loaded Horezu images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.COSTESTI:
        this.propertyName = 'Casă în Costești';
        this.propertyDescription = 'Proprietate în Costești, aproape de Cheile Oltețului și Peștera Polovragi.';
        this.photoService.getCostestiImages().then((images) => {
          console.log('Loaded Costesti images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.SLATIOARA:
        this.propertyName = 'Casă în Slătioara';
        this.propertyDescription = 'Casă în Slătioara, zonă liniștită, perfectă pentru relaxare.';
        this.photoService.getSlatioaraImages().then((images) => {
          console.log('Loaded Slatioara images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.VAIDEENI:
        this.propertyName = 'Casă în Vaideeni';
        this.propertyDescription = 'Proprietate în Vaideeni, zonă pastorală cu peisaje montane spectaculoase.';
        this.photoService.getVaideeniImages().then((images) => {
          console.log('Loaded Vaideeni images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      case BuyEnum.BARBATESTI:
        this.propertyName = 'Casă în Bărbătești';
        this.propertyDescription = 'Casă în Bărbătești, zonă liniștită cu acces la natură.';
        this.photoService.getBarbatestiImages().then((images) => {
          console.log('Loaded Barbatesti images:', images);
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      default:
        console.log('Unknown property type:', this.propertyType, 'with ID:', this.propertyId);
        this.router.navigate(['/properties']);
        break;
    }
  }

  goToSlide(index: number): void {
    const track = this.carouselTrack.nativeElement;
    const slides = track.querySelectorAll('.gsap-carousel-slide') as NodeListOf<HTMLElement>;
    const direction = index > this.currentIndex ? 1 : -1;

    const currentSlide = slides[this.currentIndex];
    const nextSlide = slides[index];
    if (!currentSlide || !nextSlide) return;

    const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.inOut' } });
    tl.to(currentSlide, { xPercent: -100 * direction, opacity: 0 });
    tl.fromTo(nextSlide, { xPercent: 100 * direction, opacity: 0 }, { xPercent: 0, opacity: 1 }, '<');

    this.currentIndex = index;
  }

  prevSlide(): void {
    const newIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.goToSlide(newIndex);
  }

  nextSlide(): void {
    const newIndex = (this.currentIndex + 1) % this.images.length;
    this.goToSlide(newIndex);
  }

  goBackToProperties(): void {
    this.router.navigate(['/properties']);
  }
}
