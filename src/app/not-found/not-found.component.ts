import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SeoService } from '../service/seo.service';
import { SSR_RENDER_STATE } from '../ssr-render-state';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ssrRenderState = inject(SSR_RENDER_STATE, { optional: true });

  ngOnInit(): void {
    this.seo.updatePageMeta({
      title: 'Pagina nu a fost găsită | Hai în Sat',
      description: 'Pagina căutată nu există sau nu mai este disponibilă. Descoperă proprietățile din Oltenia de sub Munte.',
      canonicalPath: this.router.url.split(/[?#]/)[0]
    });
    this.seo.setNoindex();
    this.seo.removeJsonLd('real-estate-listing');
    this.seo.removeJsonLd('breadcrumb');

    if (isPlatformServer(this.platformId) && this.ssrRenderState) {
      this.ssrRenderState.notFound = true;
    }
  }
}
