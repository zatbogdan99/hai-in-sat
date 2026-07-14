import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

const SERVER_NAMED_ENTITIES: Readonly<Record<string, string>> = {
  AElig: 'Æ',
  Aacute: 'Á',
  Acirc: 'Â',
  Agrave: 'À',
  Aring: 'Å',
  Atilde: 'Ã',
  Auml: 'Ä',
  Ccedil: 'Ç',
  ETH: 'Ð',
  Eacute: 'É',
  Ecirc: 'Ê',
  Egrave: 'È',
  Euml: 'Ë',
  Iacute: 'Í',
  Icirc: 'Î',
  Igrave: 'Ì',
  Iuml: 'Ï',
  Ntilde: 'Ñ',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Ograve: 'Ò',
  Oslash: 'Ø',
  Otilde: 'Õ',
  Ouml: 'Ö',
  THORN: 'Þ',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Ugrave: 'Ù',
  Uuml: 'Ü',
  Yacute: 'Ý',
  aacute: 'á',
  acirc: 'â',
  aelig: 'æ',
  agrave: 'à',
  amp: '&',
  apos: "'",
  aring: 'å',
  atilde: 'ã',
  auml: 'ä',
  ccedil: 'ç',
  copy: '©',
  eacute: 'é',
  ecirc: 'ê',
  egrave: 'è',
  eth: 'ð',
  euml: 'ë',
  gt: '>',
  hellip: '…',
  iacute: 'í',
  icirc: 'î',
  igrave: 'ì',
  iuml: 'ï',
  laquo: '«',
  lt: '<',
  mdash: '—',
  nbsp: '\u00a0',
  ndash: '–',
  ntilde: 'ñ',
  oacute: 'ó',
  ocirc: 'ô',
  ograve: 'ò',
  oslash: 'ø',
  otilde: 'õ',
  ouml: 'ö',
  quot: '"',
  raquo: '»',
  reg: '®',
  szlig: 'ß',
  thorn: 'þ',
  uacute: 'ú',
  ucirc: 'û',
  ugrave: 'ù',
  uuml: 'ü',
  yacute: 'ý',
  yuml: 'ÿ'
};

@Injectable({ providedIn: 'root' })
export class HtmlTextService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  htmlToText(html: string | null | undefined): string {
    if (!html) {
      return '';
    }

    if (this.isBrowser) {
      const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
      return parsedDocument.body.textContent ?? '';
    }

    return this.decodeEntities(this.stripMarkup(html));
  }

  private stripMarkup(html: string): string {
    let text = '';
    let index = 0;

    while (index < html.length) {
      if (html.startsWith('<!--', index)) {
        const commentEnd = html.indexOf('-->', index + 4);
        index = commentEnd === -1 ? html.length : commentEnd + 3;
        continue;
      }

      if (html[index] !== '<' || !this.isMarkupStart(html[index + 1])) {
        text += html[index];
        index += 1;
        continue;
      }

      const tagEnd = this.findTagEnd(html, index + 1);
      if (tagEnd === -1) {
        break;
      }

      index = tagEnd + 1;
    }

    return text;
  }

  private isMarkupStart(character: string | undefined): boolean {
    return !!character && (/[a-z]/i.test(character) || character === '/' || character === '!' || character === '?');
  }

  private findTagEnd(html: string, start: number): number {
    let quote: '"' | "'" | null = null;

    for (let index = start; index < html.length; index += 1) {
      const character = html[index];

      if (quote) {
        if (character === quote) {
          quote = null;
        }
        continue;
      }

      if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        return index;
      }
    }

    return -1;
  }

  private decodeEntities(text: string): string {
    return text.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi, (entity, code: string) => {
      if (code[0] !== '#') {
        return SERVER_NAMED_ENTITIES[code] ?? entity;
      }

      const isHex = code[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (!Number.isFinite(value) || value <= 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
        return '\ufffd';
      }

      return String.fromCodePoint(value);
    });
  }
}
