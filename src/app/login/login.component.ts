import { Component } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * LoginComponent - Pagină de autentificare pentru adminii site-ului
 *
 * Permite autentificarea folosind email și parolă
 * La autentificare reușită, redirectionează către /add-property
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  /**
   * Gestionează submit-ul formularului de login
   * Încearcă autentificarea cu Firebase Authentication
   */
  async onSubmit() {
    // Validare câmpuri goale
    if (!this.email || !this.password) {
      this.error = 'Te rog completează emailul și parola.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      // Încercare autentificare cu Firebase
      await signInWithEmailAndPassword(this.auth, this.email, this.password);

      console.log('[Login] Authentication successful');

      // Redirectionează către pagina de administrare
      this.router.navigate(['/add-property']);
    } catch (err: any) {
      console.error('[Login] Authentication failed:', err);

      // Mesaje de eroare prietenoase pentru utilizator
      switch (err.code) {
        case 'auth/invalid-email':
          this.error = 'Email invalid.';
          break;
        case 'auth/user-disabled':
          this.error = 'Acest cont a fost dezactivat.';
          break;
        case 'auth/user-not-found':
          this.error = 'Nu există cont cu acest email.';
          break;
        case 'auth/wrong-password':
          this.error = 'Parolă incorectă.';
          break;
        case 'auth/invalid-credential':
          this.error = 'Email sau parolă incorectă.';
          break;
        case 'auth/too-many-requests':
          this.error = 'Prea multe încercări. Te rog încearcă mai târziu.';
          break;
        default:
          this.error = 'A apărut o eroare. Te rog încearcă din nou.';
      }

      this.loading = false;
    }
  }
}
