import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HtmlTextService } from './html-text.service';

describe('HtmlTextService', () => {
  afterEach(() => TestBed.resetTestingModule());

  function createService(platformId: 'browser' | 'server' = 'browser'): HtmlTextService {
    TestBed.configureTestingModule({
      providers: [
        HtmlTextService,
        { provide: PLATFORM_ID, useValue: platformId }
      ]
    });

    return TestBed.inject(HtmlTextService);
  }

  it('converts HTML to decoded plain text', () => {
    const service = createService();

    expect(service.htmlToText('<p>Casa <strong>frumoasă</strong> &amp; aproape</p>'))
      .toBe('Casa frumoasă & aproape');
  });

  it('returns an empty string for empty values', () => {
    const service = createService();

    expect(service.htmlToText(null)).toBe('');
    expect(service.htmlToText(undefined)).toBe('');
    expect(service.htmlToText('')).toBe('');
  });

  it('handles quoted greater-than characters and HTML comments', () => {
    const service = createService();

    expect(service.htmlToText('<a title="vârsta > 18">Casă</a><!-- detaliu > ascuns --> frumoasă'))
      .toBe('Casă frumoasă');
  });

  it('uses the browser HTML parser without creating active DOM nodes', () => {
    const service = createService();
    const parseFromStringSpy = spyOn(DOMParser.prototype, 'parseFromString').and.callThrough();
    const maliciousHandler = jasmine.createSpy('maliciousHandler');
    const targetWindow = window as typeof window & { __htmlTextXssHandler?: () => void };
    targetWindow.__htmlTextXssHandler = maliciousHandler;

    try {
      expect(service.htmlToText(
        '<img src="x" onerror="window.__htmlTextXssHandler()"><p>Casă sigură</p>'
      )).toBe('Casă sigură');
      expect(parseFromStringSpy).toHaveBeenCalledWith(jasmine.any(String), 'text/html');
      expect(maliciousHandler).not.toHaveBeenCalled();
    } finally {
      delete targetWindow.__htmlTextXssHandler;
    }
  });

  it('converts on the server without accessing the DOM', () => {
    const service = createService('server');
    const parseFromStringSpy = spyOn(DOMParser.prototype, 'parseFromString').and.callThrough();

    expect(() => service.htmlToText(
      '<p title="vârsta > 18">Casa &amp; terenul &eacute; &acirc; &#x21;</p>'
    )).not.toThrow();
    expect(service.htmlToText(
      '<p title="vârsta > 18">Casa &amp; terenul &eacute; &acirc; &#x21;</p>'
    )).toBe('Casa & terenul é â !');
    expect(parseFromStringSpy).not.toHaveBeenCalled();
  });

  it('decodes entities only after stripping markup on the server', () => {
    const service = createService('server');

    expect(service.htmlToText('&lt;strong&gt;Text&lt;/strong&gt;')).toBe('<strong>Text</strong>');
  });
});
