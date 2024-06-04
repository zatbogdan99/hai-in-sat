import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {gsap} from "gsap";
import SplitType from "split-type";
import {MessageService} from "primeng/api";
import {HomeFormServiceService} from "../service/home-form-service/home-form-service.service";
import {HomeFormDto} from "../dto/home-form.dto";
import {LoadingService} from "../service/loading-service/loading-service.service";
import {FormStatesUtil} from "../utils/form-states-util";

@Component({
  selector: 'app-form-page',
  templateUrl: './form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
  providers: [MessageService]
})
export class FormPageComponent implements OnInit, AfterViewInit{
  formGroup!: FormGroup;
  sliderValue: number = 0;
  ariaRangeValues: number[] = [0, 30];
  priceRangeValues: number[] = [0, 200000];
  river: boolean = false;
  neighbor: boolean = false;
  accord: boolean = false;
  termenii: boolean = false;
  politica: boolean = false;

  constructor(private messageService: MessageService,
              private homeFormService: HomeFormServiceService,
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

  ngAfterViewInit() {

    const firstText1 = new SplitType('#first-text1');
    const firstText2 = new SplitType('#first-text2');

    // gsap.set('.char', { y: 0 });

    // gsap.to('.char', {
    //   y: -100,
    //   stagger: 0.05,
    //   delay: 0.2,
    //   duration: .1
    // })
  }

  sendRequest() {
    if (this.formGroup.valid) {
      if (this.accord) {
        const formData: HomeFormDto = new HomeFormDto();
        formData.name = this.formGroup.get("name")?.value;
        formData.surname = this.formGroup.get("surname")?.value;
        formData.phone = this.formGroup.get("phoneNumber")?.value;
        formData.mail = this.formGroup.get("mail")?.value;
        formData.mentions = this.formGroup.get("mentions")?.value;
        formData.nearRiver = this.river;
        formData.withNeighbours = this.neighbor;
        formData.price = 'între ' + this.priceRangeValues[0] + '€ și ' + this.priceRangeValues[1] + '€';
        formData.distance = 'între ' + this.ariaRangeValues[0] + 'km și ' + this.ariaRangeValues[1] + 'km';
        this.loadingService.loadingOn();
        this.homeFormService.sendHomeEmails(formData).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'HAI IN SAT',
              detail: 'Formularul a fost trimis cu succes'
            });
            this.formGroup.reset();
            this.river = false;
            this.neighbor = false;
            this.ariaRangeValues= [0, 30];
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
    this.termenii = true;
  }

  openPolitica() {
    this.politica = true;
  }
}
