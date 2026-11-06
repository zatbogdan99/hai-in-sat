import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CookieBannerComponent } from './cookie-banner.component';
import { CONSENT_COOKIE, ConsentService } from './consent.service';

function clearConsentCookie(): void {
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/`;
}

describe('CookieBannerComponent', () => {
  let fixture: ComponentFixture<CookieBannerComponent>;
  let consent: ConsentService;

  const bar = () => (fixture.nativeElement as HTMLElement).querySelector('.cc-bar');
  const button = (root: ParentNode, text: string) =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => {
    clearConsentCookie();
    // Ferestrele PrimeNG sunt atașate la body; una rămasă de la alt test (ordinea e aleatoare) ar fi găsită prima.
    document.querySelectorAll('.p-dialog-mask').forEach((mask) => mask.remove());
    TestBed.configureTestingModule({
      imports: [CookieBannerComponent],
      providers: [provideNoopAnimations()]
    });
    consent = TestBed.inject(ConsentService);
    spyOn<any>(consent, 'appendScript');
    spyOn<any>(consent, 'reloadPage');
    fixture = TestBed.createComponent(CookieBannerComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    clearConsentCookie();
    document.querySelectorAll('.cc-dialog').forEach((d) => d.closest('.p-dialog-mask')?.remove());
  });

  it('appears only after the saved choice is read in the browser', () => {
    expect(bar()).toBeNull();
    consent.init();
    fixture.detectChanges();

    expect(bar()).not.toBeNull();
    expect(bar()!.textContent).toContain('Cookie-uri pe Hai în sat');
  });

  it('gives "Accept toate" and "Refuz toate" the same look and hides after a choice', () => {
    consent.init();
    fixture.detectChanges();
    const accept = button(bar()!, 'Accept toate');
    const refuse = button(bar()!, 'Refuz toate');

    expect(accept.className).toBe(refuse.className);
    expect(button(bar()!, 'Aleg eu')).toBeTruthy();

    refuse.click();
    fixture.detectChanges();

    expect(bar()).toBeNull();
    expect(consent.bannerVisible()).toBeFalse();
    expect(consent.statistici()).toBeFalse();
  });

  it('opens "Setări cookie-uri" with every category off and saves only what was switched on', async () => {
    consent.init();
    fixture.detectChanges();
    button(bar()!, 'Aleg eu').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialogs = document.querySelectorAll<HTMLElement>('.p-dialog.cc-dialog');
    const dialog = dialogs[dialogs.length - 1];
    const switches = Array.from(dialog.querySelectorAll<HTMLButtonElement>('[role="switch"]'));
    expect(switches.map((s) => s.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false']);
    expect(dialog.textContent).toContain('Mereu active');

    switches[0].click(); // Statistici
    fixture.detectChanges();
    expect(switches[0].getAttribute('aria-checked')).toBe('true');

    button(dialog, 'Salvează alegerea').click();
    fixture.detectChanges();

    expect(consent.statistici()).toBeTrue();
    expect(consent.marketing()).toBeFalse();
    expect(consent.video()).toBeFalse();
    expect(consent.settingsOpen()).toBeFalse();
  });

  it('asks the app to open the cookie policy', () => {
    consent.init();
    fixture.detectChanges();
    let opened = 0;
    fixture.componentInstance.openPolicy.subscribe(() => opened++);

    button(bar()!, 'Politica de cookies').click();

    expect(opened).toBe(1);
  });
});
