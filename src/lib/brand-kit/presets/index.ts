import type { BrandStyleGuide } from '../types';

// Migrated presets (from Canvas prompt.ts BRAND_THEMES)
import { funnelists } from './funnelists';
import { salesforce } from './salesforce';
import { generalAi } from './general-ai';
import { blockchain } from './blockchain';
import { neutral } from './neutral';
import { minimal } from './minimal';
import { photorealistic } from './photorealistic';

// New industry presets
import { healthcare } from './healthcare';
import { finance } from './finance';
import { creative } from './creative';
import { ecommerce } from './ecommerce';
import { restaurant } from './restaurant';

export {
  funnelists,
  salesforce,
  generalAi,
  blockchain,
  neutral,
  minimal,
  photorealistic,
  healthcare,
  finance,
  creative,
  ecommerce,
  restaurant,
};

/** All available presets indexed by ID */
const ALL_PRESETS: Record<string, BrandStyleGuide> = {
  funnelists,
  salesforce,
  'general-ai': generalAi,
  blockchain,
  neutral,
  minimal,
  photorealistic,
  healthcare,
  finance,
  creative,
  ecommerce,
  restaurant,
};

/**
 * Legacy theme ID mapping.
 * Maps Canvas's old BrandTheme values to new preset IDs.
 */
const LEGACY_THEME_MAP: Record<string, string> = {
  'funnelists': 'funnelists',
  'salesforce': 'salesforce',
  'general_ai': 'general-ai',
  'blockchain': 'blockchain',
  'neutral': 'neutral',
  'minimal': 'minimal',
  'photorealistic': 'photorealistic',
};

/** Get all available presets */
export function getAllPresets(): BrandStyleGuide[] {
  return Object.values(ALL_PRESETS);
}

/** Get a preset by ID (supports both new and legacy IDs) */
export function getPreset(id: string): BrandStyleGuide | undefined {
  // Check direct match first
  if (ALL_PRESETS[id]) {
    return ALL_PRESETS[id];
  }
  // Check legacy mapping
  const mappedId = LEGACY_THEME_MAP[id];
  if (mappedId) {
    return ALL_PRESETS[mappedId];
  }
  return undefined;
}

/** Get all preset IDs */
export function getPresetIds(): string[] {
  return Object.keys(ALL_PRESETS);
}
