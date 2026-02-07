import { NextResponse } from 'next/server';
import { generateIconSet, ICON_SIZES, IconBounds } from '@/lib/iconProcessor';

interface GenerateIconsRequest {
  image: string; // Base64 data URL
  mode?: 'auto' | 'square'; // Default: 'auto'
  padding?: number; // 0-30, default: 10
  background?: string; // 'transparent', 'white', or hex color
  bounds?: IconBounds; // Manual bounds override (for UI adjustment)
  userApiKey?: string; // User's Anthropic API key for vision
}

// Helper to check API key authentication (same pattern as other endpoints)
function authenticateRequest(request: Request): boolean {
  const apiKey = process.env.GENERATOR_API_KEY;

  // If no API key is configured, allow all requests (dev mode)
  if (!apiKey) {
    return true;
  }

  // Check for API key in header
  const providedKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  if (providedKey === apiKey) {
    return true;
  }

  // Allow same-origin requests (UI) without API key
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // If request comes from the same host (UI), allow it
  if (host && (origin?.includes(host) || referer?.includes(host))) {
    return true;
  }

  // For Vercel deployments, check if referer matches the deployment URL
  if (referer && (referer.includes('vercel.app') || referer.includes('localhost'))) {
    const refererHost = new URL(referer).host;
    if (host === refererHost) {
      return true;
    }
  }

  return false;
}

export async function POST(request: Request) {
  try {
    // Authentication check
    if (!authenticateRequest(request)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing API key. Provide X-API-Key header.',
          },
        },
        { status: 401 }
      );
    }

    const body: GenerateIconsRequest = await request.json();

    const {
      image,
      mode = 'auto',
      padding = 10,
      background = 'transparent',
      bounds,
      userApiKey,
    } = body;

    // Validate required fields
    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'Image is required. Provide a base64 data URL.',
          },
        },
        { status: 400 }
      );
    }

    // Validate mode
    if (mode !== 'auto' && mode !== 'square') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_MODE',
            message: 'Mode must be "auto" or "square".',
          },
        },
        { status: 400 }
      );
    }

    // Validate padding
    if (typeof padding !== 'number' || padding < 0 || padding > 30) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PADDING',
            message: 'Padding must be a number between 0 and 30.',
          },
        },
        { status: 400 }
      );
    }

    // Validate background
    const validBackgrounds = ['transparent', 'white', 'black'];
    const isHexColor = /^#[0-9A-Fa-f]{6}$/.test(background);
    if (!validBackgrounds.includes(background) && !isHexColor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_BACKGROUND',
            message: 'Background must be "transparent", "white", "black", or a hex color (#RRGGBB).',
          },
        },
        { status: 400 }
      );
    }

    // Check for Anthropic API key if using auto mode
    if (mode === 'auto' && !bounds) {
      const anthropicKey = userApiKey || process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_ANTHROPIC_KEY',
              message:
                'Anthropic API key required for auto-detection mode. Please configure ANTHROPIC_API_KEY or provide userApiKey.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Extract base64 data from data URL
    let imageBase64: string;

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_IMAGE_FORMAT',
              message: 'Invalid image data URL format.',
            },
          },
          { status: 400 }
        );
      }
      imageBase64 = matches[2];
    } else {
      // Assume raw base64
      imageBase64 = image;
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    console.log(`[GenerateIcons] Starting - Mode: ${mode}, Padding: ${padding}%, Background: ${background}`);
    const startTime = Date.now();

    // Generate icons
    const result = await generateIconSet(imageBuffer, {
      mode,
      padding,
      background,
      bounds,
    });

    const elapsed = Date.now() - startTime;
    console.log(`[GenerateIcons] Completed in ${elapsed}ms - Generated ${Object.keys(result.icons).length} icons`);

    // Build response with data URLs
    const icons: Record<string, { dataUrl: string; width: number; height: number }> = {};

    for (const [name, icon] of Object.entries(result.icons)) {
      // Skip the 48x48 favicon (used only for ICO generation)
      if (name === 'favicon-48x48') continue;

      icons[name] = {
        dataUrl: icon.dataUrl,
        width: icon.width,
        height: icon.height,
      };
    }

    // Add favicon.ico
    icons['favicon-ico'] = {
      dataUrl: result.faviconIco.dataUrl,
      width: 48,
      height: 48,
    };

    return NextResponse.json({
      success: true,
      icons,
      detected_bounds: result.detectedBounds,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[GenerateIcons] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

// GET endpoint to return available icon sizes
export async function GET() {
  const sizes = Object.entries(ICON_SIZES).map(([name, config]) => ({
    name,
    width: config.width,
    height: config.height,
    padding: config.padding,
    isMaskable: name.startsWith('maskable'),
  }));

  return NextResponse.json({
    success: true,
    sizes,
    modes: ['auto', 'square'],
    backgrounds: ['transparent', 'white', '#RRGGBB (hex)'],
    paddingRange: { min: 0, max: 30, default: 10 },
  });
}
