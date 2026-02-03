/**
 * Logo-specific prompt templates for AI image generation.
 * Builds highly specialized prompts for generating professional logos.
 */

import { ImageProvider } from './providers/types';

export type LogoType =
  | 'icon_only'
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
  icon_only: 'Icon Only',
  icon_mark: 'Icon Mark',
  wordmark: 'Wordmark',
  combination: 'Combination Mark',
  lettermark: 'Lettermark',
  emblem: 'Emblem',
  abstract: 'Abstract Mark',
};

// Tooltip descriptions for logo types
export const LOGO_TYPE_DESCRIPTIONS: Record<LogoType, string> = {
  icon_only: 'A single graphic symbol with NO text — just the icon (e.g., Apple\'s apple, Nike swoosh)',
  icon_mark: 'A standalone symbol or icon that represents the brand without text (e.g., Apple\'s apple, Twitter\'s bird)',
  wordmark: 'The brand name written in a distinctive, stylized typeface (e.g., Google, Coca-Cola)',
  combination: 'An icon paired with the brand name, working together as a unified mark (e.g., Adidas, Burger King)',
  lettermark: 'A monogram using the brand\'s initials (e.g., IBM, HBO, CNN)',
  emblem: 'Text enclosed within a badge, seal, or crest shape (e.g., Starbucks, Harley-Davidson)',
  abstract: 'A geometric or abstract shape that represents the brand conceptually (e.g., Pepsi, Airbnb)',
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

// Tooltip descriptions for logo styles
export const LOGO_STYLE_DESCRIPTIONS: Record<LogoStyle, string> = {
  minimal: 'Clean, simple design stripped to essentials with maximum whitespace',
  modern: 'Contemporary and bold, following current design trends with sharp edges',
  vintage: 'Retro-inspired with classic typography and a heritage, timeless feel',
  playful: 'Fun and friendly with rounded shapes and vibrant, approachable energy',
  corporate: 'Professional and trustworthy, conveying authority and refinement',
  geometric: 'Precise, mathematical shapes with structured, grid-based symmetry',
  handdrawn: 'Organic, artistic style with natural imperfections and sketched quality',
};

// Base templates for each logo type
// NOTE: icon_only deliberately omits brandName from the prompt to prevent models from rendering text
const LOGO_TYPE_TEMPLATES: Record<LogoType, (brandName: string, description: string) => string> = {
  icon_only: (_brandName, description) =>
    `A single, standalone iconic symbol. The symbol visually represents: ${description}. ` +
    `This is ONLY a graphic symbol — absolutely NO text, NO letters, NO words, NO typography, NO characters of any kind anywhere in the image. ` +
    `The symbol is a simple, bold, memorable shape centered on the canvas.`,
  icon_mark: (_brandName, description) =>
    `A single, standalone iconic symbol. The symbol visually represents: ${description}. ` +
    `This is ONLY a graphic symbol — absolutely NO text, NO letters, NO words, NO typography, NO characters of any kind anywhere in the image. ` +
    `The symbol is a simple, bold, memorable shape centered on the canvas.`,
  wordmark: (brandName, description) =>
    `Typographic wordmark logo spelling out "${brandName}" in a distinctive custom typeface. The typography conveys ${description}. Focus on elegant letter spacing and unique character design.`,
  combination: (brandName, description) =>
    `Combination mark logo featuring both an icon and the text "${brandName}" arranged together. The icon represents ${description}. Text and icon are balanced and work as a unified mark.`,
  lettermark: (brandName, description) =>
    `Lettermark logo using the initials "${brandName.split(/\s+/).map(w => w[0]).join('').toUpperCase()}" from "${brandName}". The monogram is designed with ${description} in mind. Clean, memorable letter arrangement.`,
  emblem: (brandName, description) =>
    `Emblem-style logo with "${brandName}" enclosed in a badge, crest, or seal design. The emblem represents ${description}. Classic contained composition with text integrated into the shape.`,
  abstract: (_brandName, description) =>
    `Abstract geometric logo mark using shapes and forms to represent ${description}. Pure visual composition without literal imagery — NO text, NO letters anywhere.`,
};

// Style modifier strings
const LOGO_STYLE_MODIFIERS: Record<LogoStyle, string> = {
  minimal: 'ultra minimal, clean lines, simple geometry, maximum whitespace, reduced to essentials',
  modern: 'modern contemporary design, clean and bold, current design trends, sharp edges',
  vintage: 'vintage retro style, heritage feel, timeless, aged aesthetic',
  playful: 'playful and fun, rounded shapes, friendly, approachable, vibrant energy',
  corporate: 'professional corporate, trustworthy, established, authoritative, refined',
  geometric: 'geometric precision, mathematical, structured, grid-based, symmetrical',
  handdrawn: 'hand-drawn organic style, artistic, unique, sketched quality, natural imperfections',
};

// Universal elements for standard logo prompts
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

// Stricter universal elements for icon-only generation
const UNIVERSAL_ICON_ELEMENTS = [
  'single icon centered on pure white background',
  'flat design, no 3D effects, no shadows, no gradients',
  'clean vector-style illustration',
  'no decorative elements around the icon',
  'no text of any kind anywhere',
  'professional brand identity symbol',
  'high contrast, crisp edges',
];

// Base negative prompts
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
  'gradient background',
  'noisy',
  'artifacts',
  'mockup',
  'presentation',
  'frame',
  'border decoration',
];

// Additional negative prompt terms for icon-only mode
const ICON_NEGATIVE_EXTRAS = [
  'text',
  'words',
  'letters',
  'typography',
  'writing',
  'alphabet',
  'company name',
  'brand name',
  'label',
  'caption',
  'title',
  'watermark text',
  'signature',
  'monogram',
  'initials',
  'decorative elements',
  'multiple icons',
  'icon grid',
  'icon row',
  '3D effects',
  'drop shadow',
  'glow effects',
  'colored background',
  'pattern background',
  'triangle pattern',
  'text errors',
  'misspelled text',
  'distorted text',
];

// Provider-specific hints for icon-only mode
const ICON_PROVIDER_HINTS: Record<string, string> = {
  openai:
    'Create a single flat vector icon on a plain white background. No text. No 3D. No shadows. One symbol only.',
  stability:
    'single flat vector icon, white background, no text, no shadow, brand symbol, centered',
  replicate:
    'single flat vector icon, plain white background, no text, no shadows, professional brand symbol',
};

// Provider-specific hints for standard logo mode
const STANDARD_PROVIDER_HINTS: Record<string, string> = {
  openai:
    'Render as a clean, flat vector-style illustration suitable for a logo. Single isolated design element on a white background.',
  stability: 'vector logo, flat color, isolated on white, SVG style, brand mark',
  replicate:
    'clean vector logo design, flat minimal style, white background, professional branding',
};

/**
 * Build color instruction string from color overrides.
 * Uses strong, emphatic language so image models treat colors as a hard constraint.
 */
function buildColorInstruction(colors: {
  primary?: string;
  secondary?: string;
  accent?: string;
}): string {
  const parts: string[] = [];
  if (colors.primary) parts.push(`primary color exactly ${colors.primary}`);
  if (colors.secondary) parts.push(`secondary color exactly ${colors.secondary}`);
  if (colors.accent) parts.push(`accent color exactly ${colors.accent}`);
  if (parts.length === 0) return '';
  return (
    `MANDATORY COLOR PALETTE: Use ONLY these colors — ${parts.join(', ')}. ` +
    `Plus pure white and pure black are allowed. ` +
    `FORBIDDEN: Do NOT use gold, brown, orange, yellow, red, pink, tan, beige, or ANY color not explicitly listed above. ` +
    `Every colored element in the design must use one of the specified hex values.`
  );
}

/**
 * Determine if a logo type is icon-only (no text).
 */
export function isIconOnlyType(logoType: LogoType): boolean {
  return logoType === 'icon_only' || logoType === 'icon_mark' || logoType === 'abstract';
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

  const iconOnly = isIconOnlyType(logoType);

  // 1. Start with logo type template
  const typeTemplate = LOGO_TYPE_TEMPLATES[logoType](brandName, description);

  // 2. Add style modifier
  const styleModifier = LOGO_STYLE_MODIFIERS[style];

  // 3. Color instructions
  const colorInstruction = colors ? buildColorInstruction(colors) : '';

  // 4. Universal elements (icon-specific or standard)
  const universalStr = (iconOnly ? UNIVERSAL_ICON_ELEMENTS : UNIVERSAL_LOGO_ELEMENTS).join(', ');

  // 5. Provider-specific adjustments
  const providerHint = (iconOnly ? ICON_PROVIDER_HINTS : STANDARD_PROVIDER_HINTS)[provider] || '';

  // 6. Refinement instructions (if user is iterating)
  const refinementStr = refinement
    ? `IMPORTANT MODIFICATION: Keep the overall design the same but apply this change — ${refinement}. Maintain the same layout, composition, and brand elements.`
    : '';

  // Compose the full prompt — refinement first (if any), then color early for emphasis
  const promptParts = refinement
    ? [refinementStr, typeTemplate, colorInstruction, `Style: ${styleModifier}.`, universalStr, providerHint]
    : [typeTemplate, colorInstruction, `Style: ${styleModifier}.`, universalStr, providerHint];

  const prompt = promptParts.filter(Boolean).join(' ');

  // Build negative prompt
  const negativeElements = [...NEGATIVE_PROMPT_ELEMENTS];

  // Add icon-only negatives (text, letters, etc.)
  if (iconOnly) {
    negativeElements.push(...ICON_NEGATIVE_EXTRAS);
  }

  // Add off-palette color negatives when overrides are specified
  if (colors && (colors.primary || colors.secondary || colors.accent)) {
    negativeElements.push('gold', 'orange', 'yellow', 'brown', 'red', 'pink', 'tan', 'beige', 'off-brand colors', 'random colors');
  }

  const negativePrompt = negativeElements.join(', ');

  return { prompt, negativePrompt };
}
