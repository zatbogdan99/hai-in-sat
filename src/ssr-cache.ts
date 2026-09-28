import type { Request, Response } from 'express';
import type { LRUCache } from 'lru-cache';
import type { SsrRenderState } from './app/ssr-render-state';

export interface SsrCacheEntry {
  html: string;
  renderedAt: number;
}

export function isPrivateSsrPath(path: string): boolean {
  try {
    // Angular decodează segmentele și acceptă parametri matrix / outlet-uri.
    return /(?:^\/+|\(primary:)(?:login|add-property)(?:[;/)]|$)/.test(decodeURIComponent(path));
  } catch {
    return true;
  }
}

/** Cache per instanță pentru HTML public. Nu reține headerele unui request. */
export class SsrHtmlCache {
  constructor(
    private readonly entries: LRUCache<string, SsrCacheEntry>,
    private readonly now: () => number = Date.now
  ) {}

  tryServe(req: Request, res: Response): boolean {
    res.set({ 'X-Cache': 'MISS', 'Cache-Control': 'no-store' });
    if (!this.isEligible(req)) return false;

    const entry = this.entries.get(req.path);
    if (!entry) return false;

    if (this.now() - entry.renderedAt >= this.entries.ttl) {
      this.entries.delete(req.path);
      return false;
    }

    this.setFreshness(res, entry.renderedAt);
    res.set('X-Cache', 'HIT').send(entry.html);
    return true;
  }

  send(req: Request, res: Response, state: SsrRenderState, html: string, renderedAt: number): void {
    const remainingTtl = this.entries.ttl - (this.now() - renderedAt);
    if (this.isEligible(req) && res.statusCode === 200 && state.cacheable
      && !state.serviceUnavailable && !state.notFound && !res.hasHeader('Set-Cookie')
      && remainingTtl > 0) {
      this.entries.set(req.path, { html, renderedAt }, { ttl: remainingTtl });
      this.setFreshness(res, renderedAt);
    }
    res.send(html);
  }

  private isEligible(req: Request): boolean {
    return req.method === 'GET'
      && !req.originalUrl.includes('?')
      && Object.keys(req.query).length === 0
      && !isPrivateSsrPath(req.path)
      // Ocolește formele alternative Angular, inclusiv outlet-uri numite.
      && !/[()%]/.test(req.path)
      && !req.path.startsWith('//')
      && !req.headers.authorization;
  }

  private setFreshness(res: Response, renderedAt: number): void {
    res.set({
      'Cache-Control': 'public, max-age=300',
      // Păstrează vechimea HTML-ului; un HIT nu îi acordă încă cinci minute.
      'Date': new Date(renderedAt).toUTCString(),
      'Age': String(Math.max(0, Math.floor((this.now() - renderedAt) / 1000))),
    });
  }
}
