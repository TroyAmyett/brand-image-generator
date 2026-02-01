import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '@/lib/apiKeyManager';
import { extractFromUrl } from '@funnelists/brand';

/**
 * POST /api/style-guides/extract-url
 * Extract brand identity from a website URL using AI analysis.
 * Body: { url: string, brandName?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, brandName } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'url is required and must be a string',
          },
        },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'url must be a valid URL',
          },
        },
        { status: 400 }
      );
    }

    // Get Anthropic API key
    const apiKey = await getApiKey('anthropic');
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message: 'Anthropic API key is not configured. Please add your API key in Settings.',
          },
        },
        { status: 401 }
      );
    }

    // Create Anthropic client and AI analysis functions
    const client = new Anthropic({ apiKey });

    const ai = {
      analyzeText: async (prompt: string, content: string): Promise<string> => {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nContent to analyze:\n${content}`,
            },
          ],
        });
        return (response.content[0] as { text: string }).text;
      },
      analyzeImage: async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                    data: imageBase64,
                  },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        });
        return (response.content[0] as { text: string }).text;
      },
    };

    // Run extraction
    const result = await extractFromUrl({
      url,
      ai,
      fetchFn: fetch,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: result.error || 'Failed to extract brand from URL',
          },
          rawData: result.rawData,
        },
        { status: 422 }
      );
    }

    // If brandName was provided, override the extracted name
    const guide = result.guide;
    if (guide && brandName) {
      guide.name = brandName;
    }

    // Add accountId for future account scoping
    const guideWithAccount = guide ? { ...guide, accountId: 'default' } : null;

    return NextResponse.json({
      success: true,
      guide: guideWithAccount,
      rawData: result.rawData,
    });
  } catch (error) {
    console.error('Error extracting brand from URL:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to extract brand from URL',
        },
      },
      { status: 500 }
    );
  }
}
