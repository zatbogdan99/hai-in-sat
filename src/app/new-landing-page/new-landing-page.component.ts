import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../service/seo.service';

@Component({
  selector: 'app-new-landing-page',
  templateUrl: './new-landing-page.component.html',
  styleUrls: ['./new-landing-page.component.scss']
})
export class NewLandingPageComponent implements OnInit {
  constructor(private router: Router, private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Hai în Sat – Case și terenuri de vânzare în Oltenia de sub Munte',
      description: 'Descoperă viața autentică din Oltenia de sub Munte. Terenuri și case în locuri unde munții întâlnesc satul, iar timpul curge mai încet.',
      ogImage: 'https://hai-în-sat.ro/assets/poza_landing1.jpeg',
      canonicalPath: '/'
    });
  }

  goToHomeFormPage() {
    this.router.navigateByUrl('/homes');
  }
}
