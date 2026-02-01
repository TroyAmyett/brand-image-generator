import { NextResponse } from 'next/server';
import { generateImage, ImageProvider, PROVIDER_CONFIGS } from '@/lib/providers';
import { buildLogoPrompt, LogoType, LogoStyle } from '@/lib/logoPrompt';
import type { BrandStyleGuide } from '@funnelists/brand';
import fs from 'fs';
import path from 'path';

/** Storage directory for style guide JSON files */
const GUIDES_DIR = path.join(process.cwd(), 'data', 'style-guides');

/**
 * Load a style guide by ID from the data directory.
 */
function loadStyleGuide(guideId: string): BrandStyleGuide | null {
  try {
    const guidePath = path.join(GUIDES_DIR, `${guideId}.json`);
    if (!fs.existsSync(guidePath)) return null;
    return JSON.parse(fs.readFileSync(guidePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Extract color overrides from a style guide.
 */
function extractColorsFromGuide(guide: BrandStyleGuide): {
  primary?: string;
  secondary?: string;
  accent?: string;
} {
  const colors: { primary?: string; secondary?: string; accent?: string } = {};
  if (guide.colors?.primary?.[0]) {
    colors.primary = guide.colors.primary[0].hex;
  }
  if (guide.colors?.secondary?.[0]) {
    colors.secondary = guide.colors.secondary[0].hex;
  }
  if (guide.colors?.accent?.[0]) {
    colors.accent = guide.colors.accent[0].hex;
  }
  return colors;
}

// Validation constants
const VALID_LOGO_TYPES: LogoType[] = [
  'icon_mark',
  'wordmark',
  'combination',
  'lettermark',
  'emblem',
  'abstract',
];

const VALID_LOGO_STYLES: LogoStyle[] = [
  'minimal',
  'modern',
  'vintage',
  'playful',
  'corporate',
  'geometric',
  'handdrawn',
];

const VALID_PROVIDERS: ImageProvider[] = ['openai', 'stability', 'replicate'];

/**
 * POST /api/generate-logos
 *
 * Generate logo variations using AI image providers.
 *
 * Body:
 *  - brandName: string (required)
 *  - description: string (required)
 *  - logoType: LogoType (required)
 *  - style: LogoStyle (required)
 *  - guideId?: string - optional style guide ID
 *  - colorOverrides?: { primary?: string; secondary?: string; accent?: string }
 *  - provider: ImageProvider (required)
 *  - count: number (1-4, default 4)
 *  - refinement?: string - optional refinement text for iterations
 *  - user_api_key?: string - optional user-provided API key
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      brandName,
      description,
      logoType,
      style,
      guideId,
      colorOverrides,
      provider,
      count = 4,
      refinement,
      user_api_key,
    } = body;

    // --- Validation ---

    // Required fields
    const missingFields: string[] = [];
    if (!brandName) missingFields.push('brandName');
    if (!description) missingFields.push('description');
    if (!logoType) missingFields.push('logoType');
    if (!style) missingFields.push('style');
    if (!provider) missingFields.push('provider');

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: `Missing required fields: ${missingFields.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate logo type
    if (!VALID_LOGO_TYPES.includes(logoType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_LOGO_TYPE',
            message: `Invalid logoType. Must be one of: ${VALID_LOGO_TYPES.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate style
    if (!VALID_LOGO_STYLES.includes(style)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STYLE',
            message: `Invalid style. Must be one of: ${VALID_LOGO_STYLES.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate provider
    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PROVIDER',
            message: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Check provider availability
    const providerConfig = PROVIDER_CONFIGS[provider as ImageProvider];
    if (!providerConfig || !providerConfig.available) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_AVAILABLE',
            message: `Image provider '${provider}' is not yet available.`,
          },
        },
        { status: 400 }
      );
    }

    // Check API key
    const apiKeyEnvVar = providerConfig.envKeyName;
    const hasUserKey = !!user_api_key;
    const hasServerKey = !!process.env[apiKeyEnvVar];

    if (!hasUserKey && !hasServerKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message: `No API key available for ${providerConfig.name}. Configure your key in settings.`,
          },
        },
        { status: 400 }
      );
    }

    const effectiveApiKey = user_api_key || process.env[apiKeyEnvVar];
    const keySource = hasUserKey ? 'user' : 'server';

    // Validate count
    const variationCount = Math.min(Math.max(1, Number(count) || 4), 4);

    // --- Load Style Guide Colors ---

    let colors = colorOverrides || {};
    if (guideId) {
      const guide = loadStyleGuide(guideId);
      if (guide) {
        const guideColors = extractColorsFromGuide(guide);
        // User overrides take priority over guide colors
        colors = {
          primary: colors.primary || guideColors.primary,
          secondary: colors.secondary || guideColors.secondary,
          accent: colors.accent || guideColors.accent,
        };
      }
    }

    // --- Generate Logo Variations ---

    console.log(
      `[Logo API] Generating ${variationCount} logo variations - Provider: ${provider}, Type: ${logoType}, Style: ${style}, Key source: ${keySource}`
    );

    // Build the prompt once (each generation will produce a unique result due to model randomness)
    const { prompt, negativePrompt } = buildLogoPrompt({
      brandName,
      description,
      logoType: logoType as LogoType,
      style: style as LogoStyle,
      colors: Object.keys(colors).length > 0 ? colors : undefined,
      refinement,
      provider: provider as ImageProvider,
    });

    console.log(`[Logo API] Prompt: ${prompt.substring(0, 200)}...`);

    // Generate variations in parallel
    const generationPromises = Array.from({ length: variationCount }, () =>
      generateImage({
        provider: provider as ImageProvider,
        prompt,
        negativePrompt,
        width: 1024,
        height: 1024,
        quality: 'hd',
        style: 'natural',
        apiKey: effectiveApiKey,
      })
    );

    const results = await Promise.allSettled(generationPromises);

    // Collect successful variations
    const variations: { imageUrl: string; prompt: string }[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const gen = result.value;
        if (gen.success && (gen.imageUrl || gen.imageBase64)) {
          variations.push({
            imageUrl: gen.imageUrl || gen.imageBase64 || '',
            prompt,
          });
        } else if (gen.error) {
          errors.push(gen.error.message);
        }
      } else {
        errors.push(result.reason?.message || 'Generation failed');
      }
    }

    if (variations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALL_GENERATIONS_FAILED',
            message: `All logo generations failed. ${errors[0] || 'Unknown error'}`,
          },
        },
        { status: 500 }
      );
    }

    console.log(
      `[Logo API] Generated ${variations.length}/${variationCount} variations successfully`
    );

    return NextResponse.json({
      success: true,
      variations,
      metadata: {
        brandName,
        logoType,
        style,
        provider,
        model: providerConfig.defaultModel,
        generated_at: new Date().toISOString(),
        count: variations.length,
        requested_count: variationCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Error generating logos:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}
