import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { LoggerService } from '../service/logger.service';

/**
 * AuthGuard - Protejează rutele care necesită autentificare
 *
 * Verifică dacă utilizatorul este autentificat:
 * - Dacă DA: permite accesul la rută
 * - Dacă NU: redirectionează către /login
 */
export const authGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const logger = inject(LoggerService);

  return authState(auth).pipe(
    take(1), // Ia doar prima emisie pentru a evita multiple verificări
    map(user => {
      if (user) {
        // Utilizator autentificat - permite accesul
        return true;
      } else {
        // Utilizator neautentificat - redirectionează la login
        logger.log('[AuthGuard] Access denied. Redirecting to /login');
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
