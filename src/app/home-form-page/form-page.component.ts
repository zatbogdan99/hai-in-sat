import {AfterViewInit, Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {gsap} from "gsap";
import SplitType from "split-type";
import {MessageService} from "primeng/api";

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

  constructor(private messageService: MessageService) {
  }

  ngOnInit(): void {
    this.ariaRangeValues = [0, 30];
    this.priceRangeValues = [0, 200000];
  }

  ngAfterViewInit() {

    const firstText1 = new SplitType('#first-text1');
    const firstText2 = new SplitType('#first-text2');

    gsap.to('.char', {
      y: 0,
      stagger: 0.05,
      delay: 0.2,
      duration: .1
    })
  }

  sendRequest() {
    this.messageService.add({severity:'success', summary:'HAI IN SAT', detail:'Formularul a fost trimis cu succes'});
  }
}
