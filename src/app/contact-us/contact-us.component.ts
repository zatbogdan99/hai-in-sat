import {Component, OnInit} from '@angular/core';
import { TweenMax } from 'gsap';
import {gsap} from "gsap";
import {TimelineLite} from 'gsap';
import {Power2} from "gsap";

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.scss']
})
export class ContactUsComponent implements OnInit{
  leftEye: any;
  rightEye: any;
  requestId: any;
  mouse: any;
  svg: any;
  centerX: any;
  centerY: any;
  tweens = {};
  tween: any;

  constructor() {

  }

  ngOnInit(): void {
    const elements = document.querySelectorAll('.text');

    elements.forEach(element => {
      element.addEventListener("mouseover", (event: any) => {
        const trg = event.target;

        if (trg.tagName.toLowerCase() === 'span') {
          let t1 = new TimelineLite();

          t1.to(trg, 0.5, {yPercent: -20, ease:Power2.easeInOut});
          t1.to(trg, 0.5, {yPercent: 0, ease:Power2.easeInOut});
        }
      });
    });

    this.svg = <any>document.querySelector("#svg");
    this.mouse = this.svg.createSVGPoint();

    this.leftEye = this.createEye("#left-eye");
    this.rightEye = this.createEye("#right-eye");

    this.requestId = null;

    window.addEventListener("mousemove", (event) => {
     this.mouse.x = event.clientX;
     this.mouse.y = event.clientY;

      if (!this.requestId) {
        this.requestId = requestAnimationFrame(() => this.onFrame())
      }
    });


  }

  bindTextAnimation() {
    const textContainers = document.querySelectorAll(".text");

    const defaultScale = 1;
    const maxScale = 2;
    const neighborScale = 1.5;

    textContainers.forEach((textContainer) => {
      const spans = textContainer.querySelectorAll("span");
      console.log('spans: ', spans);

      textContainer.addEventListener("mousemove", (e) => {
        const target = e.target;
        const index = Array.from(spans).indexOf(<HTMLSpanElement>target);

        spans.forEach((span, i) => {
          let scale = defaultScale;

          if (i === index) {
            scale = maxScale;
          } else if (i === index - 1 || i === index + 1) {
            scale = neighborScale;
          }
          span.style.transform = `scaleY(${scale})`;
          console.log('span style transform');
        });
      });

      textContainer.addEventListener("mouseleave", () => {
        spans.forEach((span) => {
          span.style.transform = `scaleY(${defaultScale})`;
          console.log('mouseLeaveEvenet');
        })
      })

    });
  }

  onFrame() {
    let point = this.mouse.matrixTransform(this.svg.getScreenCTM().inverse());
    this.rotateTo(point, this.leftEye);
    this.rotateTo(point, this.rightEye);

    this.requestId = null;
  }

  createEye(selector: any) {
    const element = document.querySelector(selector);

    TweenMax.set(element, {
      transformOrigin: "center",
    });

    let bbox = element.getBBox();
    this.centerX = bbox.x + bbox.width / 2;
    this.centerY = bbox.y + bbox.height / 2;

    return element;
  }

  rotateTo(point: any, element: any) {
    let dx = point.x - this.centerX;
    let dy = point.y - this.centerY;

    let angle = Math.atan2(dy, dx);

    TweenMax.to(element, 0.3, {
      rotation: angle + "_rad_short",
    });
  }

  isMobile() {
    const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
  }

}
