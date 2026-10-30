import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { appRoutes } from './app.routes';

@Component({ standalone: true, template: '' })
class RouteStub {}

describe('appRoutes', () => {
  // Rutele reale, cu componentele și gărzile înlocuite: se verifică doar căile și redirecturile.
  const routes: Route[] = appRoutes.map(route => route.component ? { ...route, component: RouteStub, canActivate: [] } : route);

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter(routes)] }));

  it('serves the public pages on Romanian paths', () => {
    const paths = appRoutes.filter(route => route.component).map(route => route.path);
    expect(paths).toEqual(jasmine.arrayContaining([
      'gaseste-mi-locul', 'oltenia-de-sub-munte', 'proprietati', 'proprietati/:id/:slug', 'proprietati/:id', 'satul-lunii', 'sate/:slug'
    ]));
    for (const old of ['homes', 'under-the-mountain', 'properties', 'property/:id/:slug', 'property/:id', 'village-of-the-month']) {
      expect(appRoutes.find(route => route.path === old)?.component).withContext(old).toBeUndefined();
    }
  });

  it('redirects in-app navigation from the old English paths, keeping the query string', async () => {
    const router = TestBed.inject(Router);
    const cases: [string, string][] = [
      ['/homes', '/gaseste-mi-locul'],
      ['/under-the-mountain', '/oltenia-de-sub-munte'],
      ['/village-of-the-month', '/satul-lunii'],
      ['/properties?page=1&size=6&type=house', '/proprietati?page=1&size=6&type=house'],
      ['/property/abc/teren-de-vanzare-test?page=0&size=6&type=land', '/proprietati/abc/teren-de-vanzare-test?page=0&size=6&type=land'],
      ['/property/abc', '/proprietati/abc'],
      ['/see-the-area', '/proprietati'],
      ['/info-page', '/oltenia-de-sub-munte'],
    ];
    for (const [old, target] of cases) {
      await router.navigateByUrl(old);
      expect(router.url).withContext(old).toBe(target);
    }
  });
});
