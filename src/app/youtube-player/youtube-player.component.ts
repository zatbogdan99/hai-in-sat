import {Component, inject, Input, OnChanges} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

/**
 * Videoul YouTube ca simplu iframe youtube-nocookie, încărcat leneș.
 *
 * Înainte, index.html încărca sincron API-ul IFrame pe toate paginile, iar playerul ieșea fără să mai încerce
 * dacă API-ul nu era încă gata: la una din două încărcări, pe /village-of-the-month nu apărea niciun video.
 * Iframe-ul nu depinde de niciun script și se încarcă abia când ajunge aproape de ecran.
 */
@Component({
  selector: 'app-youtube-player',
  templateUrl: './youtube-player.component.html',
  styleUrls: ['./youtube-player.component.scss'],
  standalone: true
})
export class YoutubePlayerComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() videoId: string = 'CKiPdxYl0MA';
  @Input() height: string = '60%';
  @Input() width: string = '100%';
  @Input() title: string = 'Video Hai în Sat pe YouTube';

  src: SafeResourceUrl | null = this.embedUrl(this.videoId);

  ngOnChanges(): void {
    this.src = this.embedUrl(this.videoId);
  }

  private embedUrl(videoId: string): SafeResourceUrl | null {
    // Id-urile YouTube au doar litere, cifre, „-” și „_”; orice altceva nu ajunge în adresa iframe-ului.
    if (!/^[\w-]{6,20}$/.test(videoId ?? '')) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${videoId}`);
  }
}
