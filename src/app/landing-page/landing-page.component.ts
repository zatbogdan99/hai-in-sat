import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  Inject, OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {MenuItem} from "primeng/api";
import {NavigationEnd, Router} from "@angular/router";
import {DataService} from "../service/data-service";

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, OnDestroy{
  @ViewChild('secondSection', { static: true }) secondSection!: ElementRef<HTMLDivElement>;
  // @ViewChild('menu', { static: true }) menu!: ElementRef<HTMLDivElement>;
  // @ViewChild('menuSecond', { static: true }) menuSecond!: ElementRef<HTMLDivElement>;
  @ViewChild('imageFirst', { static: true }) imageFirst!: ElementRef<HTMLDivElement>;
  @ViewChild('imageSecond', { static: true }) imageSecond!: ElementRef<HTMLDivElement>;

  items: MenuItem[] | undefined;


  constructor(@Inject(DOCUMENT) private document: Document, private router: Router, private service: DataService) {
  }

  ngOnInit() {
    // this.service.reload$.subscribe(value => {
    //   if (value) {
    //     console.log('intru pe if');
    //     this.service.reload$.next(false);
    //     location.reload();
    //   }
    // });
    this.initialAnimations();
    this.initScrollAnimations();
    this.items = [
      {
        label: 'Despre noi',
        icon: 'pi pi-fw pi-images'
      },
      {
        label: 'Contacteaza-ne!',
        icon: 'pi pi-fw pi-phone'
      },
      {
        icon: 'pi pi-fw pi-instagram'
      },
      {
        icon: 'pi pi-fw pi-facebook'
      },
      {
        icon: 'pi pi-fw pi-twitter'
      }
    ];
  }

  initScrollAnimations(): void {
    gsap.to(this.imageFirst.nativeElement, {
      scrollTrigger: {
        trigger: this.imageFirst.nativeElement,
        scrub: true,

        start: '110% center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.1,
      scale: 1.2,
      height: 250,
    });
    gsap.to(this.imageSecond.nativeElement, {
      scrollTrigger: {
        trigger: this.imageSecond.nativeElement,
        scrub: true,
        start: '80% center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.1,
      scale: 1.2,
      height: 380,
    });

    gsap.to(this.document.querySelector('.heading-1'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.heading-1'),
        scrub: true,
        start: '150% center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      color: '#fff',
      duration: 1.5,
    });
    gsap.to(this.document.querySelector('.paragraph'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.paragraph'),
        scrub: true,
        start: '150% center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      color: '#fff',
      duration: 1.5,
    });
    gsap.to(this.document.querySelector('.btn'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.btn'),
        scrub: true,
        start: '150% center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      color: '#fff',
      duration: 1.5,
    });

    gsap.from(this.document.querySelector('#about'), {
      scrollTrigger: {
        trigger: this.document.querySelector('#about'),
        scrub: true,
        toggleClass: 'active',
        start: 'top center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      y: 40,
      opacity: 0,
    });
    gsap.from(this.document.querySelector('#buy'), {
      scrollTrigger: {
        trigger: this.document.querySelector('#buy'),
        scrub: true,
        toggleClass: 'active',
        start: 'top center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      y: 40,
      opacity: 0,
    });
    gsap.from(this.document.querySelector('.box'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.box'),
        scrub: true,
        toggleClass: 'active',
        start: '-10% center',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      width: 0,
      opacity: 0,
    });
    gsap.from(this.document.querySelector('.info-1__visual img'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.info-1__visual img'),
        scrub: true,
        toggleClass: 'active',
        start: '-60% bottom',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      height: 0,
      scale: '1.3',
      opacity: 0,
    });

    gsap.from(this.document.querySelector('.quote'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.quote'),
        scrub: true,
        toggleClass: 'active',
        start: '-60% bottom',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      opacity: 0,
    });
    gsap.from(this.document.querySelector('.info-1__text .heading-3'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.info-1__text .heading-3'),
        scrub: true,
        toggleClass: 'active',
        start: '-60% bottom',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      y: 40,
      opacity: 0,
    });
    gsap.from(this.document.querySelector('.info-1__text .paragraph'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.info-1__text .paragraph'),
        scrub: true,
        toggleClass: 'active',
        start: '-60% bottom',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      y: 40,
      opacity: 0,
    });
    gsap.from(this.document.querySelector('.info-1__text .btn--learn'), {
      scrollTrigger: {
        trigger: this.document.querySelector('.info-1__text .btn--learn'),
        scrub: true,
        toggleClass: 'active',
        start: '-60% bottom',
      } as gsap.plugins.ScrollTriggerInstanceVars,
      duration: 1.5,
      y: 40,
      opacity: 0,
    });
  }

  initialAnimations(): void {
    // gsap.from(this.menu.nativeElement.childNodes, {
    //   duration: 0.5,
    //   opacity: 0,
    //   y: -20,
    //   stagger: 0.2,
    //   delay: 0.5,
    // });
    // gsap.from(this.menuSecond.nativeElement.childNodes, {
    //   duration: 0.5,
    //   opacity: 0,
    //   y: -20,
    //   stagger: 0.2,
    //   delay: 0.8,
    // });
    gsap.from(this.imageFirst.nativeElement, {
      duration: 0.7,
      opacity: 0,
      y: -30,
      delay: 0.5,
    });
    gsap.from(this.imageSecond.nativeElement, {
      duration: 0.7,
      opacity: 0,
      y: -30,
      delay: 0.6,
    });
    gsap.from(this.document.querySelector('.heading-1'), {
      duration: 0.7,
      opacity: 0,
      y: -30,
      delay: 0.6,
    });
    gsap.from(this.document.querySelector('.paragraph'), {
      duration: 0.7,
      opacity: 0,
      y: -30,
      delay: 0.7,
    });
    gsap.from(this.document.querySelector('.btn'), {
      duration: 0.7,
      opacity: 0,
      y: -30,
      delay: 0.8,
    });
  }

  goToHomeFormPage() {
    this.router.navigateByUrl("/homes");
  }

  goToInfoPage() {
    this.router.navigateByUrl("/info-page");
  }

  goToUnderTheMountain() {
    console.log('am apasat');
    this.router.navigateByUrl("/under-the-mountain");
  }

  goToSeeTheArea() {
    this.router.navigateByUrl("/see-the-area");
  }

  ngOnDestroy() {
    gsap.killTweensOf("*");
  }
}
