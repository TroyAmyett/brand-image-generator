/**
 * Outpaint API endpoint
 *
 * Calls Stability AI's outpaint endpoint to extend an image's canvas
 * in any direction with AI-generated fill.
 *
 * POST /api/outpaint
 */

import { NextResponse } from 'next/server';
import dns from 'dns';

// Force IPv4 first to avoid Cloudflare connection issues
dns.setDefaultResultOrder('ipv4first');

const OUTPAINT_URL = 'https://api.stability.ai/v2beta/stable-image/edit/outpaint';

interface OutpaintRequest {
  image: string; // base64 data URI
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
  prompt?: string;
  creativity?: number;
  output_format?: string;
  user_api_key?: string;
}

export async function POST(request: Request) {
  try {
    const body: OutpaintRequest = await request.json();

    const {
      image,
      left = 0,
      right = 0,
      top = 0,
      bottom = 0,
      prompt,
      creativity = 0.25,
      output_format = 'png',
      user_api_key,
    } = body;

    // --- Validate ---

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'No image provided. Please provide a base64 data URI.',
          },
        },
        { status: 400 },
      );
    }

    if (left === 0 && right === 0 && top === 0 && bottom === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_EXTENSION',
            message: 'At least one direction (left, right, top, bottom) must be greater than 0.',
          },
        },
        { status: 400 },
      );
    }

    const maxExt = 2048;
    if (left > maxExt || right > maxExt || top > maxExt || bottom > maxExt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTENSION_TOO_LARGE',
            message: `Each extension value must be 2048 pixels or less.`,
          },
        },
        { status: 400 },
      );
    }

    // --- Resolve API key ---

    const apiKey = user_api_key || process.env.STABILITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message: 'Stability AI API key required for outpainting. Configure in Settings.',
          },
        },
        { status: 400 },
      );
    }

    // --- Extract raw image bytes from data URI ---

    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_IMAGE',
            message: 'Invalid image data URI.',
          },
        },
        { status: 400 },
      );
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // --- Build FormData ---

    const formData = new FormData();
    formData.append(
      'image',
      new Blob([imageBuffer], { type: 'image/png' }),
      'image.png',
    );

    if (left > 0) formData.append('left', String(left));
    if (right > 0) formData.append('right', String(right));
    if (top > 0) formData.append('top', String(top));
    if (bottom > 0) formData.append('bottom', String(bottom));

    if (prompt) {
      formData.append('prompt', prompt);
    }

    formData.append('creativity', String(Math.max(0, Math.min(1, creativity))));
    formData.append('output_format', output_format);

    // --- Call Stability AI ---

    console.log(`[outpaint] Extending image: left=${left} right=${right} top=${top} bottom=${bottom} creativity=${creativity}`);
    if (prompt) {
      console.log(`[outpaint] Prompt: "${prompt}"`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    let response: Response;
    try {
      response = await fetch(OUTPAINT_URL, {
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
        // Response may not be JSON
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

      console.error(`[outpaint] API error: ${response.status}`, errorMessage);

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: errorMessage,
          },
        },
        { status: response.status >= 400 && response.status < 500 ? 400 : 500 },
      );
    }

    // --- Return result as base64 ---

    const arrayBuffer = await response.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    const resultBase64 = resultBuffer.toString('base64');

    const mimeType = output_format === 'jpeg' ? 'image/jpeg' : 'image/png';

    console.log(`[outpaint] Success — returned image ${resultBuffer.length} bytes`);

    return NextResponse.json({
      success: true,
      imageBase64: `data:${mimeType};base64,${resultBase64}`,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[outpaint] Request timed out after 90s');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Outpaint request timed out. Try a smaller image or less extension.',
          },
        },
        { status: 504 },
      );
    }

    console.error('[outpaint] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during outpainting.',
        },
      },
      { status: 500 },
    );
  }
}
