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
import {generateSlug} from "../utils/slug.util";
import {PropertyType} from "../dto/property-type.enum";

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
  private isAnimating = false;

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

  private totalPhotos = 0;
  private loadedPhotosCount = 0;
  private readonly INITIAL_BATCH = 2;
  private readonly NEXT_BATCH = 3;

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

        const slug = generateSlug(prop.type as PropertyType, prop.name);
        const currentSlug = this.route.snapshot.params['slug'];
        if (!currentSlug || currentSlug !== slug) {
          this.router.navigate(['/property', this.propertyId, slug], {
            replaceUrl: true,
            queryParamsHandling: 'preserve'
          });
        }

        const propertyTypeLabel = prop.type === 'land' ? 'Teren' : 'Casă';
        const canonicalPath = `/property/${this.propertyId}/${slug}`;
        this.seo.updatePageMeta({
          title: `${propertyTypeLabel} de vânzare: ${prop.name} | Hai în Sat`,
          description: `${propertyTypeLabel} de vânzare în Oltenia de sub Munte: ${prop.name}. ${(prop.description || '').replace(/<[^>]*>/g, '').substring(0, 150)}`,
          ogImage: prop.thumbnail,
          canonicalPath
        });

        this.seo.setRealEstateListing({
          name: `${propertyTypeLabel} de vânzare: ${prop.name}`,
          description: (prop.description || '').replace(/<[^>]*>/g, '').substring(0, 300),
          url: canonicalPath,
          image: prop.thumbnail,
          propertyType: prop.type as 'house' | 'land'
        });

        this.seo.setBreadcrumbs([
          { name: 'Acasă', path: '/' },
          { name: 'Proprietăți', path: '/properties' },
          { name: prop.name, path: canonicalPath }
        ]);

        this.images = [];
        this.loadedPhotosCount = 0;
        this.loadPhotosBatch(0, this.INITIAL_BATCH, prop);
      },
      error: (err) => {
        console.error('Failed to load property details', err);
        this.loadingService.loadingOff();
        this.router.navigate(['/properties']);
      }
    });
  }

  private loadPhotosBatch(offset: number, limit: number, prop?: PropertyDTO): void {
    const propertyType = (prop?.type ?? this.images[0]?.propertyType) === 'land' ? 'Teren' : 'Casă';
    const name = prop?.name ?? this.propertyName;

    console.log(`[Photos] Cerere batch: offset=${offset}, limit=${limit}`);

    console.log('Aduc pozele pentru property id: ', this.propertyId);
    this.propertyService.getPhotos(this.propertyId, offset, limit).subscribe({
      next: (resp) => {
        this.totalPhotos = resp.total;
        console.log(`[Photos] Răspuns: ${resp.photos.length} poze primite, total în DB: ${resp.total}`);

        const newImages = resp.photos
          .filter(src => src && src.trim())
          .map((src, idx) => ({
            itemImageSrc: src.trim(),
            alt: `${propertyType}: ${name} - Imagine ${offset + idx + 1}`
          }));

        this.images = [...this.images, ...newImages];
        this.loadedPhotosCount += resp.photos.length;
        console.log(`[Photos] Imagini în galerie: ${this.images.length}, încărcate total: ${this.loadedPhotosCount}/${this.totalPhotos}`);

        if (offset === 0) {
          this.loadingService.loadingOff();
          if (this.images.length) {
            setTimeout(() => this.goToSlide(0));
          }
          if (this.loadedPhotosCount < this.totalPhotos) {
            console.log(`[Photos] Încărcare background: mai sunt ${this.totalPhotos - this.loadedPhotosCount} poze`);
            this.loadPhotosBatch(this.loadedPhotosCount, this.NEXT_BATCH);
          } else {
            console.log(`[Photos] Toate pozele au fost încărcate.`);
          }
        } else {
          if (this.loadedPhotosCount < this.totalPhotos) {
            console.log(`[Photos] Încărcare background: mai sunt ${this.totalPhotos - this.loadedPhotosCount} poze`);
            this.loadPhotosBatch(this.loadedPhotosCount, this.NEXT_BATCH);
          } else {
            console.log(`[Photos] Toate pozele au fost încărcate.`);
          }
        }
      },
      error: (err) => {
        console.error(`[Photos] Eroare la batch offset=${offset}:`, err);
        if (offset === 0) {
          this.loadingService.loadingOff();
        }
      }
    });
  }

  goToSlide(index: number): void {
    const track = this.carouselTrack?.nativeElement;
    if (!track) return;

    const slides = track.querySelectorAll('.gsap-carousel-slide') as NodeListOf<HTMLElement>;

    // Initial setup: make the target slide visible without animation
    if (this.currentIndex === index) {
      const slide = slides[index];
      if (slide) {
        gsap.set(slide, { xPercent: 0, opacity: 1, pointerEvents: 'auto', zIndex: 2 });
      }
      return;
    }

    if (this.isAnimating) return;

    const currentSlide = slides[this.currentIndex];
    const nextSlide = slides[index];
    if (!currentSlide || !nextSlide) return;

    const direction = index > this.currentIndex ? 1 : -1;
    this.currentIndex = index;
    this.isAnimating = true;

    const tl = gsap.timeline({
      defaults: { duration: 0.5, ease: 'power2.inOut' },
      onComplete: () => { this.isAnimating = false; }
    });

    tl.fromTo(currentSlide,
      { xPercent: 0, opacity: 1, pointerEvents: 'auto' },
      { xPercent: -100 * direction, opacity: 0, pointerEvents: 'none', zIndex: 1 }
    );

    tl.fromTo(nextSlide,
      { xPercent: 100 * direction, opacity: 0, pointerEvents: 'none' },
      { xPercent: 0, opacity: 1, pointerEvents: 'auto', zIndex: 2 },
      '<'
    );
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

