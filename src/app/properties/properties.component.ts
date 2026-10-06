import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingService } from "../service/loading-service/loading-service.service";
import { GalleriaModule } from "primeng/galleria";
import { Divider } from "primeng/divider";
import { Dialog } from "primeng/dialog";
import { ProgressSpinner } from "primeng/progressspinner";
import { Button, ButtonDirective } from "primeng/button";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import { DataViewModule } from "primeng/dataview";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { PropertyApiService } from "../service/property-api/property-api.service";
import { PropertyDTO } from "../dto/property.dto";
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from "primeng/tag";
import {InputText} from "primeng/inputtext";
import {Textarea} from "primeng/textarea";
import {FloatLabel} from "primeng/floatlabel";
import {AutoComplete} from "primeng/autocomplete";
import { PropertyFormDTO } from "../dto/property-form.dto";
import { PropertyContactService } from "../service/property-contact/property-contact.service";
import { PropertiesStateService, PropertyTypeFilter } from "../service/properties-state-service/properties-state.service";
import { SeoService } from "../service/seo.service";
import { FormStatesUtil } from "../utils/form-states-util";
import { generateSlug } from "../utils/slug.util";
import { PropertyType, toPropertyType } from "../dto/property-type.enum";
import { HtmlTextService } from "../service/html-text.service";
import { LoggerService } from "../service/logger.service";
import { SSR_RENDER_STATE } from '../ssr-render-state';
import { stripPhones } from '../utils/strip-phones.util';
import { Subscription } from 'rxjs';
import { AngleDoubleLeftIcon } from 'primeng/icons/angledoubleleft';
import { AngleLeftIcon } from 'primeng/icons/angleleft';
import { AngleRightIcon } from 'primeng/icons/angleright';
import { AngleDoubleRightIcon } from 'primeng/icons/angledoubleright';

const trimControlValue = (control: AbstractControl | null | undefined): string => {
  const value = control?.value;
  return typeof value === 'string' ? value.trim() : '';
};

const requiredTrimmedValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  return trimControlValue(control) ? null : { required: true };
};

const atLeastOneContactValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const email = trimControlValue(control.get('email'));
  const phone = trimControlValue(control.get('phone'));
  return email || phone ? null : { contactRequired: true };
};

@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  imports: [
    GalleriaModule,
    ProgressSpinner,
    Button,
    ButtonDirective,
    RouterLink,
    AngleDoubleLeftIcon,
    AngleLeftIcon,
    AngleRightIcon,
    AngleDoubleRightIcon,
    FormsModule,
    ReactiveFormsModule,
    DataViewModule,
    SelectButtonModule,
    TagModule,
    Divider,
    Dialog,
    InputText,
    Textarea,
    FloatLabel,
    AutoComplete
  ],
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent implements OnInit {
  displayGalleria: boolean;
  images: any[] | undefined;
  displayModal: boolean = false;

  properties: PropertyDTO[] = [];
  layout: 'grid' | 'list' = 'grid';
  propertyType: PropertyTypeFilter = 'land';

  // pagination
  page: number = 0;
  size: number = 6;
  totalRecords: number = 0;
  totalPages: number = 0;
  private destroyRef = inject(DestroyRef);
  private propertiesRequest?: Subscription;
  private readonly ssrRenderState = inject(SSR_RENDER_STATE, { optional: true });

  options = [
    { label: 'Listă', value: 'list' },
    { label: 'Grid', value: 'grid' }
  ];

  get pageNumbers(): number[] {
    const count = Math.min(6, this.totalPages);
    const start = Math.max(0, Math.min(this.page - Math.floor(count / 2), this.totalPages - count));
    return Array.from({ length: count }, (_, index) => start + index);
  }


  propertyForm!: FormGroup;

  propertyTypeOptions: string[] = ['Teren', 'Casă'];
  filteredPropertyTypeOptions: string[] = [];

  responsiveOptions: any[] = [
    { breakpoint: '1500px', numVisible: 5 },
    { breakpoint: '1024px', numVisible: 3 },
    { breakpoint: '768px', numVisible: 2 },
    { breakpoint: '560px', numVisible: 1 }
  ];

  constructor(
    public loadingService: LoadingService,
    private route: ActivatedRoute,
    private propertyApiService: PropertyApiService,
    private propertyContactService: PropertyContactService,
    private propertiesState: PropertiesStateService,
    private fb: FormBuilder,
    private seo: SeoService,
    private htmlText: HtmlTextService,
    private logger: LoggerService
  ) {
    this.propertyForm = this.fb.group({
      firstName: ['', [requiredTrimmedValidator]],
      email: ['', [Validators.email]],
      phone: ['', [Validators.pattern(/^\d+$/), Validators.minLength(10)]],
      village: ['', [requiredTrimmedValidator]],
      propertyType: [''],
      propertyDescription: ['']
    }, {
      validators: [atLeastOneContactValidator]
    });
    this.filteredPropertyTypeOptions = this.propertyTypeOptions.slice();

    this.displayGalleria = false;
  }

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Case și terenuri de vânzare în Oltenia de sub Munte',
      description: 'Explorează proprietăți de vânzare: case tradiționale și terenuri în sate din Oltenia de sub Munte, județul Vâlcea. Prețuri accesibile, locuri autentice.',
      canonicalPath: '/properties'
    });
    this.seo.setBreadcrumbs([
      { name: 'Acasă', path: '/' },
      { name: 'Proprietăți', path: '/properties' }
    ]);
    this.seo.removeJsonLd('real-estate-listing');

    // Angular reuses this component when only the filter/page query changes.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(queryParams => {
      // A URL without query parameters must also restore the same list on Back.
      this.page = this.parseNumberParam(queryParams.get('page'), 0);
      this.size = this.parseNumberParam(queryParams.get('size'), 6);
      this.propertyType = this.parseTypeParam(queryParams.get('type'), 'land');
      this.propertiesState.setPage(this.page);
      this.propertiesState.setSize(this.size);
      this.propertiesState.setPropertyType(this.propertyType);
      this.initializeProperties();
    });
  }

  initializeProperties() {
    this.propertiesRequest?.unsubscribe();
    const { page, size, propertyType } = this;
    const cached = this.propertiesState.getCachedPage(this.page, this.size, this.propertyType);
    if (cached) {
      const pagination = this.propertiesState.getCachedPagination(page, size, propertyType);
      this.properties = this.sortPropertiesByOrder(cached);
      this.totalRecords = pagination?.totalRecords ?? cached.length;
      this.totalPages = pagination?.totalPages ?? 1;
      this.propertiesState.setTotalRecords(this.totalRecords);
      this.propertiesState.setTotalPages(this.totalPages);
      this.loadingService.loadingOff();

      this.prefetchNextPage();
      return;
    }

    this.loadingService.loadingOn();
    this.propertiesRequest = this.propertyApiService.getPropertiesPage(page, size, propertyType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (resp) => {
        const content = Array.isArray(resp?.content) ? resp.content : [];
        this.properties = this.sortPropertiesByOrder(content);
        this.totalRecords = typeof resp?.totalElements === 'number' ? resp.totalElements : content.length;
        this.totalPages = typeof resp?.totalPages === 'number' ? resp.totalPages : 1;
        this.propertiesState.setPage(this.page);
        this.propertiesState.setSize(this.size);
        this.propertiesState.setTotalRecords(this.totalRecords);
        this.propertiesState.setTotalPages(this.totalPages);
        this.propertiesState.setCachedPage(page, size, propertyType, this.properties, {
          totalRecords: this.totalRecords, totalPages: this.totalPages
        });
        this.loadingService.loadingOff();

        this.prefetchNextPage();
      },
      error: (err) => {
        this.logger.error('Failed to fetch properties', err);
        if (this.ssrRenderState) {
          this.ssrRenderState.cacheable = false;
        }
        this.properties = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.propertiesState.setTotalRecords(0);
        this.propertiesState.setTotalPages(0);
        this.loadingService.loadingOff();
      }
    });
  }

  showAddPropertyModal() {
    this.displayModal = true;
  }

  saveProperty() {
    this.normalizePropertyFormValues();
    this.propertyForm.updateValueAndValidity();

    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();
      FormStatesUtil.markAllAsDirty(this.propertyForm);
      return;
    }

    const formValue = this.propertyForm.value;

    const dto: PropertyFormDTO = {
      firstName: formValue.firstName || '',
      email: formValue.email || '',
      phone: formValue.phone || '',
      village: formValue.village || '',
      propertyType: formValue.propertyType as 'Teren' | 'Casă',
      propertyDescription: formValue.propertyDescription || ''
    };

    this.propertyForm.reset();
    this.displayModal = false;

    this.loadingService.loadingOn();
    this.propertyContactService.sendPropertyForm(dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.logger.log('Property form sent successfully');
        this.loadingService.loadingOff();
      },
      error: (err) => {
        this.logger.error('Failed to send property form', err);
        this.loadingService.loadingOff();
      }
    });
  }

  shouldShowControlError(controlName: string, errorCode: string): boolean {
    const control = this.propertyForm.get(controlName);
    if (!control) {
      return false;
    }

    return (control.touched || control.dirty) && control.hasError(errorCode);
  }

  shouldShowContactError(): boolean {
    const emailControl = this.propertyForm.get('email');
    const phoneControl = this.propertyForm.get('phone');
    const interacted = !!emailControl && !!phoneControl && (
      emailControl.touched ||
      emailControl.dirty ||
      phoneControl.touched ||
      phoneControl.dirty
    );

    return interacted && this.propertyForm.hasError('contactRequired');
  }

  filterPropertyType(event: any) {
    const query = (event && event.query ? event.query : '').toLowerCase();
    this.filteredPropertyTypeOptions = this.propertyTypeOptions.filter(opt => opt.toLowerCase().includes(query));
  }

  callPhone(event: Event): void {
    event.preventDefault();
    window.location.href = 'tel:+40728140628';
  }

  propertyLink(property: PropertyDTO): string[] | null {
    return property?.id
      ? ['/property', property.id, generateSlug(toPropertyType(property.type), property.name)]
      : null;
  }

  getFilteredProperties() {
    // Backend-ul filtrează după type; returnăm direct lista deja filtrată.
    return this.properties;
  }

  private sortPropertiesByOrder(properties: PropertyDTO[]): PropertyDTO[] {
    return [...properties].sort((first, second) => {
      const firstOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const secondOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }
      // La egalitate departajăm ca backend-ul (id descrescător), ca re-sortarea
      // din client să nu schimbe ordinea deja stabilită de server.
      return (second.id ?? '').localeCompare(first.id ?? '');
    });
  }

  truncate(text: string, limit: number = 50): string {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }

  truncateDescription(description: string | null | undefined, limit: number = 50): string {
    return this.truncate(this.htmlText.htmlToText(description), limit);
  }

  getImageAlt(property: PropertyDTO): string {
    const type = toPropertyType(property.type) === PropertyType.LAND ? 'Teren' : 'Casă';
    const description = stripPhones(this.htmlText.htmlToText(property.description));
    const truncatedDesc = this.truncate(description, 60);
    return `${type} de vânzare: ${stripPhones(property.name)} - ${truncatedDesc}`;
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

  private normalizePropertyFormValues(): void {
    this.propertyForm.patchValue({
      firstName: trimControlValue(this.propertyForm.get('firstName')),
      email: trimControlValue(this.propertyForm.get('email')),
      phone: trimControlValue(this.propertyForm.get('phone')),
      village: trimControlValue(this.propertyForm.get('village')),
      propertyType: trimControlValue(this.propertyForm.get('propertyType')),
      propertyDescription: trimControlValue(this.propertyForm.get('propertyDescription'))
    }, { emitEvent: false });
  }

  private prefetchNextPage(): void {
    const nextPage = this.page + 1;

    if (nextPage >= this.totalPages) {
      return;
    }

    const currentType = this.propertyType;
    const currentSize = this.size;
    const cachedNext = this.propertiesState.getCachedPage(nextPage, currentSize, currentType);
    if (cachedNext) {
      return;
    }

    this.propertyApiService.getPropertiesPage(nextPage, currentSize, currentType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (resp) => {
        const content = Array.isArray(resp?.content) ? resp.content : [];
        const sorted = this.sortPropertiesByOrder(content);
        this.propertiesState.setCachedPage(nextPage, currentSize, currentType, sorted, {
          totalRecords: typeof resp?.totalElements === 'number' ? resp.totalElements : content.length,
          totalPages: typeof resp?.totalPages === 'number' ? resp.totalPages : 1
        });
        this.logger.log(`✅ Prefetched page ${nextPage} (${sorted.length} properties)`);
      },
      error: (err) => {
        this.logger.warn(`⚠️ Failed to prefetch page ${nextPage}`, err);
      }
    });
  }
}
