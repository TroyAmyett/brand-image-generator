import { NextResponse } from 'next/server';
import { generateImage, ImageProvider, PROVIDER_CONFIGS } from '@/lib/providers';
import { buildCharacterPrompt, type AspectRatio } from '@/lib/characterPrompt';

// Validation constants
const VALID_PROVIDERS: ImageProvider[] = ['openai', 'stability', 'replicate'];

/**
 * Convert a URL image to a base64 data URI.
 * OpenAI returns temporary URLs that expire; this persists them.
 */
async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString('base64')}`;
}

/**
 * POST /api/generate-character
 *
 * Generate character portrait variations using AI image providers.
 * Produces photorealistic portraits optimized for HeyGen Avatar IV animation.
 *
 * Body:
 *  - description: string (required) — physical description
 *  - setting: string (required) — background setting
 *  - expression: string (required) — facial expression
 *  - outfitDescription: string (required) — outfit description
 *  - brandAccentColor?: string — hex color, default '#0ea5e9'
 *  - customSettingDescription?: string — custom setting text
 *  - provider: string (required) — 'openai' | 'stability' | 'replicate'
 *  - count?: number — 1-4, default 4
 *  - user_api_key?: string — optional user-provided API key
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      description,
      setting,
      expression,
      outfitDescription,
      brandAccentColor = '#0ea5e9',
      customSettingDescription,
      provider,
      aspectRatio = '16:9',
      count = 4,
      user_api_key,
    } = body;

    // --- Validation ---

    // Required fields
    const missingFields: string[] = [];
    if (!description) missingFields.push('description');
    if (!setting) missingFields.push('setting');
    if (!expression) missingFields.push('expression');
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

    // --- Generate Character Variations ---

    console.log(
      `[Character API] Generating ${variationCount} character variations - Provider: ${provider}, Setting: ${setting}, Expression: ${expression}, Key source: ${keySource}`
    );

    // Map aspect ratio to pixel dimensions
    const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1536, height: 1024 },
      '9:16': { width: 1024, height: 1536 },
      '1:1':  { width: 1024, height: 1024 },
    };
    const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9'];

    // Build the prompt
    const { prompt, negativePrompt } = buildCharacterPrompt({
      description,
      setting,
      expression,
      outfitDescription,
      brandAccentColor,
      customSettingDescription,
      provider: provider as ImageProvider,
      aspectRatio: aspectRatio as AspectRatio,
    });

    console.log(`[Character API] Prompt (${aspectRatio}): ${prompt.substring(0, 200)}...`);

    // Build generation params
    // Do NOT pass style to avoid Stability AI photographic preset conflict
    const baseParams = {
      provider: provider as ImageProvider,
      prompt,
      negativePrompt,
      width: dims.width,
      height: dims.height,
      quality: 'hd' as const,
      apiKey: effectiveApiKey,
    };

    // Each variation gets a different diversity cue appended to the prompt
    // so the model produces visually distinct compositions while keeping the
    // described physical appearance. Cues vary lighting/angle, NOT the person.
    const VARIATION_CUES = [
      '',
      'Slightly different camera angle and lighting setup. Unique composition.',
      'Softer, warmer lighting. Slightly different head position.',
      'Cooler-toned dramatic lighting. Subtle different framing.',
    ];

    const generationPromises = Array.from({ length: variationCount }, (_, i) => {
      const cue = VARIATION_CUES[i] || VARIATION_CUES[i % VARIATION_CUES.length];
      const variedPrompt = cue ? `${prompt}\n${cue}` : prompt;
      return generateImage({ ...baseParams, prompt: variedPrompt });
    });

    const results = await Promise.allSettled(generationPromises);

    // Collect successful variations, converting URLs to base64 for persistence
    const variations: { imageUrl: string; prompt: string }[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const gen = result.value;
        if (gen.success && (gen.imageUrl || gen.imageBase64)) {
          let imageData = gen.imageBase64 || gen.imageUrl || '';

          // Convert OpenAI-style URLs to base64 so they persist (URLs expire)
          if (imageData && !imageData.startsWith('data:') && imageData.startsWith('http')) {
            try {
              imageData = await urlToBase64(imageData);
            } catch (err) {
              console.warn('[Character API] Failed to convert URL to base64, using URL:', err);
              imageData = gen.imageUrl || '';
            }
          }

          variations.push({ imageUrl: imageData, prompt });
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
            message: `All character generations failed. ${errors[0] || 'Unknown error'}`,
          },
        },
        { status: 500 }
      );
    }

    console.log(
      `[Character API] Generated ${variations.length}/${variationCount} variations successfully`
    );

    return NextResponse.json({
      success: true,
      variations,
      metadata: {
        setting,
        expression,
        provider,
        model: providerConfig.defaultModel,
        generated_at: new Date().toISOString(),
        count: variations.length,
        requested_count: variationCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error('Error generating characters:', error);
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
