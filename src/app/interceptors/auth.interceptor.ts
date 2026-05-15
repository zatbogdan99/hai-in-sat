import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

const API_ORIGIN = 'https://hai-in-sat-api.lm.r.appspot.com';
const LOCAL_API_ORIGIN = 'http://localhost:8080';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return next(req);
  }

  const isApiRequest =
    req.url.startsWith(API_ORIGIN) ||
    req.url.startsWith(LOCAL_API_ORIGIN) ||
    req.url.startsWith('/home-form');

  if (!isApiRequest) {
    return next(req);
  }

  const auth = inject(Auth);
  const user = auth.currentUser;

  if (!user) {
    return next(req);
  }

  return from(user.getIdToken()).pipe(
    switchMap(token =>
      next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    )
  );
};
