import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { PropertiesStateService, PropertyTypeFilter } from '../service/properties-state-service/properties-state.service';
import { PropertyDTO } from '../dto/property.dto';
import { BuyEnum } from '../dto/buy.enum';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { gsap } from 'gsap';
import {ProgressSpinner} from "primeng/progressspinner";
import {Button} from "primeng/button";
import {YoutubePlayerComponent} from "../youtube-player/youtube-player.component";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {PhoneLinkPipe} from "../pipes/phone-link.pipe";
import {SeoService} from "../service/seo.service";

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  imports: [
    ProgressSpinner,
    Button,
    YoutubePlayerComponent,
    NgIf,
    AsyncPipe,
    NgForOf,
    PhoneLinkPipe
  ],
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;
  propertyId: string = '';
  propertyType: BuyEnum = BuyEnum.BAIA;
  propertyName: string = '';
  propertyDescription: string = '';
  images: any[] = [];
  currentIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyFormServiceService,
    public loadingService: LoadingService,
    private propertiesState: PropertiesStateService,
    private seo: SeoService
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
    this.propertyType = BuyEnum.BAIA;

    this.propertyService.getPropertyById(this.propertyId).subscribe({
      next: (prop: PropertyDTO) => {
        if (!prop) {
          console.warn('Property not found for id', this.propertyId);
          this.loadingService.loadingOff();
          this.router.navigate(['/properties']);
          return;
        }
        this.propertyName = prop.name;
        this.propertyDescription = prop.description;

        const propertyTypeLabel = prop.type === 'land' ? 'Teren' : 'Casă';
        this.seo.updatePageMeta({
          title: `${propertyTypeLabel} de vânzare: ${prop.name} | Hai în Sat`,
          description: `${propertyTypeLabel} de vânzare în Oltenia de sub Munte: ${prop.name}. ${(prop.description || '').replace(/<[^>]*>/g, '').substring(0, 150)}`,
          ogImage: prop.thumbnail || (prop.photos && prop.photos.length ? prop.photos[0] : undefined),
          canonicalPath: `/property/${this.propertyId}`
        });

        const imgs: any[] = [];
        const propertyType = prop.type === 'land' ? 'Teren' : 'Casă';
        if (prop.photos && prop.photos.length) {
          prop.photos.forEach((src, idx) => imgs.push({
            itemImageSrc: src,
            alt: `${propertyType}: ${prop.name} - Imagine ${idx + 1}`
          }));
        }
        if (!imgs.length && prop.thumbnail) {
          imgs.push({
            itemImageSrc: prop.thumbnail,
            alt: `${propertyType} de vânzare: ${prop.name}`
          });
        }
        this.images = imgs;

        this.loadingService.loadingOff();
        if (this.images.length) {
          this.goToSlide(0);
        }
      },
      error: (err) => {
        console.error('Failed to load property details', err);
        this.loadingService.loadingOff();
        this.router.navigate(['/properties']);
      }
    });
  }

  goToSlide(index: number): void {
    const track = this.carouselTrack.nativeElement;
    const slides = track.querySelectorAll('.gsap-carousel-slide') as NodeListOf<HTMLElement>;

    const currentSlide = slides[this.currentIndex];
    const nextSlide = slides[index];
    if (!currentSlide || !nextSlide || this.currentIndex === index) return;

    const direction = index > this.currentIndex ? 1 : -1;

    const tl = gsap.timeline({
      defaults: { duration: 0.6, ease: 'power2.inOut' }
    });

    tl.to(currentSlide, {
      xPercent: -100 * direction,
      opacity: 0,
      zIndex: 1,
      pointerEvents: 'none',
      onComplete: () => {
        gsap.set(currentSlide, { clearProps: 'all' });
      }
    });

    tl.to(nextSlide, {
      xPercent: 0,
      opacity: 1,
      zIndex: 2
    }, '<');

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
    const queryParams = this.route.snapshot.queryParamMap;
    const pageParam = queryParams.get('page');
    const sizeParam = queryParams.get('size');
    const typeParam = queryParams.get('type');

    const page = this.parseNumberParam(pageParam, this.propertiesState.page);
    const size = this.parseNumberParam(sizeParam, this.propertiesState.size);
    const type = this.parseTypeParam(typeParam, this.propertiesState.propertyType);

    this.router.navigate(['/properties'], {
      queryParams: {
        page,
        size,
        type
      }
    });
  }

  private parseNumberParam(value: string | null, fallback: number): number {
    if (value === null || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseTypeParam(value: string | null, fallback: PropertyTypeFilter): PropertyTypeFilter {
    if (value === 'house' || value === 'land') {
      return value;
    }
    return fallback;
  }
}
