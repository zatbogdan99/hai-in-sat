import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ViewportScroller } from '@angular/common';
import {MenuItem} from "primeng/api";
import {Router, RouterOutlet, NavigationEnd} from "@angular/router";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faSquareFacebook } from "@fortawesome/free-brands-svg-icons";
import {DataService} from "./service/data-service";
import {Dialog} from "primeng/dialog";
import {Chip} from "primeng/chip";
import {Button} from "primeng/button";
import {Popover} from "primeng/popover";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {Toast} from "primeng/toast";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    Dialog,
    Chip,
    Button,
    Popover,
    FaIconComponent,
    RouterOutlet,
    Toast
  ],
  styleUrls: ['./app.component.scss']
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

  private destroyRef = inject(DestroyRef);


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

  constructor(private router: Router, private service: DataService, private viewportScroller: ViewportScroller) {
    // Forțează resetarea poziției de scroll la top la fiecare navigare (inclusiv pe aceeași rută)
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.viewportScroller.scrollToPosition([0, 0]);
      });
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

  goToUnderTheMountain() {
    this.router.navigateByUrl("/under-the-mountain");
  }

  private goToSeeTheArea() {
    this.router.navigateByUrl("/see-the-area");
  }

  goToProperties() {
    this.router.navigateByUrl("/properties");
  }

  private goToAddProperty() {
    this.router.navigateByUrl("/add-property");
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
        label: 'Sate în Oltenia de sub Munte',
        icon: 'pi pi-fw pi-home',
        command: () => this.goToVillageOfTheMonth()
      },
      {
        label: 'Proprietăți',
        icon: 'pi pi-fw pi-eye',
        command: () => this.goToProperties()
      },
      {
        label: 'Găsește-mi locul',
        icon: 'pi pi-fw pi-home',
        command: () => this.goToHomeFormPage()
      },
      // {
      //   label: "Adaugare",
      //   command: () => this.goToAddProperty()
      // }
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

    // Abonare la semnalele globale pentru deschiderea pop-up-urilor
    this.service.openTerms$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((open) => {
        if (open) {
          this.termenii = true;
          // resetăm semnalul pentru a evita reaprinderea nedorită
          this.service.openTerms$.next(false);
        }
      });

    this.service.openPrivacy$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((open) => {
        if (open) {
          this.politica = true;
          // resetăm semnalul pentru a evita reaprinderea nedorită
          this.service.openPrivacy$.next(false);
        }
      });
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
