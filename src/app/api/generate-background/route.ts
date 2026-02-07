/**
 * Background Generation API endpoint
 *
 * Generates a background image based on a setting description.
 * Used by the Restyle Character feature for compositing.
 *
 * POST /api/generate-background
 */

import { NextResponse } from 'next/server';
import dns from 'dns';

// Force IPv4 first to avoid Cloudflare connection issues
dns.setDefaultResultOrder('ipv4first');

interface GenerateBackgroundRequest {
  setting: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  accentColor?: string;
  user_api_key?: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

/**
 * Convert aspect ratio to DALL-E 3 size parameter
 */
function getSize(aspectRatio: string): '1792x1024' | '1024x1792' | '1024x1024' {
  switch (aspectRatio) {
    case '16:9':
      return '1792x1024';
    case '9:16':
      return '1024x1792';
    case '1:1':
    default:
      return '1024x1024';
  }
}

/**
 * Build a prompt optimized for background generation
 */
function buildBackgroundPrompt(setting: string, accentColor?: string): string {
  const colorHint = accentColor ? `Subtle ${accentColor} accent lighting.` : '';

  return [
    `Professional photograph of an empty scene: ${setting}.`,
    `No people, no text, no logos, no watermarks.`,
    `Wide establishing shot showing the full environment.`,
    `Soft natural lighting with shallow depth of field on the background.`,
    `Space in the center-left area for a person to be composited.`,
    colorHint,
    `Photorealistic, high resolution, 8K quality.`,
  ].filter(Boolean).join(' ');
}

export async function POST(request: Request) {
  try {
    const body: GenerateBackgroundRequest = await request.json();

    const {
      setting,
      aspectRatio = '16:9',
      accentColor,
      user_api_key,
    } = body;

    if (!setting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_SETTING',
            message: 'Setting description is required.',
          },
        },
        { status: 400 }
      );
    }

    // Resolve API key
    const apiKey = user_api_key || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message: 'OpenAI API key required for background generation. Configure in Settings.',
          },
        },
        { status: 400 }
      );
    }

    const prompt = buildBackgroundPrompt(setting, accentColor);
    const size = getSize(aspectRatio);

    console.log('[generate-background] Generating background...');
    console.log(`[generate-background]   setting: "${setting}"`);
    console.log(`[generate-background]   size: ${size}`);

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'hd',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = (errorData as { error?: { message?: string } }).error?.message || response.statusText;

      console.error(`[generate-background] API error (${response.status}):`, detail);

      let errorCode = 'API_ERROR';
      if (response.status === 401) {
        errorCode = 'INVALID_API_KEY';
      } else if (response.status === 429) {
        errorCode = 'RATE_LIMITED';
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: `OpenAI API error: ${detail}`,
          },
        },
        { status: response.status >= 400 && response.status < 500 ? 400 : 500 }
      );
    }

    const data = (await response.json()) as {
      data: Array<{ b64_json: string; revised_prompt?: string }>;
    };

    if (!data.data?.[0]?.b64_json) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_OUTPUT',
            message: 'No background image was generated.',
          },
        },
        { status: 500 }
      );
    }

    console.log('[generate-background] Background generated successfully');

    return NextResponse.json({
      success: true,
      background: `data:image/png;base64,${data.data[0].b64_json}`,
      revisedPrompt: data.data[0].revised_prompt,
    });
  } catch (error: unknown) {
    console.error('[generate-background] Error:', error);

    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
