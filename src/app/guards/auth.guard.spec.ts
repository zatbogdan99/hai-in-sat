import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth, User } from '@angular/fire/auth';

import { authGuard } from './auth.guard';
import { LoggerService } from '../service/logger.service';

describe('authGuard', () => {
  let auth: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;

  // currentUser e readonly în tipul Auth -> se setează prin al 3-lea argument
  // (propertyNames) al lui createSpyObj, nu prin atribuire.
  function configure(currentUser: User | null): void {
    auth = jasmine.createSpyObj<Auth>('Auth', ['authStateReady'], { currentUser });
    auth.authStateReady.and.returnValue(Promise.resolve());

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: auth },
        { provide: Router, useValue: router },
        {
          provide: LoggerService,
          useValue: jasmine.createSpyObj<LoggerService>('LoggerService', ['log', 'warn', 'error'])
        }
      ]
    });
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('permite accesul când utilizatorul este autentificat', async () => {
    configure({ uid: 'admin-uid' } as unknown as User);

    const result = await TestBed.runInInjectionContext(() => authGuard());

    expect(auth.authStateReady).toHaveBeenCalled();
    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirecționează la /login când utilizatorul nu este autentificat', async () => {
    configure(null);

    const result = await TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/login']);
  });
});
