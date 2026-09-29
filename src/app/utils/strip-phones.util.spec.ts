import { stripPhones } from './strip-phones.util';

describe('stripPhones', () => {
  it('removes Romanian mobile numbers in local and international formats', () => {
    for (const phone of ['0763144967', '0763 144 967', '0763.144.967', '0763-144-967',
      '+40728140628', '+40 728 140 628', '40 728 140 628', '0 7 6 3 1 4 4 9 6 7',
      '0763\u00a0144\u00a0967', '0763  144  967']) {
      expect(stripPhones(`Casă ${phone} disponibilă`)).withContext(phone).toBe('Casă disponibilă');
    }
  });

  it('removes multiple phones and keeps punctuation and surrounding words', () => {
    expect(stripPhones('0763144967, +40 728 140 628; teren 0768-915-198 disponibil.'))
      .toBe(', ; teren disponibil.');
    expect(stripPhones('0763144967 0768915198')).toBe('');
  });

  it('does not remove fragments from longer numbers or foreign prefixes', () => {
    for (const value of ['10763144967', '07631449670', '12340728140628123',
      '+407281406281', '+10763144967']) {
      expect(stripPhones(`ID ${value}`)).toBe(`ID ${value}`);
    }
  });

  it('preserves prices, dimensions, years and shorter numeric identifiers', () => {
    const text = 'Preț 75.000 euro, 1.250 mp, 3 camere, an 1976, ID 0763144.';
    expect(stripPhones(text)).toBe(text);
  });

  it('handles empty and phone-only descriptions', () => {
    expect(stripPhones('')).toBe('');
    expect(stripPhones('+40 728 140 628')).toBe('');
  });
});
