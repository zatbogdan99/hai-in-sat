import {Component, OnInit} from '@angular/core';
import {MenuItem, MessageService} from "primeng/api";
import {Router} from "@angular/router";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faSquareFacebook } from "@fortawesome/free-brands-svg-icons";

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
  faFacebook = faFacebook;
  faInstagram = faInstagram;
  faSquareFacebook = faSquareFacebook;

  visible: boolean = false;
  contact: boolean = false;
  cookies: boolean = false;
  termenii: boolean = false;
  politica: boolean = false;


  showPolitica() {
    this.politica = true;
  }

  showTermenii() {
    this.termenii = true;
  }

  showCookies() {
    this.cookies = true;
  }

  showContact() {
    this.contact = true;
  }

  constructor(private router: Router) {

  }

  goToAboutUs() {
    this.router.navigateByUrl("/about-us");
  }

  goToInfoPage() {
    this.router.navigateByUrl("/info-page");
  }

  goToVillageOfTheMonth() {
    this.router.navigateByUrl("/village-of-the-month");
  }

  goToLandingPage() {
    this.router.navigateByUrl("/landing-page");
  }

  goToHomeFormPage() {
    this.router.navigateByUrl("/homes");
  }

  goToTerrainFormPage() {
    this.router.navigateByUrl("/terrain-form-page");
  }

  goToContactUsPage() {
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
        command: () => this.goToVillageOfTheMonth()
      },
      {
        label: 'Haide să vezi zona!',
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
        icon: 'pi pi-fw pi-cloud',
        command: () => this.goToTerrainFormPage()
      }
      // {
      //   label: 'Contactează-ne!',
      //   icon: 'pi pi-fw pi-phone',
      //   command: () => this.goToContactUsPage()
      // }
    ];

    // gsap.to(document.body, {
    //   backgroundImage: 'url("/assets/oras.jpg")',
    //   duration: 0.5,
    //   ease: 'power2.inOut'
    // });
  }

  goToTikTokPage() {

  }

  goToFacebookPage() {

  }

  goToInstagramPage() {

  }
}
