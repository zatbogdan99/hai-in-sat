import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { PropertiesStateService, PropertyTypeFilter } from '../service/properties-state-service/properties-state.service';
import { PropertyDTO } from '../dto/property.dto';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { gsap } from 'gsap';
import {ProgressSpinner} from "primeng/progressspinner";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {PhoneLinkPipe} from "../pipes/phone-link.pipe";
import {SeoService} from "../service/seo.service";
import {generateSlug} from "../utils/slug.util";
import {PropertyType} from "../dto/property-type.enum";

export interface GallerySlide {
  type: 'image' | 'video';
  src: string;
  poster?: string | null;
  alt: string;
}

@Component({
  selector: 'app-property-details',
  templateUrl: './property-details.component.html',
  imports: [
    ProgressSpinner,
    NgIf,
    AsyncPipe,
    NgForOf,
    PhoneLinkPipe
  ],
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('photoTrack') photoTrack?: ElementRef;
  @ViewChild('mobileTrack') mobileTrack?: ElementRef;
  @ViewChildren('mobileVideoEl') mobileVideoElements?: QueryList<ElementRef<HTMLVideoElement>>;

  propertyId: string = '';
  propertyKind?: PropertyType;
  propertyName: string = '';
  propertyDescription: string = '';
  propertyVideoUrl: string | null = null;
  propertyVideoPoster: string | null = null;

  videoSlide: GallerySlide | null = null;
  photoSlides: GallerySlide[] = [];
  mobileSlides: GallerySlide[] = [];
  currentIndex: number = 0;
  mobileIndex: number = 0;

  private isAnimating = false;
  private destroyRef = inject(DestroyRef);
  private totalPhotos = 0;
  private loadedPhotosCount = 0;
  private readonly INITIAL_BATCH = 2;
  private readonly NEXT_BATCH = 3;
  private propertyTypeLabel: string = 'Teren';

  get categoryLabel(): string {
    return this.propertyKind === PropertyType.HOUSE ? 'Casă de vânzare' : 'Teren de vânzare';
  }

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
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.propertyId = params['id'];
        this.loadPropertyDetails();
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.goToSlide(0);
      this.goToMobileSlide(0);
    });
  }

  loadPropertyDetails(): void {
    this.propertyService.getPropertyById(this.propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (prop: PropertyDTO) => {
        if (!prop) {
          console.warn('Property not found for id', this.propertyId);
          this.loadingService.loadingOff();
          this.router.navigate(['/properties']);
          return;
        }
        this.propertyName = prop.name;
        this.propertyDescription = prop.description;
        this.propertyKind = prop.type as PropertyType;
        this.propertyVideoUrl = prop.videoUrl || null;
        this.propertyVideoPoster = prop.thumbnail || null;
        this.propertyTypeLabel = prop.type === 'land' ? 'Teren' : 'Casă';

        this.videoSlide = this.propertyVideoUrl ? {
          type: 'video',
          src: this.propertyVideoUrl,
          poster: this.propertyVideoPoster,
          alt: `Tur video — ${prop.name}`
        } : null;

        const slug = generateSlug(prop.type as PropertyType, prop.name);
        const currentSlug = this.route.snapshot.params['slug'];
        if (!currentSlug || currentSlug !== slug) {
          this.router.navigate(['/property', this.propertyId, slug], {
            replaceUrl: true,
            queryParamsHandling: 'preserve'
          });
        }

        const canonicalPath = `/property/${this.propertyId}/${slug}`;
        this.seo.updatePageMeta({
          title: `${this.propertyTypeLabel} de vânzare: ${prop.name} | Hai în Sat`,
          description: `${this.propertyTypeLabel} de vânzare în Oltenia de sub Munte: ${prop.name}. ${(prop.description || '').replace(/<[^>]*>/g, '').substring(0, 150)}`,
          ogImage: prop.thumbnail,
          canonicalPath
        });

        this.seo.setRealEstateListing({
          name: `${this.propertyTypeLabel} de vânzare: ${prop.name}`,
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

        this.photoSlides = [];
        this.rebuildMobileSlides();
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
    const name = prop?.name ?? this.propertyName;

    this.propertyService.getPhotos(this.propertyId, offset, limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (resp) => {
        this.totalPhotos = resp.total;
        const newSlides: GallerySlide[] = resp.photos
          .filter(src => src && src.trim())
          .map((src, idx) => ({
            type: 'image' as const,
            src: src.trim(),
            alt: `${this.propertyTypeLabel}: ${name} - Imagine ${offset + idx + 1}`
          }));

        this.photoSlides = [...this.photoSlides, ...newSlides];
        this.rebuildMobileSlides();
        this.loadedPhotosCount += resp.photos.length;

        if (offset === 0) {
          this.loadingService.loadingOff();
          if (this.photoSlides.length || this.videoSlide) {
            setTimeout(() => {
              this.goToSlide(0);
              this.goToMobileSlide(0);
            });
          }
        }
        if (this.loadedPhotosCount < this.totalPhotos) {
          this.loadPhotosBatch(this.loadedPhotosCount, this.NEXT_BATCH);
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

  private rebuildMobileSlides(): void {
    this.mobileSlides = this.videoSlide ? [this.videoSlide, ...this.photoSlides] : [...this.photoSlides];
  }

  // Galeria de poze (no-video sau desktop-with-video) — currentIndex peste photoSlides
  goToSlide(index: number): void {
    const track = this.photoTrack?.nativeElement as HTMLElement | undefined;
    if (!track) return;
    const slides = track.querySelectorAll('.gsap-carousel-slide') as NodeListOf<HTMLElement>;
    this.currentIndex = this.animateTo(slides, this.currentIndex, index);
  }

  prevSlide(): void {
    if (!this.photoSlides.length) return;
    const len = this.photoSlides.length;
    this.goToSlide((this.currentIndex - 1 + len) % len);
  }

  nextSlide(): void {
    if (!this.photoSlides.length) return;
    this.goToSlide((this.currentIndex + 1) % this.photoSlides.length);
  }

  // Carusel mobil cu video — mobileIndex peste mobileSlides ([video, ...photos])
  goToMobileSlide(index: number): void {
    this.pauseMobileVideos();
    const track = this.mobileTrack?.nativeElement as HTMLElement | undefined;
    if (!track) return;
    const slides = track.querySelectorAll('.gsap-carousel-slide') as NodeListOf<HTMLElement>;
    this.mobileIndex = this.animateTo(slides, this.mobileIndex, index);
  }

  mobilePrev(): void {
    const len = this.mobileSlides.length;
    if (!len) return;
    this.goToMobileSlide((this.mobileIndex - 1 + len) % len);
  }

  mobileNext(): void {
    const len = this.mobileSlides.length;
    if (!len) return;
    this.goToMobileSlide((this.mobileIndex + 1) % len);
  }

  private pauseMobileVideos(): void {
    this.mobileVideoElements?.forEach(ref => {
      const video = ref.nativeElement;
      if (!video.paused) video.pause();
    });
  }

  private animateTo(slides: NodeListOf<HTMLElement>, fromIdx: number, toIdx: number): number {
    if (fromIdx === toIdx) {
      const slide = slides[toIdx];
      if (slide) gsap.set(slide, { xPercent: 0, opacity: 1, pointerEvents: 'auto', zIndex: 2 });
      return toIdx;
    }
    if (this.isAnimating) return fromIdx;
    const currentSlide = slides[fromIdx];
    const nextSlide = slides[toIdx];
    if (!currentSlide || !nextSlide) return fromIdx;

    const direction = toIdx > fromIdx ? 1 : -1;
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
    return toIdx;
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
      queryParams: { page, size, type }
    });
  }

  private parseNumberParam(value: string | null, fallback: number): number {
    if (value === null || value === '') return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseTypeParam(value: string | null, fallback: PropertyTypeFilter): PropertyTypeFilter {
    if (value === 'house' || value === 'land') return value;
    return fallback;
  }
}
