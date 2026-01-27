import sharp from 'sharp';
import Anthropic from '@anthropic-ai/sdk';
import pngToIco from 'png-to-ico';

// Icon sizes for PWA/web apps
export const ICON_SIZES = {
  // Standard icons
  'favicon-16x16': { width: 16, height: 16, padding: 0 },
  'favicon-32x32': { width: 32, height: 32, padding: 0 },
  'favicon-48x48': { width: 48, height: 48, padding: 0 }, // For ICO
  'apple-touch-icon': { width: 180, height: 180, padding: 10 },
  'icon-72x72': { width: 72, height: 72, padding: 10 },
  'icon-96x96': { width: 96, height: 96, padding: 10 },
  'icon-128x128': { width: 128, height: 128, padding: 10 },
  'icon-144x144': { width: 144, height: 144, padding: 10 },
  'icon-152x152': { width: 152, height: 152, padding: 10 },
  'icon-192x192': { width: 192, height: 192, padding: 10 },
  'icon-384x384': { width: 384, height: 384, padding: 10 },
  'icon-512x512': { width: 512, height: 512, padding: 10 },
  'mstile-150x150': { width: 150, height: 150, padding: 10 },
  // Maskable icons (40% safe zone)
  'maskable-192x192': { width: 192, height: 192, padding: 40 },
  'maskable-512x512': { width: 512, height: 512, padding: 40 },
} as const;

export type IconName = keyof typeof ICON_SIZES;

export interface IconBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GenerateIconsOptions {
  mode: 'auto' | 'square';
  padding?: number; // Override default padding (0-30%)
  background?: string; // Background color (default: transparent)
  bounds?: IconBounds; // Manual bounds override
}

export interface GeneratedIcon {
  name: string;
  buffer: Buffer;
  width: number;
  height: number;
  dataUrl: string;
}

export interface IconGenerationResult {
  icons: Record<string, GeneratedIcon>;
  faviconIco: {
    buffer: Buffer;
    dataUrl: string;
  };
  detectedBounds?: IconBounds;
  metadata: {
    mode: 'auto' | 'square';
    padding: number;
    background: string;
    originalSize: string;
  };
}

/**
 * Use Claude vision to detect the icon/symbol portion of a logo
 */
export async function detectIconBounds(
  imageBuffer: Buffer,
  apiKey?: string
): Promise<IconBounds> {
  const anthropic = new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Convert to base64 for Claude
  const base64Image = imageBuffer.toString('base64');
  const mediaType = metadata.format === 'png' ? 'image/png' : 'image/jpeg';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `Analyze this logo image and identify the icon/symbol portion (NOT the text/wordmark).

The image dimensions are ${width}x${height} pixels.

Return ONLY a JSON object with the bounding box of the icon/symbol in pixels:
{"x": <left>, "y": <top>, "width": <width>, "height": <height>}

If the entire image IS the icon (no separate text), return:
{"x": 0, "y": 0, "width": ${width}, "height": ${height}}

Return ONLY the JSON, no other text.`,
          },
        ],
      },
    ],
  });

  // Parse the response
  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const bounds = JSON.parse(jsonStr) as IconBounds;

    // Validate bounds
    if (
      typeof bounds.x !== 'number' ||
      typeof bounds.y !== 'number' ||
      typeof bounds.width !== 'number' ||
      typeof bounds.height !== 'number'
    ) {
      throw new Error('Invalid bounds format');
    }

    // Ensure bounds are within image
    bounds.x = Math.max(0, Math.min(bounds.x, width));
    bounds.y = Math.max(0, Math.min(bounds.y, height));
    bounds.width = Math.min(bounds.width, width - bounds.x);
    bounds.height = Math.min(bounds.height, height - bounds.y);

    return bounds;
  } catch (e) {
    console.error('Failed to parse Claude response:', content.text);
    // Fallback: return full image as bounds
    return { x: 0, y: 0, width, height };
  }
}

/**
 * Add padding around an image (for safe zone)
 */
export async function addPadding(
  imageBuffer: Buffer,
  paddingPercent: number,
  backgroundColor: string = 'transparent'
): Promise<Buffer> {
  if (paddingPercent <= 0) {
    return imageBuffer;
  }

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Calculate padding in pixels
  const size = Math.max(width, height);
  const paddingPx = Math.round((size * paddingPercent) / 100);

  // New dimensions with padding
  const newSize = size + paddingPx * 2;

  // Parse background color
  let background: { r: number; g: number; b: number; alpha: number };
  if (backgroundColor === 'transparent') {
    background = { r: 0, g: 0, b: 0, alpha: 0 };
  } else if (backgroundColor === 'white') {
    background = { r: 255, g: 255, b: 255, alpha: 1 };
  } else if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.slice(1);
    background = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      alpha: 1,
    };
  } else {
    background = { r: 0, g: 0, b: 0, alpha: 0 };
  }

  // Create new image with padding
  const result = await sharp({
    create: {
      width: newSize,
      height: newSize,
      channels: 4,
      background,
    },
  })
    .composite([
      {
        input: await sharp(imageBuffer)
          .resize(size, size, { fit: 'contain', background })
          .toBuffer(),
        left: paddingPx,
        top: paddingPx,
      },
    ])
    .png()
    .toBuffer();

  return result;
}

/**
 * Generate a single icon at the specified size
 */
async function generateSingleIcon(
  sourceBuffer: Buffer,
  name: string,
  targetWidth: number,
  targetHeight: number,
  paddingPercent: number,
  backgroundColor: string
): Promise<GeneratedIcon> {
  // First add padding if needed
  let processedBuffer = sourceBuffer;
  if (paddingPercent > 0) {
    processedBuffer = await addPadding(sourceBuffer, paddingPercent, backgroundColor);
  }

  // Resize to target size
  const resizedBuffer = await sharp(processedBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'contain',
      background:
        backgroundColor === 'transparent'
          ? { r: 0, g: 0, b: 0, alpha: 0 }
          : backgroundColor === 'white'
          ? { r: 255, g: 255, b: 255, alpha: 1 }
          : { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return {
    name,
    buffer: resizedBuffer,
    width: targetWidth,
    height: targetHeight,
    dataUrl: `data:image/png;base64,${resizedBuffer.toString('base64')}`,
  };
}

/**
 * Create favicon.ico from multiple PNG sizes
 */
async function createFaviconIco(
  icon16: Buffer,
  icon32: Buffer,
  icon48: Buffer
): Promise<Buffer> {
  // png-to-ico expects an array of PNG buffers
  const icoBuffer = await pngToIco([icon16, icon32, icon48]);
  return icoBuffer;
}

/**
 * Generate all PWA icon sizes from a source image
 */
export async function generateIconSet(
  imageBuffer: Buffer,
  options: GenerateIconsOptions
): Promise<IconGenerationResult> {
  const {
    mode,
    padding: overridePadding,
    background = 'transparent',
    bounds,
  } = options;

  // Get original image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const originalSize = `${metadata.width}x${metadata.height}`;

  // If auto mode, detect icon bounds
  let detectedBounds: IconBounds | undefined;
  let croppedBuffer = imageBuffer;

  if (mode === 'auto' && !bounds) {
    detectedBounds = await detectIconBounds(imageBuffer);

    // Crop to detected bounds
    croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: detectedBounds.x,
        top: detectedBounds.y,
        width: detectedBounds.width,
        height: detectedBounds.height,
      })
      .toBuffer();
  } else if (bounds) {
    // Use provided bounds
    detectedBounds = bounds;
    croppedBuffer = await sharp(imageBuffer)
      .extract({
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      })
      .toBuffer();
  }

  // Make the cropped image square (use the larger dimension)
  const croppedMeta = await sharp(croppedBuffer).metadata();
  const size = Math.max(croppedMeta.width || 0, croppedMeta.height || 0);

  const squareBuffer = await sharp(croppedBuffer)
    .resize(size, size, {
      fit: 'contain',
      background:
        background === 'transparent'
          ? { r: 0, g: 0, b: 0, alpha: 0 }
          : background === 'white'
          ? { r: 255, g: 255, b: 255, alpha: 1 }
          : { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Generate all icon sizes in parallel
  const iconPromises: Promise<GeneratedIcon>[] = [];

  for (const [name, config] of Object.entries(ICON_SIZES)) {
    const effectivePadding = overridePadding !== undefined ? overridePadding : config.padding;
    iconPromises.push(
      generateSingleIcon(
        squareBuffer,
        name,
        config.width,
        config.height,
        effectivePadding,
        background
      )
    );
  }

  const generatedIcons = await Promise.all(iconPromises);

  // Build icons record
  const icons: Record<string, GeneratedIcon> = {};
  for (const icon of generatedIcons) {
    icons[icon.name] = icon;
  }

  // Create favicon.ico
  const faviconBuffer = await createFaviconIco(
    icons['favicon-16x16'].buffer,
    icons['favicon-32x32'].buffer,
    icons['favicon-48x48'].buffer
  );

  return {
    icons,
    faviconIco: {
      buffer: faviconBuffer,
      dataUrl: `data:image/x-icon;base64,${faviconBuffer.toString('base64')}`,
    },
    detectedBounds,
    metadata: {
      mode,
      padding: overridePadding ?? 10,
      background,
      originalSize,
    },
  };
}

/**
 * Convert buffer to data URL
 */
export function bufferToDataUrl(buffer: Buffer, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}
