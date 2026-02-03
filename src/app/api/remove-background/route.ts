import { NextResponse } from 'next/server';
import dns from 'dns';

// Force IPv4 first to avoid Cloudflare connection issues
dns.setDefaultResultOrder('ipv4first');

const REMOVE_BG_URL = 'https://api.stability.ai/v2beta/stable-image/edit/remove-background';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, user_api_key } = body;

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'No image provided. Please provide a base64 data URI.',
          },
        },
        { status: 400 }
      );
    }

    // Resolve API key: user-provided key takes precedence over env var
    const apiKey = user_api_key || process.env.STABILITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message:
              'Stability AI API key required for background removal. Configure in Settings.',
          },
        },
        { status: 400 }
      );
    }

    // Extract raw base64 from data URI (e.g. "data:image/png;base64,iVBOR...")
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: 'Invalid image data URI. Expected format: data:image/png;base64,...',
          },
        },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Build FormData for the Stability AI API
    const formData = new FormData();
    formData.append(
      'image',
      new Blob([imageBuffer], { type: 'image/png' }),
      'image.png'
    );
    formData.append('output_format', 'png');

    // Make request with 60s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let response: Response;
    try {
      response = await fetch(REMOVE_BG_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'image/*',
        },
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      let errorMessage = `Stability AI API error: ${response.status} ${response.statusText}`;
      let errorCode = 'API_ERROR';

      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.name) {
          errorCode = errorData.name;
        }
      } catch {
        // Response may not be JSON; use the default error message
      }

      if (response.status === 401) {
        errorCode = 'INVALID_API_KEY';
        errorMessage = 'Invalid Stability AI API key. Please check your key in Settings.';
      } else if (response.status === 402) {
        errorCode = 'INSUFFICIENT_CREDITS';
        errorMessage = 'Insufficient Stability AI credits. Please add credits to your account.';
      } else if (response.status === 429) {
        errorCode = 'RATE_LIMITED';
        errorMessage = 'Rate limited by Stability AI. Please try again in a moment.';
      }

      console.error(`[remove-background] API error: ${response.status}`, errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
          },
        },
        { status: response.status }
      );
    }

    // Response is raw image bytes (Accept: image/*)
    const arrayBuffer = await response.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    const resultBase64 = resultBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      imageBase64: `data:image/png;base64,${resultBase64}`,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[remove-background] Request timed out after 60s');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Background removal request timed out. Please try again with a smaller image.',
          },
        },
        { status: 504 }
      );
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[remove-background] Unexpected error:', errMsg, error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Background removal error: ${errMsg}`,
        },
      },
      { status: 500 }
    );
  }
}
