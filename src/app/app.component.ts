import {Component, OnInit} from '@angular/core';
import {MenuItem, MessageService} from "primeng/api";
import {Router, RouterOutlet} from "@angular/router";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faSquareFacebook } from "@fortawesome/free-brands-svg-icons";
import {DataService} from "./service/data-service";
import {Dialog} from "primeng/dialog";
import {Chip} from "primeng/chip";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {Menubar} from "primeng/menubar";
import {Toast} from "primeng/toast";

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    Dialog,
    Chip,
    FaIconComponent,
    RouterOutlet,
    Menubar,
    Toast
  ],
  providers: [MessageService]
})
export class AppComponent implements OnInit {
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

  constructor(private router: Router, private service: DataService) {

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
    // this.service.reload$.next(true);
    this.router.navigateByUrl("/landing-page").then(() => {
      window.location.reload();
    });
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

  private goToProperties() {
    this.router.navigateByUrl("/properties");
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
        label: 'Oltenia de sub Munte',
        icon: 'pi pi-fw pi-sun',
        command: () => this.goToUnderTheMountain()
      },
      {
        label: 'Satul lunii',
        icon: 'pi pi-fw pi-home',
        command: () => this.goToVillageOfTheMonth()
      },
      {
        label: 'Proprietăți',
        icon: 'pi pi-fw pi-eye',
        command: () => this.goToProperties()
      },
      {
        label: 'Vreau o casă',
        icon: 'pi pi-fw pi-home',
        command: () => this.goToHomeFormPage()
      },
      {
        label: 'Vreau un teren',
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

  openLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
