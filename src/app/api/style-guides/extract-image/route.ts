import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '@/lib/apiKeyManager';
import { extractFromImage } from '@funnelists/brand';

/**
 * POST /api/style-guides/extract-image
 * Extract brand identity from an uploaded image using AI vision.
 * Accepts multipart form data with:
 * - image: File (required)
 * - brandName: string (optional)
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const brandName = formData.get('brandName') as string | null;

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_IMAGE',
            message: 'image file is required in the form data',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `Unsupported image type "${imageFile.type}". Supported types: ${validMimeTypes.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Convert image to base64
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const imageBase64 = imageBuffer.toString('base64');

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
      analyzeImage: async (prompt: string, imageBase64Data: string, mimeType: string): Promise<string> => {
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
                    data: imageBase64Data,
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
    const result = await extractFromImage({
      imageData: imageBase64,
      mimeType: imageFile.type,
      ai,
      brandName: brandName || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: result.error || 'Failed to extract brand from image',
          },
        },
        { status: 422 }
      );
    }

    // Add accountId for future account scoping
    const guideWithAccount = result.guide
      ? { ...result.guide, accountId: 'default' }
      : null;

    return NextResponse.json({
      success: true,
      guide: guideWithAccount,
    });
  } catch (error) {
    console.error('Error extracting brand from image:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to extract brand from image',
        },
      },
      { status: 500 }
    );
  }
}
