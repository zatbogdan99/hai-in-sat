import {Component, OnInit} from '@angular/core';
import {FormGroup} from "@angular/forms";
import {MessageService} from "primeng/api";

@Component({
  selector: 'app-terrain-form-page',
  templateUrl: './terrain-form-page.component.html',
  styleUrls: ['./terrain-form-page.component.scss']
})
export class TerrainFormPageComponent implements OnInit{
  formGroup!: FormGroup;
  sliderValue: number = 0;
  ariaRangeValues: number[] = [0, 50000];
  priceRangeValues: number[] = [0, 50000];
  river: boolean = false;
  mountain: boolean = false;
  isolated: boolean = false;

  constructor(private messageService: MessageService) {
  }

  ngOnInit(): void {
    this.ariaRangeValues = [0, 50000];
    this.priceRangeValues = [0, 50000];
  }

  sendRequest() {
    this.messageService.add({severity:'success', summary:'HAI IN SAT', detail:'Formularul a fost trimis cu succes'});
  }
}
