import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-landing-page',
  templateUrl: './new-landing-page.component.html',
  styleUrls: ['./new-landing-page.component.scss']
})
export class NewLandingPageComponent {
  constructor(private router: Router) {}

  goToHomeFormPage() {
    this.router.navigateByUrl('/homes');
  }
}
