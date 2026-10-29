import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { InfoPageComponent } from './info-page.component';
import { PhotoService } from '../service/photo-service';

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
