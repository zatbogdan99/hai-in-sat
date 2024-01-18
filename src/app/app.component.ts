import {Component, OnInit} from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import {MenuItem, MessageService} from "primeng/api";
import {BackgroundImageService} from "./background-image.service";
import { gsap } from 'gsap';
import {Router} from "@angular/router";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService]
})
export class AppComponent implements OnInit{
  title = 'hai-in-sat';
  items: MenuItem[] | undefined;
  faTiktok = faTiktok;

  constructor(private router: Router) {

  }

  goToAboutUs() {
    this.router.navigateByUrl("/about-us");
  }

  goToInfoPage() {
    this.router.navigateByUrl("/info-page");
  }

  goToLandingPage() {
    this.router.navigateByUrl("/landing-page");
  }

  goToHomeFormPage() {
    this.router.navigateByUrl("/home-form-page");
  }

  goToTerrainFormPage() {
    this.router.navigateByUrl("/terrain-form-page");
  }

  private goToContactUsPage() {
    this.router.navigateByUrl("/contact-us");
  }

  private goToUnderTheMountain() {
    this.router.navigateByUrl("/under-the-mountain");
  }

  private goToSeeTheArea() {
    this.router.navigateByUrl("/see-the-area");
  }

  ngOnInit() {

    this.items = [
      {
        label: 'Despre noi',
        icon: 'pi pi-fw pi-images',
        styleClass: 'despreNoiStyle',
        command: () => this.goToAboutUs(),
      },
      {
        label: 'Oltenia de sub munte',
        icon: 'pi pi-fw pi-sun',
        command: () => this.goToUnderTheMountain()
      },
      {
        label: 'Satul lunii',
        icon: 'pi pi-fw pi-home',
        command: () => this.goToInfoPage()
      },
      {
        label: 'Haide sa vezi zona!',
        icon: 'pi pi-fw pi-eye',
        command: () => this.goToSeeTheArea()
      },
      {
        label: 'Case',
        icon: 'pi pi-fw pi-home',
        command: () => this.goToHomeFormPage()
      },
      {
        label: 'Terenuri',
        command: () => this.goToTerrainFormPage()
      },
      {
        label: 'Contacteaza-ne!',
        icon: 'pi pi-fw pi-phone',
        command: () => this.goToContactUsPage()
      },
      {
        icon: 'pi pi-fw pi-instagram'
      },
      {
        icon: 'pi pi-fw pi-facebook'
      }
    ];

    // gsap.to(document.body, {
    //   backgroundImage: 'url("/assets/oras.jpg")',
    //   duration: 0.5,
    //   ease: 'power2.inOut'
    // });

  }
}
