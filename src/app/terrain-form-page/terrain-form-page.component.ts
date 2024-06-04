import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MessageService} from "primeng/api";
import {HomeFormDto} from "../dto/home-form.dto";
import {TerrainFormServiceService} from "../service/terrain-form-service/terrain-form-service.service";
import {TerrainFormDto} from "../dto/terrain-form.dto";
import {LoadingService} from "../service/loading-service/loading-service.service";
import {FormStatesUtil} from "../utils/form-states-util";

@Component({
  selector: 'app-terrain-form-page',
  templateUrl: './terrain-form-page.component.html',
  styleUrls: ['./terrain-form-page.component.scss']
})
export class TerrainFormPageComponent implements OnInit{
  formGroup!: FormGroup;
  sliderValue: number = 0;
  ariaRangeValues: number[] = [0, 30];
  priceRangeValues: number[] = [0, 200000];
  river: boolean = false;
  mountain: boolean = false;
  isolated: boolean = false;
  accord: boolean = false;
  termenii: boolean = false;
  politica: boolean = false;

  constructor(private messageService: MessageService,
              private terrainFormService: TerrainFormServiceService,
              public loadingService: LoadingService,
              private formBuilder: FormBuilder) {
  }

  ngOnInit(): void {
    this.ariaRangeValues = [0, 30];
    this.priceRangeValues = [0, 200000];
    this.formGroup = this.formBuilder.group(
      {
        name: ['', Validators.required],
        surname: ['', Validators.required],
        phoneNumber: ['', Validators.required],
        mail: ['', Validators.required],
        mentions: new FormControl()
      }
    );
  }

  sendRequest() {
    if (this.formGroup.valid) {
      if (this.accord) {
        const formData: TerrainFormDto = new TerrainFormDto();
        formData.name = this.formGroup.get("name")?.value;
        formData.surname = this.formGroup.get("surname")?.value;
        formData.phone = this.formGroup.get("phoneNumber")?.value;
        formData.mail = this.formGroup.get("mail")?.value;
        formData.mentions = this.formGroup.get("mentions")?.value;
        formData.price = 'între ' + this.priceRangeValues[0] + '€ și ' + this.priceRangeValues[1] + '€';
        formData.surface = 'între ' + this.ariaRangeValues[0] + 'km și ' + this.ariaRangeValues[1] + 'km';
        this.loadingService.loadingOn();
        this.terrainFormService.sendTerrainEmails(formData).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'HAI IN SAT',
              detail: 'Formularul a fost trimis cu succes'
            });
            this.formGroup.reset();
            this.ariaRangeValues = [0, 30];
            this.priceRangeValues = [0, 200000];
            this.loadingService.loadingOff();
          },
          error: (error) => {
            console.error('There was an error!', error);
          }
        })
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'HAI IN SAT',
          detail: 'Trebuie sa acceptați termenii si condițiile și politica de confindețialitate!'
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
    this.termenii = true;
  }

  openPolitica() {
    this.politica = true;
  }
}
