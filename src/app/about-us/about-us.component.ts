import {AfterViewInit, Component, OnInit} from '@angular/core';
import {gsap} from "gsap";

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.component.html',
  styleUrls: ['./about-us.component.scss']
})
export class AboutUsComponent implements OnInit, AfterViewInit{
  ngOnInit() {

  }

  ngAfterViewInit(): void {
    gsap.from(".left-container", 2, {
      width: "0",
      ease: Expo.easeInOut
    });
    gsap.from(".right-container", 2, {
      delay: 1.5,
      width: "0",
      opacity: "0",
      ease: Expo.easeInOut
    });
    gsap.from(".center-container", 2, {
      delay: 3,
      width: "0",
      x: -20,
      ease: Expo.easeInOut
    });
    gsap.from(".logo", 2, {
      delay: 1.5,
      y: 20,
      opacity: 0,
      ease: Expo.easeInOut
    });
    gsap.from(".info", 2, {
      delay: 1.5,
      y: 50,
      opacity: 0,
      scale: 2.5,
      ease: Expo.easeInOut
    });
    gsap.from(".story", 2, {
      delay: 2.5,
      y: 20,
      opacity: 0,
      ease: Expo.easeInOut
    });
    gsap.from(".menu", 2, {
      delay: 3.5,
      y: 20,
      opacity: 0,
      rotation: 90,
      ease: Expo.easeInOut
    });
  }
}
