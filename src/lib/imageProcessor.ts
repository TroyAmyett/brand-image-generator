import sharp from 'sharp';

export interface AssetVariant {
  key: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
}

export const ASSET_VARIANTS: Record<string, AssetVariant> = {
  master: { key: 'master', label: 'Master (16:9)', width: 1792, height: 1024, ratio: '16:9' },
  hero_wide: { key: 'hero_wide', label: 'Hero Wide (21:9)', width: 1792, height: 768, ratio: '21:9' },
  card_4x3: { key: 'card_4x3', label: 'Card (4:3)', width: 800, height: 600, ratio: '4:3' },
  card_3x2: { key: 'card_3x2', label: 'Card (3:2)', width: 600, height: 400, ratio: '3:2' },
  square: { key: 'square', label: 'Square (1:1)', width: 600, height: 600, ratio: '1:1' },
};

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Center crop an image to target dimensions
 */
export async function centerCrop(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<ProcessedImage> {
  const result = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'centre'
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    format: 'png'
  };
}

/**
 * Create hero wide (21:9) from master by center cropping vertically
 * OR extend with dark gradient fade on sides (keeping all content)
 */
export async function createHeroWide(
  imageBuffer: Buffer,
  mode: 'crop' | 'extend' = 'crop'
): Promise<ProcessedImage> {
  const targetWidth = 1792;
  const targetHeight = 768;

  if (mode === 'crop') {
    // Center crop - take the center vertical portion
    return centerCrop(imageBuffer, targetWidth, targetHeight);
  }

  // Extend mode: scale down to fit height, add dark gradient on sides
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Could not read image dimensions');
  }

  // Scale image to fit within target height while maintaining aspect
  const scaledHeight = targetHeight;
  const scaledWidth = Math.round((metadata.width / metadata.height) * scaledHeight);

  // Resize the source image
  const resizedBuffer = await sharp(imageBuffer)
    .resize(scaledWidth, scaledHeight, { fit: 'contain' })
    .png()
    .toBuffer();

  // If the scaled image is already wider than target, just crop
  if (scaledWidth >= targetWidth) {
    return centerCrop(imageBuffer, targetWidth, targetHeight);
  }

  // Calculate padding needed
  const paddingLeft = Math.floor((targetWidth - scaledWidth) / 2);
  const paddingRight = targetWidth - scaledWidth - paddingLeft;

  // Create gradient overlays for the sides
  const result = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 4,
      background: { r: 10, g: 25, b: 47, alpha: 1 } // Dark blue background
    }
  })
    .composite([
      {
        input: resizedBuffer,
        left: paddingLeft,
        top: 0
      }
    ])
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    width: result.info.width,
    height: result.info.height,
    format: 'png'
  };
}

/**
 * Process master image to create all requested asset variants
 */
export async function processAssetSet(
  masterUrl: string,
  variants: string[]
): Promise<Record<string, ProcessedImage>> {
  const masterBuffer = await fetchImageBuffer(masterUrl);
  const results: Record<string, ProcessedImage> = {};

  // Always include master
  const masterMetadata = await sharp(masterBuffer).metadata();
  results.master = {
    buffer: masterBuffer,
    width: masterMetadata.width || 1792,
    height: masterMetadata.height || 1024,
    format: 'png'
  };

  // Process each requested variant
  for (const variantKey of variants) {
    if (variantKey === 'master') continue; // Already added

    const variant = ASSET_VARIANTS[variantKey];
    if (!variant) continue;

    if (variantKey === 'hero_wide') {
      // Use center crop for hero wide
      results.hero_wide = await createHeroWide(masterBuffer, 'crop');
    } else {
      // Center crop for all other variants
      results[variantKey] = await centerCrop(masterBuffer, variant.width, variant.height);
    }
  }

  return results;
}

/**
 * Convert processed image to base64 data URL
 */
export function bufferToDataUrl(buffer: Buffer, format: string = 'png'): string {
  return `data:image/${format};base64,${buffer.toString('base64')}`;
}
