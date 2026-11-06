import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CONSENT_COOKIE, ConsentService, GTM_ID } from './consent.service';

type TestWindow = Window & { dataLayer?: unknown[]; gtag?: unknown };

function clearCookies(): void {
  for (const name of document.cookie.split('; ').map((c) => c.split('=')[0]).filter(Boolean)) {
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

function savedCookie(): Record<string, unknown> | null {
  const raw = document.cookie.split('; ').find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  return raw ? JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) : null;
}

/** Comenzile gtag din dataLayer (obiecte `arguments`), ca liste. */
function gtagCommands(): unknown[][] {
  return ((window as TestWindow).dataLayer ?? [])
    .filter((e) => e && typeof e === 'object' && 'length' in (e as object) && !Array.isArray(e))
    .map((e) => Array.from(e as ArrayLike<unknown>));
}

describe('ConsentService', () => {
  let service: ConsentService;
  let appendScript: jasmine.Spy;
  let reloadPage: jasmine.Spy;

  function create(platform: 'browser' | 'server' = 'browser'): void {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: platform }] });
    service = TestBed.inject(ConsentService);
    // GTM nu se încarcă din teste și pagina nu se reîncarcă.
    appendScript = spyOn<any>(service, 'appendScript');
    reloadPage = spyOn<any>(service, 'reloadPage');
  }

  beforeEach(() => {
    clearCookies();
    delete (window as TestWindow).dataLayer;
    delete (window as TestWindow).gtag;
  });

  afterEach(() => {
    clearCookies();
    delete (window as TestWindow).dataLayer;
    delete (window as TestWindow).gtag;
  });

  it('shows the banner when nothing was chosen and loads nothing before consent', () => {
    create();
    expect(service.bannerVisible()).toBeFalse(); // înainte de init (server, hidratare) nu apare nimic
    service.init();

    expect(service.bannerVisible()).toBeTrue();
    expect(service.video()).toBeFalse();
    expect(appendScript).not.toHaveBeenCalled();
    expect(savedCookie()).toBeNull();
  });

  it('saves "Accept toate" and starts GTM with Consent Mode v2 set before it', () => {
    create();
    service.init();
    service.acceptAll();

    expect(savedCookie()).toEqual(jasmine.objectContaining({ v: 1, banner: true, statistici: true, marketing: true, video: true }));
    expect(String(savedCookie()!['data'])).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(service.bannerVisible()).toBeFalse();
    expect(appendScript).toHaveBeenCalledOnceWith(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);

    const commands = gtagCommands();
    const def = commands.findIndex((c) => c[0] === 'consent' && c[1] === 'default');
    const update = commands.find((c) => c[0] === 'consent' && c[1] === 'update');
    expect(commands[def][2]).toEqual(jasmine.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' }));
    expect(update?.[2]).toEqual(jasmine.objectContaining({
      analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied',
    }));
    const layer = (window as TestWindow).dataLayer!;
    const gtmStart = layer.findIndex((e) => (e as { event?: string }).event === 'gtm.js');
    expect(gtmStart).toBeGreaterThan(layer.findIndex((e) => Array.from(e as ArrayLike<unknown>)[1] === 'default'));
  });

  it('saves "Refuz toate" and loads no tracker', () => {
    create();
    service.init();
    service.refuseAll();

    expect(savedCookie()).toEqual(jasmine.objectContaining({ v: 1, banner: true, statistici: false, marketing: false, video: false }));
    expect(service.bannerVisible()).toBeFalse();
    expect(appendScript).not.toHaveBeenCalled();
  });

  it('reads a saved choice after hydration and starts GTM only with the categories accepted', () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ v: 1, data: '2026-11-06T10:00:00.000Z', banner: true, statistici: true, marketing: false, video: false }))}; Path=/`;
    create();
    service.init();

    expect(service.bannerVisible()).toBeFalse();
    expect(service.statistici()).toBeTrue();
    expect(service.video()).toBeFalse();
    expect(appendScript).toHaveBeenCalledTimes(1);
    expect(gtagCommands().find((c) => c[1] === 'update')?.[2]).toEqual(jasmine.objectContaining({
      analytics_storage: 'granted', ad_storage: 'denied',
    }));
  });

  it('asks again when the saved choice belongs to an older version of the banner', () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ v: 0, banner: true, statistici: true, marketing: true, video: true }))}; Path=/`;
    create();
    service.init();

    expect(service.bannerVisible()).toBeTrue();
    expect(service.statistici()).toBeFalse();
    expect(appendScript).not.toHaveBeenCalled();
  });

  it('accepts only the videos from the player box and keeps the banner for the other categories', () => {
    create();
    service.acceptVideo(); // un clic reluat după hidratare, înainte de init

    expect(service.video()).toBeTrue();
    expect(service.statistici()).toBeFalse();
    expect(service.bannerVisible()).toBeTrue();
    expect(savedCookie()).toEqual(jasmine.objectContaining({ banner: false, video: true }));
    expect(appendScript).not.toHaveBeenCalled();
  });

  it('keeps an earlier choice when the videos are accepted later', () => {
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify({ v: 1, banner: true, statistici: true, marketing: false, video: false }))}; Path=/`;
    create();
    service.init();
    service.acceptVideo();

    expect(savedCookie()).toEqual(jasmine.objectContaining({ banner: true, statistici: true, marketing: false, video: true }));
    expect(service.bannerVisible()).toBeFalse();
  });

  it('deletes the Google Analytics cookies and reloads without GTM when statistics are withdrawn', () => {
    create();
    service.init();
    service.acceptAll();
    document.cookie = '_ga=GA1.1.123.456; Path=/';
    document.cookie = '_ga_TEST123=GS1.1.789; Path=/';
    document.cookie = '_fbp=fb.1.123; Path=/';

    service.saveChoice({ statistici: false, marketing: true, video: true });

    expect(document.cookie).not.toContain('_ga');
    expect(document.cookie).toContain('_fbp'); // marketing a rămas acceptat
    expect(reloadPage).toHaveBeenCalledTimes(1);
    expect(gtagCommands().filter((c) => c[1] === 'update').pop()?.[2]).toEqual(jasmine.objectContaining({ analytics_storage: 'denied' }));
    expect(service.statistici()).toBeFalse();
  });

  it('deletes the Google Ads, Meta and TikTok cookies when marketing is withdrawn, keeping statistics', () => {
    create();
    service.init();
    service.acceptAll();
    for (const c of ['_ga=GA1.1.1.2', '_gcl_au=1.1.3', '_fbp=fb.1.4', '_ttp=abc', 'ttcsid_C123=1.2', '_tt_enable_cookie=1']) {
      document.cookie = `${c}; Path=/`;
    }

    service.saveChoice({ statistici: true, marketing: false, video: true });

    const names = document.cookie.split('; ').map((c) => c.split('=')[0]);
    expect(names).toContain('_ga');
    for (const gone of ['_gcl_au', '_fbp', '_ttp', 'ttcsid_C123', '_tt_enable_cookie']) {
      expect(names).not.toContain(gone);
    }
    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('turns the videos off without reloading the page', () => {
    create();
    service.init();
    service.acceptVideo();
    service.saveChoice({ statistici: false, marketing: false, video: false });

    expect(service.video()).toBeFalse();
    expect(reloadPage).not.toHaveBeenCalled();
  });

  it('does nothing on the server, so the SSR HTML is the same for every visitor', () => {
    create('server');
    service.init();
    service.acceptAll();

    expect(service.bannerVisible()).toBeFalse();
    expect(service.video()).toBeFalse();
    expect(savedCookie()).toBeNull();
    expect(appendScript).not.toHaveBeenCalled();
  });
});
