import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {MessageService} from "primeng/api";
import {HomeFormDto} from "../dto/home-form.dto";
import {TerrainFormServiceService} from "../service/terrain-form-service/terrain-form-service.service";
import {TerrainFormDto} from "../dto/terrain-form.dto";
import {LoadingService} from "../service/loading-service/loading-service.service";

@Component({
  selector: 'app-terrain-form-page',
  templateUrl: './terrain-form-page.component.html',
  styleUrls: ['./terrain-form-page.component.scss']
})
export class TerrainFormPageComponent implements OnInit{
  formGroup!: FormGroup;
  sliderValue: number = 0;
  ariaRangeValues: number[] = [0, 50000];
  priceRangeValues: number[] = [0, 200000];
  river: boolean = false;
  mountain: boolean = false;
  isolated: boolean = false;

  constructor(private messageService: MessageService,
              private terrainFormService: TerrainFormServiceService,
              public loadingService: LoadingService) {
  }

  ngOnInit(): void {
    this.ariaRangeValues = [0, 50000];
    this.priceRangeValues = [0, 200000];
    this.formGroup = new FormGroup(
      {
        name: new FormControl(),
        surname: new FormControl(),
        phoneNumber: new FormControl(),
        mail: new FormControl(),
        mentions: new FormControl()
      }
    );
  }

  sendRequest() {
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
        this.messageService.add({severity:'success', summary:'HAI IN SAT', detail:'Formularul a fost trimis cu succes'});
        this.loadingService.loadingOff();
      },
      error: (error) => {
        console.error('There was an error!', error);
      }
    })
  }
}
