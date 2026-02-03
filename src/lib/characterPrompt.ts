/**
 * Character-specific prompt templates for AI image generation.
 * Builds specialized prompts for photorealistic character portraits
 * optimized for HeyGen Avatar IV animation.
 */

// ---------------------------------------------------------------------------
// Setting options
// ---------------------------------------------------------------------------

export interface SettingOption {
  id: string;
  label: string;
  promptFragment: string;
}

export const SETTING_OPTIONS: SettingOption[] = [
  {
    id: 'studio',
    label: 'Studio',
    promptFragment: 'Professional studio background with soft gradient backdrop',
  },
  {
    id: 'coffee-shop',
    label: 'Coffee Shop',
    promptFragment: 'Cozy coffee shop interior background with warm bokeh lighting and blurred shelves',
  },
  {
    id: 'cafe-terrace',
    label: 'Café Terrace',
    promptFragment: 'Outdoor café terrace on a beautiful sunny day, soft natural sunlight, blurred greenery and street scene in background',
  },
  {
    id: 'office',
    label: 'Office',
    promptFragment: 'Modern office background with clean lines and soft natural window light',
  },
  {
    id: 'urban',
    label: 'Urban',
    promptFragment: 'Urban street background with soft-focus city architecture and natural daylight',
  },
  {
    id: 'custom',
    label: 'Custom',
    promptFragment: '', // filled in by customSettingDescription
  },
];

// ---------------------------------------------------------------------------
// Expression options
// ---------------------------------------------------------------------------

export interface ExpressionOption {
  id: string;
  label: string;
  promptFragment: string;
}

export const EXPRESSION_OPTIONS: ExpressionOption[] = [
  {
    id: 'neutral',
    label: 'Neutral',
    promptFragment: 'Neutral relaxed expression, mouth closed',
  },
  {
    id: 'slight-smile',
    label: 'Slight Smile',
    promptFragment: 'Subtle gentle closed-mouth smile, lips together',
  },
  {
    id: 'confident',
    label: 'Confident',
    promptFragment: 'Confident assured expression, mouth closed',
  },
  {
    id: 'warm',
    label: 'Warm',
    promptFragment: 'Warm approachable expression with a soft closed-mouth smile',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    promptFragment: 'Friendly open expression with a gentle closed-lip smile',
  },
  {
    id: 'determined',
    label: 'Determined',
    promptFragment: 'Determined focused expression with strong eye contact, mouth closed',
  },
];

// ---------------------------------------------------------------------------
// Negative prompt
// ---------------------------------------------------------------------------

const NEGATIVE_PROMPT_ELEMENTS = [
  'text',
  'words',
  'letters',
  'watermark',
  'logo',
  'illustration',
  'cartoon',
  'anime',
  'painting',
  'drawing',
  '3D render',
  'CGI',
  'low quality',
  'blurry',
  'deformed face',
  'extra fingers',
  'mutated hands',
  'visible hands',
  'hands near face',
  'open mouth',
  'teeth showing',
  'wide smile',
  'sunglasses',
  'hat covering face',
  'profile angle',
  'side view',
  'full body',
  'waist down',
  'busy background pattern',
  'multiple people',
  'collage',
  'split screen',
  'border',
  'frame',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findSetting(id: string): SettingOption | undefined {
  return SETTING_OPTIONS.find((o) => o.id === id);
}

function findExpression(id: string): ExpressionOption | undefined {
  return EXPRESSION_OPTIONS.find((o) => o.id === id);
}

// ---------------------------------------------------------------------------
// buildCharacterPrompt
// ---------------------------------------------------------------------------

export type AspectRatio = '16:9' | '9:16' | '1:1';

export const ASPECT_RATIO_OPTIONS: { id: AspectRatio; label: string; desc: string }[] = [
  { id: '16:9', label: 'Landscape 16:9', desc: 'Video production (default)' },
  { id: '9:16', label: 'Portrait 9:16', desc: 'Social / mobile' },
  { id: '1:1', label: 'Square 1:1', desc: 'Thumbnails / avatars' },
];

export interface CharacterPromptParams {
  description: string;
  setting: string;
  expression: string;
  outfitDescription: string;
  brandAccentColor?: string;
  customSettingDescription?: string;
  provider?: string;
  aspectRatio?: AspectRatio;
}

export interface CharacterPromptResult {
  prompt: string;
  negativePrompt: string;
}

/**
 * Build a specialized character portrait prompt optimized for
 * HeyGen Avatar IV animation.
 *
 * @param params - Character generation parameters
 * @returns Object with prompt and negativePrompt strings
 */
export function buildCharacterPrompt(params: CharacterPromptParams): CharacterPromptResult {
  const {
    description,
    setting,
    expression,
    outfitDescription,
    brandAccentColor = '#0ea5e9',
    customSettingDescription,
    provider,
    aspectRatio = '16:9',
  } = params;

  // Resolve setting fragment
  const settingOption = findSetting(setting);
  let settingFragment: string;
  if (setting === 'custom' && customSettingDescription) {
    settingFragment = customSettingDescription;
  } else if (settingOption && settingOption.promptFragment) {
    settingFragment = settingOption.promptFragment;
  } else {
    settingFragment = 'Professional studio background with soft gradient backdrop';
  }

  // Resolve expression fragment
  const expressionOption = findExpression(expression);
  const expressionFragment = expressionOption
    ? expressionOption.promptFragment
    : 'Neutral relaxed expression';

  // Provider-specific resolution tweak
  let resolutionTag = 'high resolution, 8K';
  let reinforcement = '';

  if (provider === 'stability') {
    // Stability: avoid "8K" which tends to introduce text artifacts
    resolutionTag = 'high resolution';
  }

  if (provider === 'openai') {
    reinforcement = 'photorealistic, professional photography, ';
  }

  // Framing depends on aspect ratio
  let framingFragment: string;
  if (aspectRatio === '16:9') {
    framingFragment = 'Head-and-shoulders landscape framing, face positioned in the left or center third of frame, hands not visible, mouth closed';
  } else if (aspectRatio === '1:1') {
    framingFragment = 'Tight head-and-shoulders square framing, face centered, hands not visible, mouth closed';
  } else {
    framingFragment = 'Chest-up portrait framing, face centered in frame, hands not visible, mouth closed';
  }

  // Compose the full prompt – description is repeated at start and end so the
  // model treats the physical appearance as the PRIMARY focus rather than
  // defaulting to a generic face under all the technical constraints.
  const outfitLine = outfitDescription ? `Wearing ${outfitDescription}.` : '';
  const promptParts = [
    `IMPORTANT — this person's unique physical appearance is: ${description}.`,
    `Photorealistic portrait photo of exactly this person: ${description}.`,
    `${settingFragment}. ${expressionFragment}, looking directly at camera with direct eye contact.`,
    outfitLine,
    `Dramatic lighting with subtle ${brandAccentColor} rim light on one side.`,
    `${reinforcement}${framingFragment}, sharp focus, ${resolutionTag}. NO text anywhere.`,
    `Remember: the subject is specifically ${description}. Render their unique facial features accurately.`,
  ].filter(Boolean);

  const prompt = promptParts.join('\n');

  // Negative prompt
  const negativePrompt = NEGATIVE_PROMPT_ELEMENTS.join(', ');

  return { prompt, negativePrompt };
}
