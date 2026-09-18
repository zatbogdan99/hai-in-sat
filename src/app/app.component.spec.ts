import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { AppComponent } from './app.component';
import { Component } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
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
