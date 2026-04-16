import { PropertyType } from '../dto/property-type.enum';

const DIACRITICS_MAP: Record<string, string> = {
  'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ş': 's', 'ț': 't', 'ţ': 't',
  'Ă': 'a', 'Â': 'a', 'Î': 'i', 'Ș': 's', 'Ş': 's', 'Ț': 't', 'Ţ': 't',
};

function removeDiacritics(text: string): string {
  return text.replace(/[ăâîșşțţĂÂÎȘŞȚŢ]/g, char => DIACRITICS_MAP[char] || char);
}

function slugify(text: string): string {
  return removeDiacritics(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function generateSlug(type: PropertyType, name: string): string {
  const prefix = type === PropertyType.HOUSE ? 'casa-de-vanzare' : 'teren-de-vanzare';
  const nameSlug = slugify(name);
  return nameSlug ? `${prefix}-${nameSlug}` : prefix;
}
