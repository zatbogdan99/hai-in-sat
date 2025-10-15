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
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from "@angular/forms";
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
import { PropertyFormDTO } from "../dto/property-form.dto";
import { PropertyFormEmailServiceService } from "../service/property-form-email-service/property-form-email-service.service";

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
    AutoComplete
  ],
  styleUrls: ['./properties.component.scss']
})
export class PropertiesComponent {
  displayGalleria: boolean;
  images: any[] | undefined;
  displayModal: boolean = false;

  properties: PropertyDTO[] = [];
  layout: 'grid' | 'list' = 'grid';
  propertyType: 'house' | 'land' = 'land';

  options = [
    { label: 'Listă', value: 'list' },
    { label: 'Grid', value: 'grid' }
  ];

  setPropertyType(type: 'house' | 'land') {
    this.propertyType = type;
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
    private propertyFormService: PropertyFormServiceService,
    private propertyFormEmailService: PropertyFormEmailServiceService,
    private fb: FormBuilder
  ) {
    this.loadingService.loadingOn();

    this.propertyForm = this.fb.group({
      firstName: [''],
      email: [''],
      phone: [''],
      village: [''],
      propertyType: [''],
      propertyDescription: ['']
    });
    this.filteredPropertyTypeOptions = this.propertyTypeOptions.slice();

    this.displayGalleria = false;
    this.initializeProperties();
  }

  initializeProperties() {
    this.loadingService.loadingOn();
    this.propertyFormService.getAllProperties().subscribe({
      next: (props: PropertyDTO[]) => {
        this.properties = Array.isArray(props) ? props : [];
        console.log('Properties:', this.properties);
        this.loadingService.loadingOff();
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.properties = [];
        this.loadingService.loadingOff();
      }
    });
  }

  showAddPropertyModal() {
    this.displayModal = true;
  }

  saveProperty() {
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

    // Send DTO to backend service
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

  filterPropertyType(event: any) {
    const query = (event && event.query ? event.query : '').toLowerCase();
    this.filteredPropertyTypeOptions = this.propertyTypeOptions.filter(opt => opt.toLowerCase().includes(query));
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

  truncate(text: string, limit: number = 50): string {
    if (!text) return '';
    return text.length > limit ? text.slice(0, limit) + '...' : text;
  }
}
