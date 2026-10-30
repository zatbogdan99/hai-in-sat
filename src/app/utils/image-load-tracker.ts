import { signal } from '@angular/core';

/**
 * Ține minte ce poze s-au încărcat, ca scheletul de încărcare (clasa globală `.skeleton`) să dispară doar de pe ele.
 * Cheia e valoarea atributului `src`, aceeași cu cea legată în template. Și o eroare oprește scheletul:
 * o poză care nu vine nu trebuie să lase o animație infinită.
 */
export class ImageLoadTracker {
  private readonly done = signal<ReadonlySet<string>>(new Set());

  isLoaded(src: string | null | undefined): boolean {
    return !!src && this.done().has(src);
  }

  markLoaded(src: string | null | undefined): void {
    if (!src || this.done().has(src)) {
      return;
    }
    this.done.update(loaded => new Set(loaded).add(src));
  }

  /** Pozele terminate înainte de hidratare nu mai trimit `load` către Angular: starea lor se citește din DOM. */
  syncFrom(root: ParentNode): void {
    root.querySelectorAll('img').forEach(img => {
      if (img.complete) {
        this.markLoaded(img.getAttribute('src'));
      }
    });
  }
}
