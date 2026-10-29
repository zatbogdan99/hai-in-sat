import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList, DestroyRef, inject, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyApiService } from '../service/property-api/property-api.service';
import { PropertiesStateService, PropertyTypeFilter } from '../service/properties-state-service/properties-state.service';
import { PropertyDTO } from '../dto/property.dto';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { gsap } from 'gsap';
import {ProgressSpinner} from "primeng/progressspinner";
import {AsyncPipe, isPlatformServer, NgForOf, NgIf} from "@angular/common";
import {PhoneLinkPipe} from "../pipes/phone-link.pipe";
import {SeoService} from "../service/seo.service";
import {generateSlug} from "../utils/slug.util";
import {isPropertyType, PropertyType, toPropertyType} from "../dto/property-type.enum";
import {SSR_RENDER_STATE} from "../ssr-render-state";
import {HtmlTextService} from "../service/html-text.service";
import {LoggerService} from "../service/logger.service";
import {NotFoundComponent} from "../not-found/not-found.component";
import {stripPhones} from "../utils/strip-phones.util";

/**
 * Imaginea din meta-tagurile de partajare și din JSON-LD. Miniaturile din baza de date sunt base64 (până la 13 MB):
 * în meta ar triplica HTML-ul randat pe server, iar Facebook/WhatsApp oricum nu afișează imagini data:.
 */
const SEO_FALLBACK_IMAGE = 'https://hai-în-sat.ro/assets/og-hai-in-sat.jpg';
/**
 * Pozele se cer câte 3, cu offset multiplu de 3: până la corecția din 2026-10, backendul împărțea offsetul
 * la limită ca să afle pagina, iar loturile nealiniate (2, apoi 3) aduceau din nou primele poze și o pierdeau
 * pe ultima. Loturile egale merg corect cu ambele variante ale backendului.
 */
const PHOTO_BATCH = 3;
/**
 * Pe server, posterul videoului (miniatura base64, până la câțiva MB) nu intră în HTML peste această mărime: apărea de
 * două ori (videoul de pe telefon și cel de pe desktop). Browserul îl pune după hidratare.
 */
const SSR_INLINE_IMAGE_LIMIT = 150 * 1024;
/** Distanța orizontală minimă (px) a unei glisări cu degetul care schimbă poza. */
const SWIPE_THRESHOLD_PX = 40;
/** Înălțimea aproximativă a barei de control a videoului: glisarea pornită acolo derulează videoul, nu galeria. */
const VIDEO_CONTROLS_PX = 56;

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
    PhoneLinkPipe,
    RouterLink,
    NotFoundComponent
  ],
  styleUrls: ['./property-details.component.scss']
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  @ViewChild('photoTrack') photoTrack?: ElementRef;
  @ViewChild('mobileTrack') mobileTrack?: ElementRef;
  @ViewChild('photoThumbs') photoThumbs?: ElementRef<HTMLElement>;
  @ViewChild('mobileThumbs') mobileThumbs?: ElementRef<HTMLElement>;
  @ViewChildren('mobileVideoEl') mobileVideoElements?: QueryList<ElementRef<HTMLVideoElement>>;

  propertyId: string = '';
  propertyNotFound = false;
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
  private swipeStart: { x: number; y: number } | null = null;
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private ssrRenderState = inject(SSR_RENDER_STATE, { optional: true });
  private transferState = inject(TransferState);
  private totalPhotos = 0;
  private loadedPhotosCount = 0;
  /** Amprentele pozelor deja adăugate, ca un răspuns repetat să nu dubleze slide-urile. */
  private readonly photoKeys = new Set<string>();
  private propertyTypeLabel: string = 'Teren';
  /** Devine true după primul lot de poze, ca galeria goală să se poată deosebi de una încă neîncărcată. */
  photosLoaded = false;
  /** Primul lot de poze a eșuat: mesajul din locul galeriei spune asta, nu că proprietatea n-ar avea poze. */
  photosError = false;
  /** Locurile goale din banda de miniaturi cât se încarcă pozele (și în HTML-ul de pe server). */
  readonly thumbPlaceholders = [0, 1, 2, 3];

  get categoryLabel(): string {
    return this.propertyKind === PropertyType.HOUSE ? 'Casă de vânzare' : 'Teren de vânzare';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyApiService: PropertyApiService,
    public loadingService: LoadingService,
    private propertiesState: PropertiesStateService,
    private seo: SeoService,
    private htmlText: HtmlTextService,
    private logger: LoggerService
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
    this.propertyNotFound = false;
    const notFoundKey = makeStateKey<boolean>(`property-not-found:${this.propertyId}`);
    if (!isPlatformServer(this.platformId) && this.transferState.get(notFoundKey, false)) {
      // Păstrează pagina 404 la hidratare: răspunsurile HTTP de eroare nu intră în cache-ul Angular.
      this.transferState.remove(notFoundKey);
      this.showNotFound();
      return;
    }

    this.propertyApiService.getPropertyById(this.propertyId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (prop: PropertyDTO) => {
        if (!prop) {
          this.logger.warn('Property not found for id', this.propertyId);
          this.showNotFound();
          return;
        }
        if (!isPropertyType(prop.type)) {
          this.logger.warn(`Tip de proprietate necunoscut: ${prop.type} (proprietatea ${prop.id})`);
        }
        const type = toPropertyType(prop.type);
        this.propertyName = prop.name;
        this.propertyDescription = prop.description;
        this.propertyKind = type;
        this.propertyVideoUrl = prop.videoUrl || null;
        this.propertyVideoPoster = this.posterFor(prop.thumbnail);
        this.propertyTypeLabel = type === PropertyType.LAND ? 'Teren' : 'Casă';

        this.videoSlide = this.propertyVideoUrl ? {
          type: 'video',
          src: this.propertyVideoUrl,
          poster: this.propertyVideoPoster,
          alt: `Tur video — ${prop.name}`
        } : null;

        const slug = generateSlug(type, prop.name);
        const currentSlug = this.route.snapshot.params['slug'];
        if (!currentSlug || currentSlug !== slug) {
          this.router.navigate(['/property', this.propertyId, slug], {
            replaceUrl: true,
            queryParamsHandling: 'preserve'
          });
        }

        const canonicalPath = `/property/${this.propertyId}/${slug}`;
        const seoName = stripPhones(prop.name);
        const plainDescription = stripPhones(this.htmlText.htmlToText(prop.description));
        const seoImage = this.seoImageFor(prop.thumbnail);
        this.seo.updatePageMeta({
          title: `${this.propertyTypeLabel} de vânzare: ${prop.name} | Hai în Sat`,
          description: `${this.propertyTypeLabel} de vânzare în Oltenia de sub Munte: ${seoName}. ${plainDescription.substring(0, 150)}`,
          ogImage: seoImage,
          canonicalPath
        });

        this.seo.setRealEstateListing({
          name: `${this.propertyTypeLabel} de vânzare: ${prop.name}`,
          description: plainDescription.substring(0, 300),
          url: canonicalPath,
          image: seoImage,
          propertyType: type === PropertyType.HOUSE ? 'house' : 'land'
        });

        this.seo.setBreadcrumbs([
          { name: 'Acasă', path: '/' },
          { name: 'Proprietăți', path: '/properties' },
          { name: prop.name, path: canonicalPath }
        ]);

        this.photoSlides = [];
        this.photoKeys.clear();
        this.photosLoaded = false;
        this.photosError = false;
        this.rebuildMobileSlides();
        this.loadedPhotosCount = 0;
        if (isPlatformServer(this.platformId)) {
          // Pe server galeria rămâne goală: pozele base64 (câțiva MB fiecare) ar intra de două ori în HTML
          // (în <img> și în starea transferată) și răspunsul ar depăși limitele App Engine. Le cere browserul.
          this.loadingService.loadingOff();
          return;
        }
        this.loadPhotosBatch(0, PHOTO_BATCH, prop);
      },
      error: (err) => {
        if (this.shouldMarkSsrUnavailable(err)) {
          this.markSsrUnavailable(err);
          return;
        }

        this.logger.error('Failed to load property details', err);
        if (this.isTransientUpstreamError(err)) {
          this.loadingService.loadingOff();
          this.router.navigate(['/properties']);
          return;
        }
        this.showNotFound();
      }
    });
  }

  private showNotFound(): void {
    this.propertyNotFound = true;
    this.loadingService.loadingOff();
    this.seo.setNoindex();

    if (isPlatformServer(this.platformId)) {
      if (this.ssrRenderState) {
        this.ssrRenderState.notFound = true;
      }
      this.transferState.set(makeStateKey<boolean>(`property-not-found:${this.propertyId}`), true);
    }
  }

  private shouldMarkSsrUnavailable(err: unknown): boolean {
    return isPlatformServer(this.platformId) && this.isTransientUpstreamError(err);
  }

  private markSsrUnavailable(err: unknown): void {
    if (!this.ssrRenderState) {
      this.logger.error('Failed to load property details during SSR', err);
      return;
    }

    this.ssrRenderState.serviceUnavailable = true;
    this.ssrRenderState.error = err;
  }

  private isTransientUpstreamError(err: unknown): boolean {
    const status = this.getErrorStatus(err);

    return status === 0 || (status !== null && status >= 500) || this.isTimeoutError(err);
  }

  private getErrorStatus(err: unknown): number | null {
    const candidate = err as { status?: unknown; statusCode?: unknown };

    if (typeof candidate.status === 'number') {
      return candidate.status;
    }

    if (typeof candidate.statusCode === 'number') {
      return candidate.statusCode;
    }

    return null;
  }

  private isTimeoutError(err: unknown): boolean {
    const candidate = err as { name?: unknown; message?: unknown };

    return candidate.name === 'TimeoutError'
      || (typeof candidate.message === 'string' && candidate.message.toLowerCase().includes('timeout'));
  }

  private loadPhotosBatch(offset: number, limit: number, prop?: PropertyDTO): void {
    const name = prop?.name ?? this.propertyName;

    this.propertyApiService.getPhotos(this.propertyId, offset, limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (resp) => {
        this.totalPhotos = resp.total;
        const newSlides: GallerySlide[] = [];
        for (const raw of resp.photos ?? []) {
          const src = raw?.trim();
          if (!src) continue;
          const key = this.photoKey(src);
          if (this.photoKeys.has(key)) continue;
          this.photoKeys.add(key);
          newSlides.push({
            type: 'image',
            src,
            alt: `${this.propertyTypeLabel}: ${name} - Imagine ${this.photoSlides.length + newSlides.length + 1}`
          });
        }

        this.photoSlides = [...this.photoSlides, ...newSlides];
        this.rebuildMobileSlides();
        this.loadedPhotosCount += resp.photos?.length ?? 0;

        if (offset === 0) {
          this.photosLoaded = true;
          this.loadingService.loadingOff();
          if (this.photoSlides.length || this.videoSlide) {
            setTimeout(() => {
              this.goToSlide(0);
              this.goToMobileSlide(0);
            });
          }
        }
        // Un lot gol oprește încărcarea, chiar dacă totalul raportat e mai mare.
        if ((resp.photos?.length ?? 0) > 0 && this.shouldLoadNextPhotoBatch()) {
          this.loadPhotosBatch(this.loadedPhotosCount, PHOTO_BATCH);
        }
      },
      error: (err) => {
        this.logger.error(`[Photos] Eroare la batch offset=${offset}:`, err);
        if (this.ssrRenderState) {
          this.ssrRenderState.cacheable = false;
        }
        if (offset === 0) {
          this.photosLoaded = true;
          this.photosError = true;
          this.loadingService.loadingOff();
        }
      }
    });
  }

  private shouldLoadNextPhotoBatch(): boolean {
    return !isPlatformServer(this.platformId) && this.loadedPhotosCount < this.totalPhotos;
  }

  /** Amprentă ieftină pentru o poză base64 (lungime + început + sfârșit), fără să compar șiruri de MB. */
  private photoKey(src: string): string {
    return `${src.length}:${src.slice(0, 96)}:${src.slice(-96)}`;
  }

  private posterFor(thumbnail?: string | null): string | null {
    if (!thumbnail) return null;
    const tooBigForSsr = isPlatformServer(this.platformId) && thumbnail.startsWith('data:') && thumbnail.length > SSR_INLINE_IMAGE_LIMIT;
    return tooBigForSsr ? null : thumbnail;
  }

  private seoImageFor(thumbnail?: string | null): string {
    return thumbnail && /^https?:\/\//.test(thumbnail) ? thumbnail : SEO_FALLBACK_IMAGE;
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
    this.revealThumb(this.photoThumbs, this.currentIndex);
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
    this.revealThumb(this.mobileThumbs, this.mobileIndex);
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

  /** Săgețile stânga/dreapta schimbă poza când galeria are focusul (pe video rămân la playerul nativ). */
  onGalleryKeydown(event: KeyboardEvent, gallery: 'photos' | 'mobile'): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if ((event.target as HTMLElement | null)?.tagName === 'VIDEO') return;
    event.preventDefault();
    this.step(gallery, event.key === 'ArrowRight');
  }

  /** Glisarea cu degetul sau creionul; mouse-ul folosește săgețile, ca selecția de text să meargă normal. */
  onSwipeStart(event: PointerEvent): void {
    this.swipeStart = null;
    if (event.pointerType === 'mouse' || !event.isPrimary) return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'VIDEO' && event.clientY > target.getBoundingClientRect().bottom - VIDEO_CONTROLS_PX) return;
    this.swipeStart = { x: event.clientX, y: event.clientY };
  }

  onSwipeEnd(event: PointerEvent, gallery: 'photos' | 'mobile'): void {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return;
    this.step(gallery, dx < 0);
  }

  /** Browserul a preluat gestul (derulare verticală): nu mai e glisare. */
  onSwipeCancel(): void {
    this.swipeStart = null;
  }

  private step(gallery: 'photos' | 'mobile', forward: boolean): void {
    if (gallery === 'mobile') {
      if (forward) this.mobileNext(); else this.mobilePrev();
    } else if (forward) {
      this.nextSlide();
    } else {
      this.prevSlide();
    }
  }

  /** Derulează banda de miniaturi doar pe orizontală, până se vede miniatura activă (pagina nu sare). */
  private revealThumb(strip: ElementRef<HTMLElement> | undefined, index: number): void {
    const el = strip?.nativeElement;
    const thumb = el?.children[index] as HTMLElement | undefined;
    if (!el || !thumb) return;
    const box = el.getBoundingClientRect();
    const rect = thumb.getBoundingClientRect();
    const delta = rect.left < box.left ? rect.left - box.left - 4 : rect.right > box.right ? rect.right - box.right + 4 : 0;
    if (delta) el.scrollBy({ left: delta, behavior: 'smooth' });
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

  get propertiesQueryParams(): {page: number; size: number; type: PropertyTypeFilter} {
    const queryParams = this.route.snapshot.queryParamMap;
    const pageParam = queryParams.get('page');
    const sizeParam = queryParams.get('size');
    const typeParam = queryParams.get('type');

    const page = this.parseNumberParam(pageParam, this.propertiesState.page);
    const size = this.parseNumberParam(sizeParam, this.propertiesState.size);
    const type = this.parseTypeParam(typeParam, this.propertiesState.propertyType);

    return { page, size, type };
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
