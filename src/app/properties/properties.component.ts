import { Component, OnInit } from '@angular/core';
import { LoadingService } from "../service/loading-service/loading-service.service";
import { GalleriaModule } from "primeng/galleria";
import { Divider } from "primeng/divider";
import { Dialog } from "primeng/dialog";
import { ProgressSpinner } from "primeng/progressspinner";
import { Button } from "primeng/button";
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
import { ActivatedRoute, Router } from "@angular/router";
import { PropertyFormServiceService } from "../service/property-form-service/property-form-service.service";
import { PropertyDTO } from "../dto/property.dto";
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from "primeng/tag";
import {InputText} from "primeng/inputtext";
import {Textarea} from "primeng/textarea";
import {FloatLabel} from "primeng/floatlabel";
import {DropdownModule} from "primeng/dropdown";
import {AutoComplete} from "primeng/autocomplete";
import {PaginatorModule} from "primeng/paginator";
import { PropertyFormDTO } from "../dto/property-form.dto";
import { PropertyFormEmailServiceService } from "../service/property-form-email-service/property-form-email-service.service";
import { PropertiesStateService, PropertyTypeFilter } from "../service/properties-state-service/properties-state.service";
import { SeoService } from "../service/seo.service";
import { FormStatesUtil } from "../utils/form-states-util";

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
    DropdownModule,
    AutoComplete,
    PaginatorModule
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

  options = [
    { label: 'Listă', value: 'list' },
    { label: 'Grid', value: 'grid' }
  ];

  setPropertyType(type: PropertyTypeFilter) {
    this.propertyType = type;
    this.propertiesState.setPropertyType(type);
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
    private router: Router,
    private route: ActivatedRoute,
    private propertyFormService: PropertyFormServiceService,
    private propertyFormEmailService: PropertyFormEmailServiceService,
    private propertiesState: PropertiesStateService,
    private fb: FormBuilder,
    private seo: SeoService
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

    const queryParams = this.route.snapshot.queryParamMap;
    const pageParam = queryParams.get('page');
    const sizeParam = queryParams.get('size');
    const typeParam = queryParams.get('type');

    const initialPage = this.parseNumberParam(pageParam, this.propertiesState.page);
    const initialSize = this.parseNumberParam(sizeParam, this.propertiesState.size);
    const initialType = this.parseTypeParam(typeParam, this.propertiesState.propertyType);

    this.page = initialPage;
    this.size = initialSize;
    this.propertyType = initialType;

    this.propertiesState.setPage(this.page);
    this.propertiesState.setSize(this.size);
    this.propertiesState.setPropertyType(this.propertyType);

    this.initializeProperties();
  }

  initializeProperties() {
    const cached = this.propertiesState.getCachedPage(this.page, this.size);
    if (cached) {
      this.properties = this.sortPropertiesByOrder(cached);
      this.totalRecords = this.propertiesState.totalRecords || cached.length;
      this.totalPages = this.propertiesState.totalPages || 1;
      this.loadingService.loadingOff();

      this.prefetchNextPage();
      return;
    }

    this.loadingService.loadingOn();
    this.propertyFormService.getPropertiesPage(this.page, this.size).subscribe({
      next: (resp) => {
        console.log('Apelul initial (paginat):', resp);
        const content = Array.isArray(resp?.content) ? resp.content : [];
        this.properties = this.sortPropertiesByOrder(content);
        this.totalRecords = typeof resp?.totalElements === 'number' ? resp.totalElements : content.length;
        this.totalPages = typeof resp?.totalPages === 'number' ? resp.totalPages : 1;
        this.propertiesState.setPage(this.page);
        this.propertiesState.setSize(this.size);
        this.propertiesState.setTotalRecords(this.totalRecords);
        this.propertiesState.setTotalPages(this.totalPages);
        this.propertiesState.setCachedPage(this.page, this.size, this.properties);
        this.loadingService.loadingOff();

        this.prefetchNextPage();
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.properties = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.propertiesState.setTotalRecords(0);
        this.propertiesState.setTotalPages(0);
        this.loadingService.loadingOff();
      }
    });
  }

  onPageChange(event: any) {
    this.page = event?.page ?? 0;
    if (event?.rows && event.rows !== this.size) {
      this.size = event.rows;
    }
    this.propertiesState.setPage(this.page);
    this.propertiesState.setSize(this.size);
    this.initializeProperties();
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

    console.log('PropertyFormDTO:', dto);

    this.propertyForm.reset();
    this.displayModal = false;

    this.loadingService.loadingOn();
    this.propertyFormEmailService.sendPropertyForm(dto).subscribe({
      next: () => {
        console.log('Property form sent successfully');
        this.loadingService.loadingOff();
      },
      error: (err) => {
        console.error('Failed to send property form', err);
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

  viewPropertyDetails(property: PropertyDTO) {
    console.log('Viewing property details:', property);
    if (property && property.id) {
      this.router.navigate(['/property', property.id], {
        queryParams: {
          page: this.page,
          size: this.size,
          type: this.propertyType
        }
      });
    }
  }

  getFilteredProperties() {
    return this.properties.filter(property => property.type === this.propertyType);
  }

  private sortPropertiesByOrder(properties: PropertyDTO[]): PropertyDTO[] {
    return [...properties].sort((first, second) => {
      const firstOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const secondOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }
      return first.name.localeCompare(second.name);
    });
  }

  truncate(text: string, limit: number = 50): string {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }

  getImageAlt(property: PropertyDTO): string {
    const type = property.type === 'land' ? 'Teren' : 'Casă';
    const truncatedDesc = this.truncate(property.description, 60);
    return `${type} de vânzare: ${property.name} - ${truncatedDesc}`;
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

    const cachedNext = this.propertiesState.getCachedPage(nextPage, this.size);
    if (cachedNext) {
      return;
    }

    this.propertyFormService.getPropertiesPage(nextPage, this.size).subscribe({
      next: (resp) => {
        const content = Array.isArray(resp?.content) ? resp.content : [];
        const sorted = this.sortPropertiesByOrder(content);
        this.propertiesState.setCachedPage(nextPage, this.size, sorted);
        console.log(`✅ Prefetched page ${nextPage} (${sorted.length} properties)`);
      },
      error: (err) => {
        console.warn(`⚠️ Failed to prefetch page ${nextPage}`, err);
      }
    });
  }
}
