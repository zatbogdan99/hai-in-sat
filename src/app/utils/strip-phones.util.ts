/** Elimină telefoanele mobile românești din textul SEO, după conversia HTML în text. */
export function stripPhones(text: string): string {
  // Prefixul capturat și limita finală protejează identificatorii numerici mai lungi.
  return text
    .replace(/(^|[^\d+])(?:\+?4)?0[\s.\-]*7(?:[\s.\-]*\d){8}(?!\d)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
