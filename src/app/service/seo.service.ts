import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  updatePageMeta(config: {
    title: string;
    description: string;
    ogImage?: string;
    canonicalPath?: string;
  }): void {
    this.title.setTitle(config.title);

    this.meta.updateTag({ name: 'description', content: config.description });

    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });

    if (config.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: config.ogImage });
    }

    if (config.canonicalPath) {
      this.meta.updateTag({ property: 'og:url', content: `https://hai-în-sat.ro${config.canonicalPath}` });
      this.updateCanonicalUrl(`https://hai-în-sat.ro${config.canonicalPath}`);
    }

    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });

    if (config.ogImage) {
      this.meta.updateTag({ name: 'twitter:image', content: config.ogImage });
    }
  }

  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}


