/**
 * Logo-specific prompt templates for AI image generation.
 * Builds highly specialized prompts for generating professional logos.
 */

import { ImageProvider } from './providers/types';

export type LogoType =
  | 'icon_mark'
  | 'wordmark'
  | 'combination'
  | 'lettermark'
  | 'emblem'
  | 'abstract';

export type LogoStyle =
  | 'minimal'
  | 'modern'
  | 'vintage'
  | 'playful'
  | 'corporate'
  | 'geometric'
  | 'handdrawn';

// Human-readable labels for logo types
export const LOGO_TYPE_LABELS: Record<LogoType, string> = {
  icon_mark: 'Icon Mark',
  wordmark: 'Wordmark',
  combination: 'Combination Mark',
  lettermark: 'Lettermark',
  emblem: 'Emblem',
  abstract: 'Abstract Mark',
};

// Human-readable labels for logo styles
export const LOGO_STYLE_LABELS: Record<LogoStyle, string> = {
  minimal: 'Minimal',
  modern: 'Modern',
  vintage: 'Vintage',
  playful: 'Playful',
  corporate: 'Corporate',
  geometric: 'Geometric',
  handdrawn: 'Hand-drawn',
};

// Base templates for each logo type
const LOGO_TYPE_TEMPLATES: Record<LogoType, (brandName: string, description: string) => string> = {
  icon_mark: (brandName, description) =>
    `Minimalist icon mark logo, single symbolic icon representing ${description}. The icon captures the essence of "${brandName}" as a standalone graphic mark.`,
  wordmark: (brandName, description) =>
    `Typographic wordmark logo spelling out "${brandName}" in a distinctive custom typeface. The typography conveys ${description}. Focus on elegant letter spacing and unique character design.`,
  combination: (brandName, description) =>
    `Combination mark logo featuring both an icon and the text "${brandName}" arranged together. The icon represents ${description}. Text and icon are balanced and work as a unified mark.`,
  lettermark: (brandName, description) =>
    `Lettermark logo using the initials "${brandName.split(/\s+/).map(w => w[0]).join('').toUpperCase()}" from "${brandName}". The monogram is designed with ${description} in mind. Clean, memorable letter arrangement.`,
  emblem: (brandName, description) =>
    `Emblem-style logo with "${brandName}" enclosed in a badge, crest, or seal design. The emblem represents ${description}. Classic contained composition with text integrated into the shape.`,
  abstract: (brandName, description) =>
    `Abstract geometric logo mark using shapes and forms to represent ${description}. The abstract design captures the brand identity of "${brandName}" through pure visual composition without literal imagery.`,
};

// Style modifier strings
const LOGO_STYLE_MODIFIERS: Record<LogoStyle, string> = {
  minimal: 'ultra minimal, clean lines, simple geometry, maximum whitespace, reduced to essentials',
  modern: 'modern contemporary design, clean and bold, current design trends, sharp edges',
  vintage: 'vintage retro style, classic typography, distressed texture, heritage feel, timeless',
  playful: 'playful and fun, rounded shapes, friendly, approachable, vibrant energy',
  corporate: 'professional corporate, trustworthy, established, authoritative, refined',
  geometric: 'geometric precision, mathematical, structured, grid-based, symmetrical',
  handdrawn: 'hand-drawn organic style, artistic, unique, sketched quality, natural imperfections',
};

// Universal elements that should be in every logo prompt
const UNIVERSAL_LOGO_ELEMENTS = [
  'professional logo design',
  'vector graphic style',
  'flat design',
  'centered on pure white background',
  'high contrast',
  'scalable design',
  'clean crisp edges',
  'brand identity design',
];

// Negative prompts to avoid common logo generation issues
const NEGATIVE_PROMPT_ELEMENTS = [
  'photograph',
  'photorealistic',
  '3D render',
  '3D modeling',
  'realistic lighting',
  'shadows',
  'blurry',
  'pixelated',
  'low quality',
  'watermark',
  'busy background',
  'complex scene',
  'multiple logos',
  'text errors',
  'misspelled text',
  'wrong letters',
  'distorted text',
  'gradient background',
  'noisy',
  'artifacts',
  'mockup',
  'presentation',
  'frame',
  'border decoration',
];

/**
 * Build color instruction string from color overrides.
 */
function buildColorInstruction(colors: {
  primary?: string;
  secondary?: string;
  accent?: string;
}): string {
  const parts: string[] = [];
  if (colors.primary) parts.push(`primary color ${colors.primary}`);
  if (colors.secondary) parts.push(`secondary color ${colors.secondary}`);
  if (colors.accent) parts.push(`accent color ${colors.accent}`);
  if (parts.length === 0) return '';
  return `Color palette: ${parts.join(', ')}.`;
}

/**
 * Build a specialized logo generation prompt.
 *
 * @param params - Logo generation parameters
 * @returns Object with prompt and negativePrompt strings
 */
export function buildLogoPrompt(params: {
  brandName: string;
  description: string;
  logoType: LogoType;
  style: LogoStyle;
  colors?: { primary?: string; secondary?: string; accent?: string };
  refinement?: string;
  provider: ImageProvider;
}): { prompt: string; negativePrompt: string } {
  const { brandName, description, logoType, style, colors, refinement, provider } = params;

  // 1. Start with logo type template
  const typeTemplate = LOGO_TYPE_TEMPLATES[logoType](brandName, description);

  // 2. Add style modifier
  const styleModifier = LOGO_STYLE_MODIFIERS[style];

  // 3. Color instructions
  const colorInstruction = colors ? buildColorInstruction(colors) : '';

  // 4. Universal elements
  const universalStr = UNIVERSAL_LOGO_ELEMENTS.join(', ');

  // 5. Provider-specific adjustments
  let providerHint = '';
  if (provider === 'openai') {
    // DALL-E 3 benefits from detailed natural language
    providerHint = 'Render as a clean, flat vector-style illustration suitable for a logo. Single isolated design element on a white background.';
  } else if (provider === 'stability') {
    // Stability benefits from structured keywords
    providerHint = 'vector logo, flat color, isolated on white, SVG style, brand mark';
  } else if (provider === 'replicate') {
    // Replicate (Flux) handles well-structured prompts
    providerHint = 'clean vector logo design, flat minimal style, white background, professional branding';
  }

  // 6. Refinement instructions (if user is iterating)
  const refinementStr = refinement ? `Additional refinement: ${refinement}.` : '';

  // Compose the full prompt
  const promptParts = [
    typeTemplate,
    `Style: ${styleModifier}.`,
    colorInstruction,
    universalStr,
    providerHint,
    refinementStr,
  ].filter(Boolean);

  const prompt = promptParts.join(' ');

  // Build negative prompt
  const negativePrompt = NEGATIVE_PROMPT_ELEMENTS.join(', ');

  return { prompt, negativePrompt };
}
