/**
 * Logo Lockup Compositor
 *
 * Client-side Canvas compositing library for creating logo lockup layouts.
 * Combines an icon (transparent PNG) with a brand name in three standard
 * layout configurations: horizontal, stacked, and inverted.
 *
 * This module runs in the browser only -- it relies on `document`, `Image`,
 * and `HTMLCanvasElement`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LockupLayout = 'horizontal' | 'stacked' | 'inverted';

export interface LockupOptions {
  /** base64 transparent PNG of the icon */
  iconDataUrl: string;
  brandName: string;
  layout: LockupLayout;
  /** default: 'Inter, system-ui, sans-serif' */
  fontFamily?: string;
  /** auto-calculated if not provided */
  fontSize?: number;
  /** default: 600 */
  fontWeight?: number;
  /** default: '#000000' */
  textColor?: string;
}

export interface LockupResult {
  /** PNG data URL of the composed lockup */
  dataUrl: string;
  layout: LockupLayout;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FONT_FAMILY = 'Inter, system-ui, sans-serif';
const DEFAULT_FONT_WEIGHT = 600;
const DEFAULT_TEXT_COLOR = '#000000';

// Layout dimensions
const HORIZONTAL_WIDTH = 1600;
const HORIZONTAL_HEIGHT = 800;
const HORIZONTAL_ICON_REGION_WIDTH = 700;
const HORIZONTAL_TEXT_REGION_WIDTH = 900;
const HORIZONTAL_ICON_PADDING = 60;
const HORIZONTAL_TEXT_LEFT_MARGIN = 40;
const HORIZONTAL_TEXT_PADDING = 80; // total horizontal padding in text region
const HORIZONTAL_FONT_START = 120;
const HORIZONTAL_FONT_MIN = 32;

const STACKED_WIDTH = 1024;
const STACKED_HEIGHT = 1400;
const STACKED_ICON_REGION_HEIGHT = 900;
const STACKED_TEXT_REGION_HEIGHT = 500;
const STACKED_ICON_PADDING = 80;
const STACKED_TEXT_TOP_OFFSET = 60; // below icon region
const STACKED_TEXT_PADDING = 100; // total horizontal padding
const STACKED_FONT_START = 96;
const STACKED_FONT_MIN = 28;

const INVERTED_WIDTH = 1024;
const INVERTED_HEIGHT = 1400;
const INVERTED_TEXT_REGION_HEIGHT = 300;
const INVERTED_ICON_REGION_HEIGHT = 1100;
const INVERTED_ICON_PADDING = 80;
const INVERTED_TEXT_PADDING = 100;
const INVERTED_FONT_START = 96;
const INVERTED_FONT_MIN = 28;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Load a data-URL (or any URL) into an HTMLImageElement and wait for it to
 * finish decoding.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${err}`));
    img.src = src;
  });
}

/**
 * Auto-calculate the largest font size (stepping down by 2px) that fits within
 * `maxWidth`. Returns the computed size, clamped to `minSize` at the lower end.
 */
function calculateFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  fontWeight: number,
  maxWidth: number,
  startSize: number,
  minSize: number,
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) break;
    size -= 2;
  }
  return Math.max(size, minSize);
}

/**
 * Compute draw dimensions and top-left origin so that the image is centered
 * within a rectangular region while preserving its aspect ratio.
 */
function fitAndCenter(
  imgWidth: number,
  imgHeight: number,
  maxWidth: number,
  maxHeight: number,
  regionX: number,
  regionY: number,
  regionWidth: number,
  regionHeight: number,
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
  const drawWidth = imgWidth * scale;
  const drawHeight = imgHeight * scale;
  const x = regionX + (regionWidth - drawWidth) / 2;
  const y = regionY + (regionHeight - drawHeight) / 2;
  return { x, y, w: drawWidth, h: drawHeight };
}

// ---------------------------------------------------------------------------
// Layout composers
// ---------------------------------------------------------------------------

function composeHorizontal(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  brandName: string,
  fontFamily: string,
  fontWeight: number,
  textColor: string,
  explicitFontSize: number | undefined,
): void {
  // --- Icon (left region) ---
  const iconMaxW = HORIZONTAL_ICON_REGION_WIDTH - HORIZONTAL_ICON_PADDING * 2;
  const iconMaxH = HORIZONTAL_HEIGHT - HORIZONTAL_ICON_PADDING * 2;
  const icon = fitAndCenter(
    img.width,
    img.height,
    iconMaxW,
    iconMaxH,
    0,
    0,
    HORIZONTAL_ICON_REGION_WIDTH,
    HORIZONTAL_HEIGHT,
  );
  ctx.drawImage(img, icon.x, icon.y, icon.w, icon.h);

  // --- Text (right region) ---
  const textMaxWidth = HORIZONTAL_TEXT_REGION_WIDTH - HORIZONTAL_TEXT_PADDING;
  const fontSize =
    explicitFontSize ??
    calculateFontSize(
      ctx,
      brandName,
      fontFamily,
      fontWeight,
      textMaxWidth,
      HORIZONTAL_FONT_START,
      HORIZONTAL_FONT_MIN,
    );

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const textX = HORIZONTAL_ICON_REGION_WIDTH + HORIZONTAL_TEXT_LEFT_MARGIN;
  const textY = HORIZONTAL_HEIGHT / 2;
  ctx.fillText(brandName, textX, textY);
}

function composeStacked(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  brandName: string,
  fontFamily: string,
  fontWeight: number,
  textColor: string,
  explicitFontSize: number | undefined,
): void {
  // --- Icon (top region) ---
  const iconMaxW = STACKED_WIDTH - STACKED_ICON_PADDING * 2;
  const iconMaxH = STACKED_ICON_REGION_HEIGHT - STACKED_ICON_PADDING * 2;
  const icon = fitAndCenter(
    img.width,
    img.height,
    iconMaxW,
    iconMaxH,
    0,
    0,
    STACKED_WIDTH,
    STACKED_ICON_REGION_HEIGHT,
  );
  ctx.drawImage(img, icon.x, icon.y, icon.w, icon.h);

  // --- Text (bottom region) ---
  const textMaxWidth = STACKED_WIDTH - STACKED_TEXT_PADDING;
  const fontSize =
    explicitFontSize ??
    calculateFontSize(
      ctx,
      brandName,
      fontFamily,
      fontWeight,
      textMaxWidth,
      STACKED_FONT_START,
      STACKED_FONT_MIN,
    );

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const textX = STACKED_WIDTH / 2;
  const textY = STACKED_ICON_REGION_HEIGHT + STACKED_TEXT_TOP_OFFSET + fontSize / 2;
  ctx.fillText(brandName, textX, textY);
}

function composeInverted(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  brandName: string,
  fontFamily: string,
  fontWeight: number,
  textColor: string,
  explicitFontSize: number | undefined,
): void {
  // --- Text (top region) ---
  const textMaxWidth = INVERTED_WIDTH - INVERTED_TEXT_PADDING;
  const fontSize =
    explicitFontSize ??
    calculateFontSize(
      ctx,
      brandName,
      fontFamily,
      fontWeight,
      textMaxWidth,
      INVERTED_FONT_START,
      INVERTED_FONT_MIN,
    );

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const textX = INVERTED_WIDTH / 2;
  const textY = INVERTED_TEXT_REGION_HEIGHT / 2;
  ctx.fillText(brandName, textX, textY);

  // --- Icon (bottom region) ---
  const iconMaxW = INVERTED_WIDTH - INVERTED_ICON_PADDING * 2;
  const iconMaxH = INVERTED_ICON_REGION_HEIGHT - INVERTED_ICON_PADDING * 2;
  const icon = fitAndCenter(
    img.width,
    img.height,
    iconMaxW,
    iconMaxH,
    0,
    INVERTED_TEXT_REGION_HEIGHT,
    INVERTED_WIDTH,
    INVERTED_ICON_REGION_HEIGHT,
  );
  ctx.drawImage(img, icon.x, icon.y, icon.w, icon.h);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compose a single logo lockup from an icon and brand name.
 *
 * Returns a transparent PNG data URL together with the layout metadata.
 */
export async function composeLockup(options: LockupOptions): Promise<LockupResult> {
  const {
    iconDataUrl,
    brandName,
    layout,
    fontFamily = DEFAULT_FONT_FAMILY,
    fontSize,
    fontWeight = DEFAULT_FONT_WEIGHT,
    textColor = DEFAULT_TEXT_COLOR,
  } = options;

  // Ensure fonts are loaded before we measure / draw text.
  if (typeof document !== 'undefined' && document.fonts) {
    await document.fonts.ready;
  }

  // Load the icon image.
  const img = await loadImage(iconDataUrl);

  // Determine canvas dimensions based on layout.
  let canvasWidth: number;
  let canvasHeight: number;
  switch (layout) {
    case 'horizontal':
      canvasWidth = HORIZONTAL_WIDTH;
      canvasHeight = HORIZONTAL_HEIGHT;
      break;
    case 'stacked':
      canvasWidth = STACKED_WIDTH;
      canvasHeight = STACKED_HEIGHT;
      break;
    case 'inverted':
      canvasWidth = INVERTED_WIDTH;
      canvasHeight = INVERTED_HEIGHT;
      break;
    default:
      throw new Error(`Unknown layout: ${layout}`);
  }

  // Create an off-screen canvas (transparent by default).
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2d rendering context');
  }

  // Compose the chosen layout.
  switch (layout) {
    case 'horizontal':
      composeHorizontal(ctx, img, brandName, fontFamily, fontWeight, textColor, fontSize);
      break;
    case 'stacked':
      composeStacked(ctx, img, brandName, fontFamily, fontWeight, textColor, fontSize);
      break;
    case 'inverted':
      composeInverted(ctx, img, brandName, fontFamily, fontWeight, textColor, fontSize);
      break;
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    layout,
    width: canvasWidth,
    height: canvasHeight,
  };
}

/**
 * Generate all three lockup variants (horizontal, stacked, inverted) for a
 * given icon and brand name.
 */
export async function generateAllLockups(
  iconDataUrl: string,
  brandName: string,
  textColor?: string,
  fontFamily?: string,
): Promise<LockupResult[]> {
  const layouts: LockupLayout[] = ['horizontal', 'stacked', 'inverted'];

  const results = await Promise.all(
    layouts.map((layout) =>
      composeLockup({
        iconDataUrl,
        brandName,
        layout,
        textColor,
        fontFamily,
      }),
    ),
  );

  return results;
}

/**
 * Apply a solid background colour behind an existing transparent image.
 *
 * If `bgColor` is `null` the original data URL is returned unchanged
 * (transparent pass-through).
 */
export async function applyBackground(
  imageDataUrl: string,
  bgColor: string | null,
): Promise<string> {
  // Transparent pass-through.
  if (bgColor === null) {
    return imageDataUrl;
  }

  const img = await loadImage(imageDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2d rendering context');
  }

  // Fill with background colour.
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the original image on top.
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL('image/png');
}
