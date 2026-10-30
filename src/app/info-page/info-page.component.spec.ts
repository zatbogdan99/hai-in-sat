import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { InfoPageComponent } from './info-page.component';
import { PhotoService } from '../service/photo-service';
import { ImageLoadTracker } from '../utils/image-load-tracker';

describe('InfoPageComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PhotoService,
        provideNoopAnimations(),
        provideRouter([{ path: 'sate/:slug', component: InfoPageComponent }])
      ]
    });
  });

  it('shows the village from the address, with its own title, canonical and breadcrumbs', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/sate/polovragi', InfoPageComponent);

    expect(page.villageId).toBe(2);
    expect(page.villageNotFound).toBeFalse();
    expect(TestBed.inject(Title).getTitle()).toBe('Polovragi – sat în Oltenia de sub Munte | Hai în Sat');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toContain('/sate/polovragi');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('index, follow');
  });

  it('has a single h1 with the village name, shared by the phone and desktop layouts', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sate/horezu', InfoPageComponent);

    const headings = Array.from(harness.routeNativeElement!.querySelectorAll('h1')).map(h => h.textContent?.trim());
    expect(headings).toEqual(['Horezu']);
    expect(harness.routeNativeElement!.querySelector('h2.horezu-title')?.textContent).toContain('Ceramica Horezu');
  });

  it('reserves the second photo space with its real size and shows a skeleton until it loads', async () => {
    // Fără citirea stării din DOM: în Karma pozele dau 404 și pot fi deja „complete” din cache.
    spyOn(ImageLoadTracker.prototype, 'syncFrom');
    // Doar evenimentele trimise de test contează (cele reale, 404 în Karma, pot sosi oricând).
    const markLoaded = ImageLoadTracker.prototype.markLoaded;
    let fromTest = false;
    spyOn(ImageLoadTracker.prototype, 'markLoaded').and.callFake(function (this: ImageLoadTracker, src) {
      if (fromTest) {
        markLoaded.call(this, src);
      }
    });
    const send = (img: HTMLImageElement, type: 'load' | 'error') => { fromTest = true; img.dispatchEvent(new Event(type)); fromTest = false; };
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sate/horezu', InfoPageComponent);
    harness.detectChanges();

    const photo = harness.routeNativeElement!.querySelector('.horezu-image') as HTMLImageElement;
    expect(photo.getAttribute('width')).toBe('6000');
    expect(photo.getAttribute('height')).toBe('4000');
    expect(photo.classList.contains('skeleton')).toBeTrue();
    send(photo, 'load');
    harness.detectChanges();
    expect(photo.classList.contains('skeleton')).toBeFalse();

    const gallery = harness.routeNativeElement!.querySelector('.large-screen .gallery-image') as HTMLImageElement;
    expect(gallery.classList.contains('skeleton')).toBeTrue();
    send(gallery, 'error');
    harness.detectChanges();
    expect(gallery.classList.contains('skeleton')).toBeFalse();
  });

  it('renders the 404 page for an unknown village', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/sate/necunoscut', InfoPageComponent);

    expect(page.villageNotFound).toBeTrue();
    expect(harness.routeNativeElement!.querySelector('app-not-found')).toBeTruthy();
    expect(harness.routeNativeElement!.querySelector('.info-page-bg')).toBeNull();
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });

  it('opens the fullscreen gallery from a button, changes photos with the arrows and closes with Escape', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/sate/horezu', InfoPageComponent);
    // Pozele vin din promisiuni deja rezolvate (PhotoService); whenStable() ar aștepta și ceasul GSAP.
    await new Promise(resolve => setTimeout(resolve));
    harness.detectChanges();

    const opener = harness.routeNativeElement!.querySelector('.large-screen button.gallery-open') as HTMLButtonElement;
    expect(opener).toBeTruthy();
    opener.focus();
    opener.click();
    harness.detectChanges();
    expect(page.displayFullScreen).toBeTrue();

    const shown = () => document.querySelector('.p-galleria-mask .p-galleria-item img')?.getAttribute('src');
    const first = shown();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    harness.detectChanges();
    expect(page.fullScreenIndex).toBe(1);
    expect(shown()).not.toBe(first);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    harness.detectChanges();
    expect(page.fullScreenIndex).toBe(0);
    expect(shown()).toBe(first);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(page.displayFullScreen).toBeFalse();
    await new Promise(resolve => setTimeout(resolve));
    expect(document.activeElement).toBe(opener);
  });

  it('shows the next photo when the page gallery arrow is pressed', async () => {
    // PrimeNG 20.4 nu reface poza afișată când șablonul e dat cu pTemplate="item" (slotul nu are type); cu #item merge.
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/sate/horezu', InfoPageComponent);
    // Pozele vin din promisiuni deja rezolvate (PhotoService); whenStable() ar aștepta și ceasul GSAP.
    await new Promise(resolve => setTimeout(resolve));
    harness.detectChanges();
    const root = harness.routeNativeElement!;
    const shown = () => root.querySelector('.large-screen .p-galleria-item img')?.getAttribute('src');
    const first = shown();

    (root.querySelector('.large-screen .p-galleria-next-button') as HTMLButtonElement).click();
    harness.detectChanges();

    expect(first).toBeTruthy();
    expect(shown()).not.toBe(first);
  });
});
