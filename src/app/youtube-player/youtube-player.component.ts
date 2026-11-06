import {Component, inject, Input, OnChanges} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {ConsentService} from '../cookie-consent/consent.service';

/**
 * Videoul YouTube ca simplu iframe youtube-nocookie, încărcat leneș.
 *
 * Înainte, index.html încărca sincron API-ul IFrame pe toate paginile, iar playerul ieșea fără să mai încerce
 * dacă API-ul nu era încă gata: la una din două încărcări, pe /satul-lunii nu apărea niciun video.
 * Iframe-ul nu depinde de niciun script și se încarcă abia când ajunge aproape de ecran.
 *
 * Și varianta „nocookie” salvează date în browser imediat ce iframe-ul se încarcă, fără Play, deci iframe-ul apare
 * doar cu acord pentru „Videoclipuri YouTube”. Până atunci, în locul lui stă o casetă de aceeași mărime, cu mesajul și
 * butonul de acord; pe server și la hidratare se afișează mereu caseta (alegerea se citește abia în browser).
 */
@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss'],
  standalone: true
})
export class YoutubePlayerComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  readonly consent = inject(ConsentService);

  @Input() videoId: string = 'CKiPdxYl0MA';
  @Input() height: string = '60%';
  @Input() width: string = '100%';
  @Input() title: string = 'Video Hai în Sat pe YouTube';

  src: SafeResourceUrl | null = this.embedUrl(this.videoId);
  watchUrl: string | null = this.youtubeUrl(this.videoId);

  ngOnChanges(): void {
    this.src = this.embedUrl(this.videoId);
    this.watchUrl = this.youtubeUrl(this.videoId);
  }

  /**
   * Mărimea casetei, din aceleași valori ca atributele iframe-ului (un număr înseamnă pixeli). Intră prin variabile
   * CSS, nu ca stil direct pe element, ca regulile paginilor pentru `.youtube-frame` să o poată schimba la fel ca
   * pe iframe (de exemplu proporția 16:9 de pe telefon).
   */
  cssSize(value: string): string {
    return /^\d+$/.test(value ?? '') ? `${value}px` : value;
  }

  private embedUrl(videoId: string): SafeResourceUrl | null {
    return this.validId(videoId)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${videoId}`)
      : null;
  }

  private youtubeUrl(videoId: string): string | null {
    return this.validId(videoId) ? `https://www.youtube.com/watch?v=${videoId}` : null;
  }

  // Id-urile YouTube au doar litere, cifre, „-” și „_”; orice altceva nu ajunge în adresa iframe-ului.
  private validId(videoId: string): boolean {
    return /^[\w-]{6,20}$/.test(videoId ?? '');
  }
}
