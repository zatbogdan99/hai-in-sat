import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';
import { By, Meta, Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { LoginComponent } from './login/login.component';
import { NotFoundComponent } from './not-found/not-found.component';

@Component({ standalone: true, template: '<p>Pagină publică</p>' })
class PublicTestPage {}

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [AppComponent, RouterTestingModule.withRoutes([
      { path: '', component: PublicTestPage },
      { path: 'login', component: LoginComponent },
      { path: 'public', component: PublicTestPage },
      { path: 'properties', component: PublicTestPage },
      { path: 'denied', component: PublicTestPage, canActivate: [() => false] },
      { path: '**', component: NotFoundComponent }
    ])],
    providers: [MessageService, provideNoopAnimations(), { provide: Auth, useValue: {} }]
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'hai-in-sat'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('hai-in-sat');
  });

  it('exposes the logo, desktop menu and seven footer destinations as real links', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.topbar__left a')?.getAttribute('href')).toBe('/');
    expect(Array.from(root.querySelectorAll('.nav-chips a')).map(link => link.getAttribute('href'))).toEqual([
      '/under-the-mountain', '/village-of-the-month', '/properties', '/homes'
    ]);
    expect(root.querySelectorAll('nav.footer-links').length).toBe(1);
    expect(Array.from(root.querySelectorAll('nav.footer-links a')).map(link => link.getAttribute('href')).sort()).toEqual([
      '/about-us', '/contact-us', '/homes', '/properties', '/see-the-area', '/under-the-mountain', '/village-of-the-month'
    ].sort());
  });

  it('navigates through the desktop anchor without a page reload', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/public');
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.nav-chips a[href="/properties"]') as HTMLAnchorElement;
    link.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/properties');
    expect(fixture.nativeElement.querySelector('router-outlet + *')?.textContent).toContain('Pagină publică');
  });

  it('leaves modified and middle clicks to the browser instead of navigating the current tab', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const link = fixture.debugElement.query(By.css('.nav-chips a[href="/properties"]'));

    for (const event of [
      new MouseEvent('click', { ctrlKey: true, button: 0 }),
      new MouseEvent('click', { metaKey: true, button: 0 }),
      new MouseEvent('click', { shiftKey: true, button: 0 }),
      new MouseEvent('click', { button: 1 })
    ]) {
      link.triggerEventHandler('click', event);
    }

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('keeps legal actions as dialogs without changing route', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const privacyAction = fixture.debugElement.query(By.css('.large-screen p-chip[label="Politica de confidențialitate"]'));

    privacyAction.triggerEventHandler('click', new MouseEvent('click'));
    fixture.detectChanges();

    expect(fixture.componentInstance.politica).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('renders real links in the opened mobile menu and closes it after navigation', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/public');
    const menuButton = fixture.nativeElement.querySelector('.topbar__menu-button button') as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // PrimeNG appends the open popover to document.body, outside the fixture root.
    const links = Array.from(document.querySelectorAll('.mobile-menu-panel .mobile-menu-list a')) as HTMLAnchorElement[];
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/under-the-mountain', '/village-of-the-month', '/properties', '/homes'
    ]);
    links.find(link => link.getAttribute('href') === '/properties')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/properties');
    expect(document.querySelector('.mobile-menu-panel .mobile-menu-list')).toBeNull();
  });

  it('resets noindex when navigating from login or 404 to a public page without its own SEO setup', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const meta = TestBed.inject(Meta);

    for (const path of ['/login', '/missing-page']) {
      await router.navigateByUrl(path);
      fixture.detectChanges();
      expect(meta.getTag('name="robots"')?.content).toBe('noindex, nofollow');
      if (path === '/missing-page') {
        expect(TestBed.inject(Title).getTitle()).toContain('Pagina nu a fost găsită');
        expect(fixture.nativeElement.querySelector('a[href="/properties"]')).toBeTruthy();
      }

      await router.navigateByUrl('/public');
      fixture.detectChanges();
      expect(meta.getTag('name="robots"')?.content).toBe('index, follow');
    }
  });

  it('keeps the current page noindex if navigation to a public page is cancelled', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/login');
    fixture.detectChanges();

    expect(await router.navigateByUrl('/denied')).toBeFalse();
    fixture.detectChanges();

    expect(router.url).toBe('/login');
    expect(TestBed.inject(Meta).getTag('name="robots"')?.content).toBe('noindex, nofollow');
  });

});
