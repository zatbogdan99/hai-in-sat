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

    switch (this.propertyType) {
      case BuyEnum.MILOSTEA:
        this.propertyName = 'Pensiune în Milostea';
        this.propertyDescription = 'Pensiune cu 16 camere. Utilități: Gratar/Restaurant/Terasa/Sala de evenimente. Afacere la cheie.';
        this.photoService.getMilosteaPension().then((images) => {
          this.images = images;
          this.loadingService.loadingOff();
          this.goToSlide(0);
        });
        break;
      default:
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
