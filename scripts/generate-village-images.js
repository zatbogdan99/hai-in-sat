/**
 * Generează variante redimensionate pentru pozele satelor (caruselul de pe /oltenia-de-sub-munte și galeriile
 * de pe /sate/:slug). Originalele de la aparatul foto au până la 6000 px și 7 MB, dar sunt afișate la 400–640 px.
 *
 *   npm run generate-village-images            # generează doar variantele care lipsesc
 *   npm run generate-village-images -- --force # le regenerează pe toate
 *
 * Lista pozelor vine din PhotoService (sursa unică). Scrie src/assets/sate/<nume>-<lățime>.avif și manifestul
 * src/app/service/village-image-variants.ts. Nu se leagă de build: se rulează manual când se schimbă pozele.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const PHOTO_SERVICE = path.join(ROOT, 'src/app/service/photo-service.ts');
const OUTPUT_DIR = path.join(ROOT, 'src/assets/sate');
const MANIFEST = path.join(ROOT, 'src/app/service/village-image-variants.ts');
const WIDTHS = [480, 800, 1280, 2048];
const QUALITY = 55;
const force = process.argv.includes('--force');

function sourcesFromPhotoService() {
  const text = fs.readFileSync(PHOTO_SERVICE, 'utf8');
  // Doar intrările active: liniile comentate (// itemImageSrc: ...) nu se potrivesc.
  return [...new Set([...text.matchAll(/^\s*itemImageSrc: '([^']+)',$/gm)].map(match => match[1]))];
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const manifest = {};
  for (const source of sourcesFromPhotoService()) {
    const input = path.join(ROOT, 'src', source);
    const meta = await sharp(input).metadata();
    const rotated = (meta.orientation ?? 1) >= 5;
    const width = rotated ? meta.height : meta.width;
    const height = rotated ? meta.width : meta.height;
    const name = path.basename(source, path.extname(source));
    const variants = [];
    for (const target of WIDTHS.filter(w => w <= width)) {
      const file = `${name}-${target}.avif`;
      const output = path.join(OUTPUT_DIR, file);
      if (force || !fs.existsSync(output)) {
        await sharp(input).rotate().resize({ width: target, withoutEnlargement: true }).avif({ quality: QUALITY }).toFile(output);
      }
      variants.push([target, `assets/sate/${file}`]);
    }
    // Un original mai îngust decât 480 px rămâne singura variantă.
    if (!variants.length) {
      variants.push([width, source]);
    }
    manifest[source] = { width, height, variants };
    console.log(`${source} (${width}x${height}) -> ${variants.map(([w]) => w).join(', ')}`);
  }
  const body = JSON.stringify(manifest, null, 2).replace(/"([a-z]+)":/g, '$1:').replace(/"/g, '\'');
  fs.writeFileSync(MANIFEST, `// Generat de scripts/generate-village-images.js. Nu edita manual: rulează npm run generate-village-images.
export interface VillageImageVariants {
  width: number;
  height: number;
  /** [lățime, cale], crescător după lățime. */
  variants: [number, string][];
}

export const VILLAGE_IMAGE_VARIANTS: Record<string, VillageImageVariants> = ${body};
`);
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} poze)`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
