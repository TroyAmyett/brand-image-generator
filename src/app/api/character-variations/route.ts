/**
 * Character Variations API endpoint
 *
 * Calls the fofr/consistent-character model on Replicate to generate
 * pose variations from a base character photo.
 *
 * POST /api/character-variations
 */

import { NextResponse } from 'next/server';
import dns from 'dns';

// Force IPv4 first to avoid Cloudflare connection issues
dns.setDefaultResultOrder('ipv4first');

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const MODEL = 'fofr/consistent-character';

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  urls: {
    get: string;
    cancel: string;
  };
}

interface CharacterVariationsRequest {
  subject: string;
  prompt: string;
  negative_prompt?: string;
  number_of_outputs?: number;
  output_format?: string;
  output_quality?: number;
  seed?: number;
  user_api_key?: string;
}

/**
 * Get the latest version hash for the model.
 */
async function getModelVersion(apiKey: string): Promise<string> {
  const response = await fetch(`https://api.replicate.com/v1/models/${MODEL}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Failed to get model info: ${(errorData as { detail?: string }).detail || response.statusText}`
    );
  }

  const data = (await response.json()) as { latest_version?: { id: string } };
  if (!data.latest_version?.id) {
    throw new Error('Model version not found');
  }

  return data.latest_version.id;
}

/**
 * Poll the Replicate prediction endpoint until it completes or times out.
 */
async function pollForCompletion(
  statusUrl: string,
  apiKey: string,
  timeout: number
): Promise<ReplicatePrediction> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds — model takes ~64s typically

  while (Date.now() - startTime < timeout) {
    const response = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.statusText}`);
    }

    const prediction = (await response.json()) as ReplicatePrediction;

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed') {
      throw new Error(prediction.error || 'Prediction failed');
    }

    if (prediction.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }

    // Still processing — wait and poll again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error('Prediction timed out');
}

/**
 * Fetch a remote image URL and return it as a base64 data URI.
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const mimeType = contentType.split(';')[0].trim();
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return `data:${mimeType};base64,${base64}`;
}

export async function POST(request: Request) {
  try {
    const body: CharacterVariationsRequest = await request.json();

    const {
      subject,
      prompt,
      negative_prompt,
      number_of_outputs = 4,
      output_format = 'png',
      output_quality = 95,
      seed,
      user_api_key,
    } = body;

    // --- Validate required fields ---

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_SUBJECT',
            message: 'Subject image is required. Provide a base64 data URI of the character photo.',
          },
        },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PROMPT',
            message: 'Prompt is required. Describe the character for consistency.',
          },
        },
        { status: 400 }
      );
    }

    // Validate number_of_outputs range
    if (number_of_outputs < 1 || number_of_outputs > 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NUMBER_OF_OUTPUTS',
            message: 'number_of_outputs must be between 1 and 6.',
          },
        },
        { status: 400 }
      );
    }

    // --- Resolve API key ---

    const apiKey = user_api_key || process.env.REPLICATE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message:
              'Replicate API key required for character variations. Configure in Settings.',
          },
        },
        { status: 400 }
      );
    }

    // --- Get latest model version ---

    console.log('[character-variations] Fetching latest model version...');
    const version = await getModelVersion(apiKey);
    console.log(`[character-variations] Model version: ${version.slice(0, 12)}...`);

    // --- Build prediction input ---

    const input: Record<string, unknown> = {
      subject,
      prompt,
      number_of_outputs,
      output_format,
      output_quality,
    };

    if (negative_prompt) {
      input.negative_prompt = negative_prompt;
    }

    if (seed !== undefined) {
      input.seed = seed;
    }

    // --- Create prediction ---

    console.log('[character-variations] Creating prediction...');
    console.log(`[character-variations]   prompt: "${prompt}"`);
    console.log(`[character-variations]   number_of_outputs: ${number_of_outputs}`);
    console.log(`[character-variations]   output_format: ${output_format}`);
    console.log(`[character-variations]   output_quality: ${output_quality}`);
    if (seed !== undefined) {
      console.log(`[character-variations]   seed: ${seed}`);
    }

    const createResponse = await fetch(REPLICATE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        input,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      const detail =
        (errorData as { detail?: string }).detail ||
        createResponse.statusText;

      console.error(`[character-variations] Prediction create error (${createResponse.status}):`, detail);

      let errorCode = 'API_ERROR';
      if (createResponse.status === 401) {
        errorCode = 'INVALID_API_KEY';
      } else if (createResponse.status === 402) {
        errorCode = 'INSUFFICIENT_CREDITS';
      } else if (createResponse.status === 429) {
        errorCode = 'RATE_LIMITED';
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: `Replicate API error: ${detail}`,
          },
        },
        { status: createResponse.status >= 400 && createResponse.status < 500 ? 400 : 500 }
      );
    }

    const prediction = (await createResponse.json()) as ReplicatePrediction;
    console.log(`[character-variations] Prediction created: ${prediction.id}`);

    // --- Poll for completion (180s timeout) ---

    const startTime = Date.now();
    const result = await pollForCompletion(prediction.urls.get, apiKey, 180000);
    const elapsed = Date.now() - startTime;

    console.log(
      `[character-variations] Prediction completed in ${(elapsed / 1000).toFixed(1)}s — ${result.output?.length ?? 0} images`
    );

    if (!result.output || result.output.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_OUTPUT',
            message: 'Prediction succeeded but no output images were returned.',
          },
        },
        { status: 500 }
      );
    }

    // --- Convert all output URLs to base64 data URIs ---

    console.log(`[character-variations] Converting ${result.output.length} images to base64...`);

    const variations = await Promise.all(
      result.output.map((imageUrl) => urlToBase64(imageUrl))
    );

    console.log(`[character-variations] Done — returning ${variations.length} variations`);

    return NextResponse.json({
      success: true,
      variations,
    });
  } catch (error: unknown) {
    console.error('[character-variations] Error:', error);

    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    // Map known error messages to specific codes
    let code = 'INTERNAL_ERROR';
    if (message.includes('timed out')) {
      code = 'TIMEOUT';
    } else if (message.includes('canceled')) {
      code = 'PREDICTION_CANCELED';
    } else if (message.includes('Prediction failed') || message.includes('failed')) {
      code = 'PREDICTION_FAILED';
    } else if (message.includes('Model version not found')) {
      code = 'MODEL_NOT_FOUND';
    }

    const status = code === 'TIMEOUT' ? 504 : 500;

    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
        },
      },
      { status }
    );
  }
}
