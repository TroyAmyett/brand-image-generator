/**
 * Extract brand identity from an uploaded image or PDF.
 * Uses AI vision to analyze visual elements and produce a BrandStyleGuide.
 */

import type { BrandStyleGuide } from '../types';
import type { ImageExtractorOptions, ExtractionResult } from './types';
import { slugify } from '../utils/validation';

/**
 * Extract brand identity from an image (logo, brand guide, screenshot, or PDF).
 */
export async function extractFromImage(options: ImageExtractorOptions): Promise<ExtractionResult> {
  const { imageData, mimeType, ai, brandName } = options;

  try {
    const prompt = `Analyze this image and extract brand visual identity information.
${brandName ? `The brand name is: ${brandName}` : 'Determine the brand name from the image if visible.'}

This might be:
- A logo image
- A brand guidelines document / PDF
- A website screenshot
- Marketing material

Extract all brand visual identity elements you can identify and return a JSON object with this exact structure:
{
  "name": "Brand name",
  "description": "Brief description of the brand's visual identity",
  "colors": {
    "primary": [{"hex": "#...", "name": "Color Name"}],
    "secondary": [{"hex": "#...", "name": "Color Name"}],
    "accent": [{"hex": "#...", "name": "Color Name"}],
    "forbidden": ["description of colors that would clash with this brand"],
    "background": "description of typical background"
  },
  "typography": {
    "headingFont": "font name if identifiable or null",
    "bodyFont": "font name if identifiable or null",
    "fontWeights": ["400", "700"]
  },
  "visualStyle": {
    "styleKeywords": ["keyword1", "keyword2"],
    "mood": ["mood1", "mood2"],
    "description": "overall visual style description",
    "avoidKeywords": ["avoid1", "avoid2"]
  },
  "industry": "inferred industry"
}

Identify specific hex colors from the image. For logos, extract the exact colors used.
For brand guidelines, extract all documented colors and fonts.
Return ONLY the JSON, no other text.`;

    const aiResponse = await ai.analyzeImage(prompt, imageData, mimeType);

    // Parse AI response
    let parsed: Record<string, unknown>;
    try {
      let jsonStr = aiResponse.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      return {
        success: false,
        error: 'Failed to parse AI response as JSON',
      };
    }

    // Build the style guide
    const now = new Date().toISOString();
    const name = brandName || (parsed.name as string) || 'Untitled Brand';

    const guide: Partial<BrandStyleGuide> = {
      id: slugify(name),
      name,
      description: parsed.description as string,
      colors: parsed.colors as BrandStyleGuide['colors'],
      typography: (parsed.typography as BrandStyleGuide['typography']) || {},
      visualStyle: parsed.visualStyle as BrandStyleGuide['visualStyle'],
      industry: parsed.industry as string,
      createdAt: now,
      updatedAt: now,
    };

    return {
      success: true,
      guide,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during image extraction',
    };
  }
}
