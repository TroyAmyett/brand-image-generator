/**
 * Extract brand identity from a website URL.
 *
 * Flow:
 * 1. Fetch the HTML of the target URL
 * 2. Parse CSS for colors, fonts, and logo references
 * 3. Extract metadata (title, description, OG tags)
 * 4. Use AI to analyze and produce a BrandStyleGuide
 */

import type { BrandStyleGuide } from '../types';
import type { UrlExtractorOptions, ExtractionResult, RawExtractionData } from './types';
import { extractColorsFromCSS, extractFontsFromCSS } from '../utils/color-utils';
import { slugify } from '../utils/validation';

/** Extract metadata and style information from HTML */
function parseHTML(html: string, url: string): RawExtractionData {
  const data: RawExtractionData = {};

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/si);
  if (titleMatch) {
    data.pageTitle = titleMatch[1].trim();
  }

  // Extract meta description
  const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/si)
    || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["']/si);
  if (metaDescMatch) {
    data.metaDescription = metaDescMatch[1].trim();
  }

  // Extract Open Graph data
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/si)
    || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["']/si);
  if (ogImageMatch) {
    data.ogImage = resolveUrl(ogImageMatch[1], url);
  }

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/si)
    || html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:title["']/si);
  if (ogTitleMatch) {
    data.ogTitle = ogTitleMatch[1].trim();
  }

  // Extract favicon/logo
  const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["'](.*?)["']/si)
    || html.match(/<link[^>]*href=["'](.*?)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/si);
  if (iconMatch) {
    data.logoUrl = resolveUrl(iconMatch[1], url);
  }

  // Extract inline and linked CSS colors
  const styleBlocks = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  const allCSS = styleBlocks.map((block) => {
    const content = block.replace(/<\/?style[^>]*>/gi, '');
    return content;
  }).join('\n');

  // Also extract inline style attributes
  const inlineStyles = html.match(/style=["'](.*?)["']/gi) || [];
  const inlineCSS = inlineStyles.map((s) => s.replace(/style=["']/i, '').replace(/["']$/, '')).join('\n');

  const combinedCSS = allCSS + '\n' + inlineCSS;

  data.cssColors = extractColorsFromCSS(combinedCSS);
  data.fonts = extractFontsFromCSS(combinedCSS);

  return data;
}

/** Resolve a potentially relative URL against a base URL */
function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/** Build the AI analysis prompt from raw extracted data */
function buildAnalysisPrompt(rawData: RawExtractionData, url: string): string {
  const sections: string[] = [];

  sections.push(`Analyze the following data extracted from ${url} and create a brand style guide.`);

  if (rawData.pageTitle) {
    sections.push(`Page Title: ${rawData.pageTitle}`);
  }
  if (rawData.ogTitle) {
    sections.push(`OG Title: ${rawData.ogTitle}`);
  }
  if (rawData.metaDescription) {
    sections.push(`Description: ${rawData.metaDescription}`);
  }
  if (rawData.cssColors && rawData.cssColors.length > 0) {
    sections.push(`Colors found in CSS: ${rawData.cssColors.join(', ')}`);
  }
  if (rawData.fonts && rawData.fonts.length > 0) {
    sections.push(`Fonts found: ${rawData.fonts.join(', ')}`);
  }
  if (rawData.logoUrl) {
    sections.push(`Logo/Favicon URL: ${rawData.logoUrl}`);
  }

  sections.push(`
Based on this data, create a JSON object with this exact structure:
{
  "name": "Brand name inferred from the website",
  "description": "Brief description of the brand's visual identity",
  "colors": {
    "primary": [{"hex": "#...", "name": "Color Name"}],
    "secondary": [{"hex": "#...", "name": "Color Name"}],
    "accent": [{"hex": "#...", "name": "Color Name"}],
    "forbidden": ["description of colors to avoid"],
    "background": "description of typical background"
  },
  "typography": {
    "headingFont": "font name or null",
    "bodyFont": "font name or null",
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

Pick the most prominent 2-3 colors for primary (not gray/white/black).
Infer secondary and accent colors from what's available.
Determine the visual mood and style from the overall aesthetic.
Return ONLY the JSON, no other text.`);

  return sections.join('\n\n');
}

/**
 * Extract brand identity from a website URL.
 */
export async function extractFromUrl(options: UrlExtractorOptions): Promise<ExtractionResult> {
  const { url, ai, fetchFn = fetch } = options;

  try {
    // Fetch the page HTML
    const response = await fetchFn(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FunnelBrandBot/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Parse HTML for raw data
    const rawData = parseHTML(html, url);

    // Build analysis prompt and send to AI
    const analysisPrompt = buildAnalysisPrompt(rawData, url);
    const aiResponse = await ai.analyzeText(
      'You are a brand identity analyst. Extract and organize brand visual identity data from website information.',
      analysisPrompt
    );

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
        rawData,
      };
    }

    // Build the style guide from parsed data
    const now = new Date().toISOString();
    const brandName = (parsed.name as string) || rawData.pageTitle || 'Untitled Brand';

    const guide: Partial<BrandStyleGuide> = {
      id: slugify(brandName),
      name: brandName,
      description: parsed.description as string,
      sourceUrl: url,
      logo: rawData.logoUrl ? { url: rawData.logoUrl } : undefined,
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
      rawData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    };
  }
}
