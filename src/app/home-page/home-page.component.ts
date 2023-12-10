import {AfterViewInit, Component, ElementRef, HostListener, OnInit} from '@angular/core';
import { gsap } from 'gsap';
import SplitType from 'split-type'
import {BackgroundImageService} from "../background-image.service";

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, AfterViewInit{

  constructor(private bgImageService: BackgroundImageService) {

  }

  ngOnInit() {
    // this.bgImageService.backgroundImage$.subscribe(imageUrl => {
    //   gsap.to(document.body, {
    //     backgroundImage: `url("${imageUrl}")`,
    //     duration: 0.1,
    //     ease: 'power2.inOut'
    //   });
    // });
  }

  ngAfterViewInit() {
    gsap.fromTo('.title', { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1, delay: 8 });

    const firstText1 = new SplitType('#first-text1');
    const firstText2 = new SplitType('#first-text2');
    const firstText3 = new SplitType('#first-text3');

    gsap.to('.char', {
      y: 0,
      stagger: 0.05,
      delay: 0.2,
      duration: .1
    })
  }

  changeBackground() {
    // console.log('change background');
    // this.bgImageService.changeBackgroundImage('/assets/fundal-copaci.jpg');
  }

}
