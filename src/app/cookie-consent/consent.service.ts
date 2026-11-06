import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/** Categoriile din banner. Cele necesare nu apar aici: sunt mereu active. */
export interface ConsentChoice {
  statistici: boolean;
  marketing: boolean;
  video: boolean;
}

/** Ce rămâne în cookie: alegerea, versiunea textului și data, ca dovadă a acordului. */
export interface StoredConsent extends ConsentChoice {
  v: number;
  data: string;
  /** false când vizitatorul a acceptat doar videoclipurile, din caseta playerului; bannerul rămâne atunci afișat. */
  banner: boolean;
}

export const CONSENT_COOKIE = 'hai_consimtamant';
/** Se mărește când se schimbă categoriile sau ce se folosește în ele: toți vizitatorii sunt întrebați din nou. */
export const CONSENT_VERSION = 1;
/** Alegerea se păstrează 12 luni; după aceea bannerul apare din nou. */
export const CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const GTM_ID = 'GTM-N3527C3S';

const NONE: ConsentChoice = { statistici: false, marketing: false, video: false };
const ALL: ConsentChoice = { statistici: true, marketing: true, video: true };

/** Cookie-urile puse de etichetele din GTM, șterse când vizitatorul își retrage acordul pentru categoria lor. */
const TRACKER_COOKIES: Record<'statistici' | 'marketing', RegExp> = {
  statistici: /^(_ga|_gid|_gat)/,
  // Google Ads, Meta Pixel și TikTok Pixel (_ttp, ttcsid, ttcsid_<pixel>, _tt_enable_cookie, ttclid).
  marketing: /^(_gcl_|_fbp$|_fbc$|_ttp$|_tt_enable_cookie$|ttcsid|ttclid$)/,
};

type ConsentWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

/**
 * Consimțământul pentru cookie-uri (Legea 506/2004, art. 4 alin. 5).
 *
 * Până la acord nu se încarcă nimic opțional: Google Tag Manager pornește abia după „Statistici” sau „Marketing”,
 * iar videoclipurile YouTube abia după „Videoclipuri YouTube”. Pe server și în timpul hidratării alegerea e
 * necunoscută (undefined), deci HTML-ul nu depinde de cookie: bannerul lipsește și videoclipurile au caseta cu
 * mesajul. După hidratare, AppComponent cheamă init(), care citește cookie-ul.
 */
@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** undefined = încă necitit (server, hidratare); null = vizitatorul n-a ales nimic. */
  private readonly stored = signal<StoredConsent | null | undefined>(undefined);
  private gtmLoaded = false;

  /** Fereastra „Setări cookie-uri” (din „Aleg eu” sau din subsol). */
  readonly settingsOpen = signal(false);

  readonly bannerVisible = computed(() => {
    const s = this.stored();
    return s === null || (s !== undefined && !s.banner);
  });
  readonly statistici = computed(() => this.stored()?.statistici === true);
  readonly marketing = computed(() => this.stored()?.marketing === true);
  readonly video = computed(() => this.stored()?.video === true);
  /** Alegerea curentă, cu tot oprit dacă nu există una; de aici pornesc comutatoarele din fereastră. */
  readonly choice = computed<ConsentChoice>(() => {
    const s = this.stored();
    return s ? { statistici: s.statistici, marketing: s.marketing, video: s.video } : { ...NONE };
  });

  /** Citește alegerea salvată; doar în browser, o singură dată, după hidratare. */
  init(): void {
    if (!this.isBrowser || this.stored() !== undefined) {
      return;
    }
    const saved = this.read();
    this.stored.set(saved);
    if (saved) {
      this.applyTrackers(saved);
    }
  }

  acceptAll(): void {
    this.save(ALL, true);
  }

  refuseAll(): void {
    this.save(NONE, true);
  }

  saveChoice(choice: ConsentChoice): void {
    this.save(choice, true);
  }

  /** Butonul din caseta videoclipului: acord doar pentru YouTube; celelalte categorii rămân cum erau. */
  acceptVideo(): void {
    // Un clic dinaintea hidratării e reluat poate înaintea lui init(): alegerea veche se citește întâi, ca să nu se piardă.
    this.init();
    const s = this.stored();
    this.save({ statistici: s?.statistici ?? false, marketing: s?.marketing ?? false, video: true }, s?.banner ?? false);
  }

  openSettings(): void {
    this.init();
    this.settingsOpen.set(true);
  }

  private save(choice: ConsentChoice, fromBanner: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    this.init();
    const before = this.stored();
    const next: StoredConsent = { v: CONSENT_VERSION, data: new Date().toISOString(), banner: fromBanner, ...choice };
    this.write(next);
    this.stored.set(next);
    this.settingsOpen.set(false);

    const withdrawn = (['statistici', 'marketing'] as const).filter((k) => before?.[k] && !next[k]);
    if (withdrawn.length) {
      this.gtag('consent', 'update', this.consentMode(next));
      this.deleteCookies(withdrawn.map((k) => TRACKER_COOKIES[k]));
      if (this.gtmLoaded) {
        // Etichetele deja pornite nu se pot opri din pagină: pagina se reîncarcă fără GTM.
        this.reloadPage();
        return;
      }
    }
    this.applyTrackers(next);
  }

  /** GTM pornește doar cu acord pentru statistici sau marketing, cu Consent Mode v2 setat înaintea lui. */
  private applyTrackers(s: ConsentChoice): void {
    if (!s.statistici && !s.marketing) {
      return;
    }
    const w = this.window();
    if (!w) {
      return;
    }
    if (!this.gtmLoaded) {
      w.dataLayer = w.dataLayer || [];
      // gtag pune `arguments` în dataLayer: GTM citește comenzile de consimțământ doar în forma asta, nu ca listă.
      w.gtag = w.gtag || function gtag() { w.dataLayer!.push(arguments); };
      this.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'denied',
        personalization_storage: 'denied',
        security_storage: 'granted',
      });
      this.gtag('set', 'ads_data_redaction', true);
      this.gtag('consent', 'update', this.consentMode(s));
      w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      this.appendScript(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
      this.gtmLoaded = true;
    } else {
      this.gtag('consent', 'update', this.consentMode(s));
    }
    // Pentru declanșatorii din GTM care vor să știe alegerea (de exemplu Meta Pixel, care nu citește Consent Mode).
    w.dataLayer!.push({ event: 'hai_consimtamant', statistici: s.statistici, marketing: s.marketing });
  }

  private consentMode(s: ConsentChoice): Record<string, 'granted' | 'denied'> {
    const marketing = s.marketing ? 'granted' : 'denied';
    return {
      analytics_storage: s.statistici ? 'granted' : 'denied',
      ad_storage: marketing,
      ad_user_data: marketing,
      // Remarketing (reclame pentru cei care au vizitat site-ul) nu e în textul categoriei Marketing. Dacă se adaugă,
      // textul din banner și politica de cookies trebuie să-l spună, CONSENT_VERSION crește, iar aici devine `marketing`.
      ad_personalization: 'denied',
    };
  }

  private gtag(...args: unknown[]): void {
    this.window()?.gtag?.(...args);
  }

  private read(): StoredConsent | null {
    const prefix = `${CONSENT_COOKIE}=`;
    const raw = this.document.cookie.split('; ').find((c) => c.startsWith(prefix))?.slice(prefix.length);
    if (!raw) {
      return null;
    }
    try {
      const p = JSON.parse(decodeURIComponent(raw));
      if (p?.v !== CONSENT_VERSION) {
        return null;
      }
      return {
        v: CONSENT_VERSION,
        data: String(p.data ?? ''),
        banner: p.banner !== false,
        statistici: p.statistici === true,
        marketing: p.marketing === true,
        video: p.video === true,
      };
    } catch {
      return null;
    }
  }

  private write(s: StoredConsent): void {
    const secure = this.document.location?.protocol === 'https:' ? '; Secure' : '';
    this.document.cookie =
      `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(s))}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  }

  /** Google Analytics pune cookie-urile pe domeniul principal; se șterg și cu domeniu, și fără. */
  private deleteCookies(patterns: RegExp[]): void {
    const host = this.document.location?.hostname ?? '';
    const names = this.document.cookie.split('; ').map((c) => c.split('=')[0]).filter((n) => patterns.some((p) => p.test(n)));
    for (const name of names) {
      for (const domain of ['', `; Domain=${host}`, `; Domain=.${host}`]) {
        this.document.cookie = `${name}=; Max-Age=0; Path=/${domain}`;
      }
    }
  }

  private window(): ConsentWindow | null {
    return this.document.defaultView as ConsentWindow | null;
  }

  /** Separate, ca testele să nu încarce GTM și să nu reîncarce pagina. */
  protected appendScript(src: string): void {
    const script = this.document.createElement('script');
    script.async = true;
    script.src = src;
    this.document.head.appendChild(script);
  }

  protected reloadPage(): void {
    this.document.defaultView?.location.reload();
  }
}
