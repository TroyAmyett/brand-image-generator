/**
 * Client-side image resize utility for Stability AI dimensions
 */

export interface StabilityDimension {
  width: number;
  height: number;
  ratio: number;
  label: string;
}

// Stability AI SDXL supported dimensions
export const STABILITY_DIMENSIONS: StabilityDimension[] = [
  { width: 1024, height: 1024, ratio: 1, label: '1:1 Square' },
  { width: 1152, height: 896, ratio: 1152 / 896, label: '4:3 Landscape' },
  { width: 1216, height: 832, ratio: 1216 / 832, label: '3:2 Landscape' },
  { width: 1344, height: 768, ratio: 1344 / 768, label: '16:9 Landscape' },
  { width: 1536, height: 640, ratio: 1536 / 640, label: '21:9 Ultra-wide' },
  { width: 896, height: 1152, ratio: 896 / 1152, label: '3:4 Portrait' },
  { width: 832, height: 1216, ratio: 832 / 1216, label: '2:3 Portrait' },
  { width: 768, height: 1344, ratio: 768 / 1344, label: '9:16 Portrait' },
  { width: 640, height: 1536, ratio: 640 / 1536, label: '9:21 Ultra-tall' },
];

export interface ResizedImageResult {
  dataUrl: string;
  dimension: StabilityDimension;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Get the closest matching Stability AI dimension for a given aspect ratio
 */
export function getClosestStabilityDimension(width: number, height: number): StabilityDimension {
  const aspectRatio = width / height;

  let closest = STABILITY_DIMENSIONS[0];
  let minDiff = Math.abs(aspectRatio - closest.ratio);

  for (const dim of STABILITY_DIMENSIONS) {
    const diff = Math.abs(aspectRatio - dim.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      closest = dim;
    }
  }

  return { ...closest };
}

/**
 * Load an image from a data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Resize and center-crop an image to match Stability AI dimensions
 */
export async function resizeImageForStability(
  imageDataUrl: string
): Promise<ResizedImageResult> {
  const img = await loadImage(imageDataUrl);
  const originalWidth = img.width;
  const originalHeight = img.height;

  // Get the target dimension
  const dimension = getClosestStabilityDimension(originalWidth, originalHeight);
  const { width: targetWidth, height: targetHeight } = dimension;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate scaling and cropping
  const sourceAspect = originalWidth / originalHeight;
  const targetAspect = targetWidth / targetHeight;

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = originalWidth;
  let sourceHeight = originalHeight;

  if (sourceAspect > targetAspect) {
    // Source is wider - crop sides
    sourceWidth = originalHeight * targetAspect;
    sourceX = (originalWidth - sourceWidth) / 2;
  } else if (sourceAspect < targetAspect) {
    // Source is taller - crop top/bottom
    sourceHeight = originalWidth / targetAspect;
    sourceY = (originalHeight - sourceHeight) / 2;
  }

  // Draw with high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
    0, 0, targetWidth, targetHeight               // Destination rectangle
  );

  // Convert to PNG data URL
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  return {
    dataUrl,
    dimension,
    originalWidth,
    originalHeight,
  };
}

/**
 * Get image dimensions from a data URL without resizing
 */
export async function getImageDimensions(
  imageDataUrl: string
): Promise<{ width: number; height: number; targetDimension: StabilityDimension }> {
  const img = await loadImage(imageDataUrl);
  const targetDimension = getClosestStabilityDimension(img.width, img.height);

  return {
    width: img.width,
    height: img.height,
    targetDimension,
  };
}
