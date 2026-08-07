import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { LoggerService } from '../service/logger.service';

/**
 * AuthGuard - Protejează rutele care necesită autentificare
 *
 * Așteaptă ca Firebase SDK să termine de verificat sesiunea persistată
 * (IndexedDB/localStorage) prin `authStateReady()`, apoi verifică `currentUser`.
 * Varianta veche (`authState(auth).pipe(take(1))`) prindea prima emisie, care
 * la cold start este `null` chiar și pentru un utilizator logat -> redirect greșit.
 *
 * Notă SSR: pe server `currentUser` este mereu `null`, deci ruta protejată
 * redirecționează la /login la randarea pe server. Comportament acceptat.
 */
export const authGuard = async (): Promise<boolean> => {
  // inject() trebuie apelat SINCRON, înainte de primul await (context de injecție).
  const auth = inject(Auth);
  const router = inject(Router);
  const logger = inject(LoggerService);

  await auth.authStateReady();

  if (auth.currentUser) {
    return true;
  }

  logger.log('[AuthGuard] Access denied. Redirecting to /login');
  router.navigate(['/login']);
  return false;
};
