import {AfterViewInit, Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MessageService} from "primeng/api";
import {HomeFormService} from "../service/home-form-service/home-form-service.service";
import {HomeFormDto} from "../dto/home-form.dto";
import {LoadingService} from "../service/loading-service/loading-service.service";
import {FormStatesUtil} from "../utils/form-states-util";
import {Checkbox} from "primeng/checkbox";
import {Chip} from "primeng/chip";
import {InputText} from "primeng/inputtext";
import {ProgressSpinner} from "primeng/progressspinner";
import {Toast} from "primeng/toast";
import {AsyncPipe, NgIf} from "@angular/common";
import {Textarea} from "primeng/textarea";
import {ButtonDirective} from "primeng/button";
import {Ripple} from "primeng/ripple";
import {FloatLabel} from "primeng/floatlabel";
import {RadioButton} from "primeng/radiobutton";
import { PropertyType } from "../dto/property-type.enum";
import { DataService } from "../service/data-service";
import { SeoService } from "../service/seo.service";
import { LoggerService } from "../service/logger.service";

@Component({
  selector: 'app-form-page',
  templateUrl: './form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
  imports: [
    Checkbox,
    ReactiveFormsModule,
    FormsModule,
    InputText,
    ProgressSpinner,
    Toast,
    NgIf,
    AsyncPipe,
    Textarea,
    ButtonDirective,
    Ripple,
    FloatLabel,
    RadioButton
  ],
  providers: [MessageService]
})
export class FormPageComponent implements OnInit, AfterViewInit{
  formGroup!: FormGroup;
  accord: boolean = false;
  newsletter: boolean = false;
  termenii: boolean = false;
  politica: boolean = false;
  PropertyType = PropertyType;

  private destroyRef = inject(DestroyRef);

  constructor(private messageService: MessageService,
              private homeFormService: HomeFormService,
              public loadingService: LoadingService,
              private formBuilder: FormBuilder,
              private dataService: DataService,
              private seo: SeoService,
              private logger: LoggerService) {
  }

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Găsește-ți casa sau terenul ideal în Oltenia de sub Munte',
      description: 'Completează formularul și echipa noastră te ajută să găsești casa tradițională sau terenul perfect în sate din Oltenia de sub Munte, județul Vâlcea.',
      canonicalPath: '/homes'
    });
    this.seo.setBreadcrumbs([
      { name: 'Acasă', path: '/' },
      { name: 'Găsește-mi locul', path: '/homes' }
    ]);

    this.formGroup = this.formBuilder.group(
      {
        name: ['', Validators.required],
        surname: ['', Validators.required],
        phoneNumber: ['', Validators.required],
        mail: ['', [Validators.required, Validators.email]],
        details: new FormControl('', { validators: [Validators.required] }),
        propertyType: new FormControl<PropertyType | null>(PropertyType.HOUSE, { validators: [Validators.required] }),
        terms: new FormControl<boolean>(false, { validators: [Validators.requiredTrue] }),
        newsletter: new FormControl<boolean>(false)
      }
    );
  }

  ngAfterViewInit() {
    // Implementation not needed
  }

  sendRequest() {
    if (this.formGroup.valid) {
      if (this.formGroup.get('terms')?.value) {
        const formData: HomeFormDto = new HomeFormDto();
        formData.name = this.formGroup.get('name')?.value;
        formData.surname = this.formGroup.get('surname')?.value;
        formData.phone = this.formGroup.get('phoneNumber')?.value;
        formData.mail = this.formGroup.get('mail')?.value;
        formData.details = this.formGroup.get('details')?.value || '';
        formData.propertyType = this.formGroup.get('propertyType')?.value ?? PropertyType.HOUSE;
        this.loadingService.loadingOn();
        this.homeFormService.sendHomeEmails(formData)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'HAI IN SAT',
              detail: 'Formularul a fost trimis cu succes'
            });
            this.formGroup.reset({
              name: '',
              surname: '',
              phoneNumber: '',
              mail: '',
              details: '',
              propertyType: PropertyType.HOUSE,
              terms: false,
              newsletter: false
            });
            this.loadingService.loadingOff();
          },
          error: (error) => {
            this.logger.error('There was an error!', error);
            this.loadingService.loadingOff();
          }
        })
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'HAI IN SAT',
          detail: 'Trebuie să acceptați termenii si condițiile și politica de confindețialitate!'
        });
      }
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'HAI IN SAT',
        detail: 'Vă rugăm completați toate câmpurile obligatorii!'
      });
      this.formGroup.markAllAsTouched();
      FormStatesUtil.markAllAsDirty(this.formGroup);
    }
  }

  openTermenii() {
    // deschide pop-up-ul global din footer
    this.dataService.openTermsPopup();
  }

  openPolitica() {
    // deschide pop-up-ul global din footer
    this.dataService.openPrivacyPopup();
  }
}
