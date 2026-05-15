import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

const BASE_URL = 'https://hai-în-sat.ro';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly isBrowser: boolean;

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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
      this.meta.updateTag({ property: 'og:url', content: `${BASE_URL}${config.canonicalPath}` });
      this.updateCanonicalUrl(`${BASE_URL}${config.canonicalPath}`);
    }

    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });

    if (config.ogImage) {
      this.meta.updateTag({ name: 'twitter:image', content: config.ogImage });
    }
  }

  setJsonLd(id: string, data: object): void {
    const existingScript = this.document.querySelector(`script[data-seo-id="${id}"]`);
    if (existingScript) {
      existingScript.textContent = JSON.stringify(data);
      return;
    }
    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-seo-id', id);
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(id: string): void {
    this.document.querySelector(`script[data-seo-id="${id}"]`)?.remove();
  }

  setBreadcrumbs(items: BreadcrumbItem[]): void {
    this.setJsonLd('breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': `${BASE_URL}${item.path}`
      }))
    });
  }

  setRealEstateListing(config: {
    name: string;
    description: string;
    url: string;
    image?: string;
    propertyType: 'house' | 'land';
  }): void {
    this.setJsonLd('real-estate-listing', {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      'name': config.name,
      'description': config.description,
      'url': `${BASE_URL}${config.url}`,
      ...(config.image ? { 'image': config.image } : {}),
      'category': config.propertyType === 'house' ? 'Casă' : 'Teren',
      'address': {
        '@type': 'PostalAddress',
        'addressRegion': 'Vâlcea',
        'addressCountry': 'RO'
      },
      'offers': {
        '@type': 'Offer',
        'availability': 'https://schema.org/InStock',
        'areaServed': {
          '@type': 'Place',
          'name': 'Oltenia de sub Munte, Vâlcea'
        }
      }
    });
  }

  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
