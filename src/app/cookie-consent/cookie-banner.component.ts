import { afterNextRender, Component, effect, inject, output, signal, untracked, ViewEncapsulation } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { ConsentChoice, ConsentService } from './consent.service';

type CategoryKey = keyof ConsentChoice;

/**
 * Bannerul de cookies (bara de jos la prima vizită) și fereastra „Setări cookie-uri”.
 * „Accept toate” și „Refuz toate” au același aspect, cum cer ANSPDCP și EDPB; categoriile pornesc oprite.
 * Fereastra e atașată la body, deci stilurile sunt globale, toate cu prefixul `cc-`.
 */
@Component({
  selector: 'app-cookie-banner',
  imports: [Dialog],
  templateUrl: './cookie-banner.component.html',
  styleUrl: './cookie-banner.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CookieBannerComponent {
  readonly consent = inject(ConsentService);
  /** „Politica de cookies” e fereastra din AppComponent. */
  readonly openPolicy = output<void>();

  readonly categories: ReadonlyArray<{ key: CategoryKey; name: string; who: string; text: string }> = [
    {
      key: 'statistici',
      name: 'Statistici',
      who: 'Google Analytics',
      text: 'Ne arată câți oameni vizitează site-ul și ce pagini citesc, ca să-l facem mai bun. Datele ajung la Google, inclusiv în SUA.',
    },
    {
      key: 'marketing',
      name: 'Marketing',
      who: 'Google Ads, Meta (Facebook, Instagram), TikTok',
      text: 'Ne arată dacă reclamele noastre aduc oameni pe site. Datele ajung la Google, Meta și TikTok, inclusiv în afara UE.',
    },
    {
      key: 'video',
      name: 'Videoclipuri YouTube',
      who: 'YouTube (Google)',
      text: 'Încarcă videoclipurile direct în pagină. YouTube salvează date în browserul tău și află ce videoclipuri vezi.',
    },
  ];

  /** Comutatoarele din fereastră; pornesc de la alegerea salvată (sau oprite) de fiecare dată când se deschide. */
  readonly draft = signal<ConsentChoice>({ statistici: false, marketing: false, video: false });
  /** Pe telefon fereastra urcă de jos, pe toată lățimea. */
  readonly onPhone = signal(false);

  constructor() {
    effect(() => {
      if (this.consent.settingsOpen()) {
        this.draft.set(untracked(() => this.consent.choice()));
      }
    });
    afterNextRender(() => {
      const query = window.matchMedia?.('(max-width: 767px)');
      if (query) {
        this.onPhone.set(query.matches);
        query.addEventListener?.('change', (e) => this.onPhone.set(e.matches));
      }
    });
  }

  toggle(key: CategoryKey): void {
    this.draft.update((d) => ({ ...d, [key]: !d[key] }));
  }

  closeSettings(visible: boolean): void {
    if (!visible) {
      this.consent.settingsOpen.set(false);
    }
  }
}
