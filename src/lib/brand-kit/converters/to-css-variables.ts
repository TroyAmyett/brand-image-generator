/**
 * Convert a BrandStyleGuide to CSS custom properties.
 * Used for theming portals, help desks, and other Funnelists products.
 */

import type { BrandStyleGuide } from '../types';
import { isLightColor } from '../utils/color-utils';

export interface CssVariableSet {
  /** Map of CSS variable name to value */
  variables: Record<string, string>;
  /** CSS string ready to inject into :root or a scoped selector */
  cssText: string;
}

/**
 * Convert a BrandStyleGuide to CSS custom properties for theming.
 */
export function toCssVariables(guide: BrandStyleGuide): CssVariableSet {
  const variables: Record<string, string> = {};

  // Primary colors
  if (guide.colors.primary.length > 0) {
    variables['--brand-color-primary'] = guide.colors.primary[0].hex;
    if (guide.colors.primary.length > 1) {
      variables['--brand-color-primary-alt'] = guide.colors.primary[1].hex;
    }
  }

  // Secondary colors
  if (guide.colors.secondary.length > 0) {
    variables['--brand-color-secondary'] = guide.colors.secondary[0].hex;
  }

  // Accent colors
  if (guide.colors.accent.length > 0) {
    variables['--brand-color-accent'] = guide.colors.accent[0].hex;
  }

  // Background - extract hex if present, otherwise use as-is
  const bgHexMatch = guide.colors.background.match(/#[0-9a-fA-F]{3,6}/);
  if (bgHexMatch) {
    variables['--brand-color-bg'] = bgHexMatch[0];
    // Auto-detect text color based on background luminance
    variables['--brand-color-text'] = isLightColor(bgHexMatch[0]) ? '#111111' : '#ffffff';
  }

  // Typography
  if (guide.typography.headingFont) {
    variables['--brand-font-heading'] = `'${guide.typography.headingFont}', sans-serif`;
  }
  if (guide.typography.bodyFont) {
    variables['--brand-font-body'] = `'${guide.typography.bodyFont}', sans-serif`;
  }

  // Generate CSS text
  const lines = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  const cssText = `:root {\n${lines}\n}`;

  return { variables, cssText };
}
