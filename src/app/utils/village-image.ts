import { VILLAGE_IMAGE_VARIANTS } from '../service/village-image-variants';

/**
 * Pozele satelor au variante redimensionate (scripts/generate-village-images.js): paginile cer varianta potrivită
 * prin srcset, nu originalul de la aparatul foto. O poză fără variante rămâne pe original.
 */
export function villageImageSrc(src: string | undefined, preferredWidth: number): string | undefined {
  const variants = src ? VILLAGE_IMAGE_VARIANTS[src]?.variants : undefined;
  if (!variants?.length) {
    return src;
  }
  // Cea mai mare variantă care nu trece de lățimea dorită; altfel cea mai mică.
  const fitting = variants.filter(([width]) => width <= preferredWidth);
  return (fitting.length ? fitting[fitting.length - 1] : variants[0])[1];
}

export function villageImageSrcset(src: string | undefined, maxWidth = Infinity): string | null {
  const variants = src ? VILLAGE_IMAGE_VARIANTS[src]?.variants : undefined;
  if (!variants?.length) {
    return null;
  }
  return variants.filter(([width]) => width <= maxWidth).map(([width, path]) => `${path} ${width}w`).join(', ') || null;
}

export function villageImageSize(src: string | undefined): { width: number; height: number } | undefined {
  const entry = src ? VILLAGE_IMAGE_VARIANTS[src] : undefined;
  return entry ? { width: entry.width, height: entry.height } : undefined;
}
