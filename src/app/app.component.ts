import {Component, DestroyRef, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {RouterLink, RouterLinkActive, RouterOutlet} from "@angular/router";
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faSquareFacebook } from "@fortawesome/free-brands-svg-icons";
import {DataService} from "./service/data-service";
import {Dialog} from "primeng/dialog";
import {Chip} from "primeng/chip";
import {Popover} from "primeng/popover";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {Toast} from "primeng/toast";
import { SeoService } from './service/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [
    Dialog,
    Chip,
    Popover,
    FaIconComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Toast
  ],
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'hai-in-sat';
  faTiktok = faTiktok;
  faFacebook = faFacebook;
  faInstagram = faInstagram;
  faSquareFacebook = faSquareFacebook;

  /** Adresele rețelelor și ale emailului, folosite în antet, subsol și fereastra Contact. */
  readonly links = {
    facebook: 'https://www.facebook.com/profile.php?id=61560478122728',
    instagram: 'https://www.instagram.com/hai.in.sat',
    tiktok: 'https://www.tiktok.com/@hai.in.sat',
    // Forma ASCII a domeniului: unele programe de email nu acceptă diacritice în adresă.
    mailto: 'mailto:contact@xn--hai-n-sat-t5a.ro',
  };

  contact: boolean = false;
  cookies: boolean = false;
  termenii: boolean = false;
  politica: boolean = false;
  menuOpen = false;

  @ViewChild('menuButton') private menuButton?: ElementRef<HTMLButtonElement>;

  private destroyRef = inject(DestroyRef);
  private elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

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

  constructor(private service: DataService, private seo: SeoService) {}

  resetPageIndexing(): void {
    // RouterOutlet emite activate înainte de ngOnInit al paginii noi.
    // Login, admin și 404 aplică apoi noindex; restul paginilor pornesc indexabile.
    this.seo.setIndexable();
  }

  /** Meniul de telefon: focusul intră pe primul link când se deschide. */
  onMenuShow(): void {
    this.menuOpen = true;
    setTimeout(() => this.menuLinks()[0]?.focus());
  }

  /** La închidere (Escape, clic în afară sau alegerea unei pagini) focusul revine pe butonul de meniu. */
  onMenuHide(): void {
    this.menuOpen = false;
    this.menuButton?.nativeElement.focus();
  }

  /**
   * Ține focusul în meniu: Tab și Shift+Tab trec de la un link la altul, în cerc. Mutarea se face aici, nu de
   * browser, pentru că Safari sare implicit peste linkuri la Tab și focusul ieșea din meniu.
   */
  trapMenuFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    const links = this.menuLinks();
    if (!links.length) {
      return;
    }
    event.preventDefault();
    const current = links.indexOf(document.activeElement as HTMLElement);
    const next = current < 0
      ? (event.shiftKey ? links.length - 1 : 0)
      : (current + (event.shiftKey ? -1 : 1) + links.length) % links.length;
    links[next].focus();
  }

  private menuLinks(): HTMLElement[] {
    // Popover-ul se atașează la body, deci linkurile se caută în document, nu în componentă.
    const root: Document = this.elementRef.nativeElement.ownerDocument;
    return Array.from(root.querySelectorAll<HTMLElement>('#meniu-mobil a'));
  }

  ngOnInit() {
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
}
