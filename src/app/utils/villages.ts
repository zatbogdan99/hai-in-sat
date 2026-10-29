/**
 * Satele prezentate pe /under-the-mountain, fiecare cu adresa lui (/sate/:slug). Id-ul e indexul satului în
 * datele din InfoPageComponent și UnderTheMountainComponent. Aceleași adrese stau în sitemap.xml și llms.txt
 * (scripts/generate-sitemap.js are lista duplicată): păstrează-le sincronizate.
 */
export interface Village {
  id: number;
  slug: string;
  name: string;
}

export const VILLAGES: readonly Village[] = [
  { id: 1, slug: 'horezu', name: 'Horezu' },
  { id: 2, slug: 'polovragi', name: 'Polovragi' },
  { id: 3, slug: 'baia-de-fier', name: 'Baia de Fier' },
  { id: 4, slug: 'vaideeni', name: 'Vaideeni' },
  { id: 5, slug: 'slatioara', name: 'Slătioara' },
  { id: 6, slug: 'costesti', name: 'Costești' },
  { id: 7, slug: 'barbatesti', name: 'Bărbătești' }
];

export function villageBySlug(slug: string | null | undefined): Village | undefined {
  return VILLAGES.find(village => village.slug === slug);
}

export function villagePath(id: number): string {
  const village = VILLAGES.find(candidate => candidate.id === id);
  return village ? `/sate/${village.slug}` : '/under-the-mountain';
}
