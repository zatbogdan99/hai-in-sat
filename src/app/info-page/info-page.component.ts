import {AfterViewInit, Component, OnInit} from '@angular/core';
import {gsap, Power2} from "gsap";
import ScrollTrigger from 'gsap/ScrollTrigger';
import SplitType from "split-type";
import {PhotoService} from "../service/photo-service";

@Component({
  selector: 'app-info-page',
  templateUrl: './info-page.component.html',
  styleUrls: ['./info-page.component.scss']
})
export class InfoPageComponent implements OnInit, AfterViewInit{
  horezuImages: any[] | undefined;
  costestiImages: any[] | undefined;
  slatioaraImages: any[] | undefined;
  polovragiImages: any[] | undefined;
  baiaImages: any[] | undefined;
  vaideeniImages: any[] | undefined;
  barbatestiImages: any[] | undefined;


  constructor(private photoService: PhotoService) {
  }

  ngOnInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    let revealContainers = document.querySelectorAll(".reveal");
    revealContainers.forEach((container) => {
      let image = container.querySelector("img");
      let t1 = gsap.timeline({
        scrollTrigger: {
          trigger: container,
        }
      });
      t1.set(container, { autoAlpha: 1 });
      t1.from(container, 1.5, {
        xPercent: -100,
        ease: Power2.easeOut
      });
      t1.from(image, 1.5, {
        xPercent: 100,
        scale: 1.3,
        delay: -1.5,
        ease: Power2.easeOut
      });
    })

    this.photoService.getHorezuImages().then((images) => (this.horezuImages = images));
    this.photoService.getCostestiImages().then((images) => (this.costestiImages = images));
  }

  ngAfterViewInit() {
    // const firstText1 = new SplitType('#first-text1');
    //
    // gsap.to('.char', {
    //   y: 0,
    //   stagger: 0.05,
    //   delay: 0.2,
    //   duration: .1
    // })
  }

}
