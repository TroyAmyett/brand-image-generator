/**
 * Convert a BrandStyleGuide to the legacy BrandThemeDefinition format
 * used by Canvas's prompt.ts for backward compatibility.
 */

import type { BrandStyleGuide, LegacyBrandThemeDefinition } from '../types';

/**
 * Convert a BrandStyleGuide to the legacy theme format.
 * This allows new-format style guides to work with the existing prompt generation system.
 */
export function toLegacyTheme(guide: BrandStyleGuide): LegacyBrandThemeDefinition {
  return {
    name: guide.name,
    colors: {
      primary: guide.colors.primary.map((c) =>
        c.name ? `${c.name} ${c.hex}` : c.hex
      ),
      secondary: guide.colors.secondary.map((c) =>
        c.name ? `${c.name} ${c.hex}` : c.hex
      ),
      accent: guide.colors.accent.map((c) =>
        c.name ? `${c.name} ${c.hex}` : c.hex
      ),
      forbidden: guide.colors.forbidden,
      background: guide.colors.background,
    },
    styleKeywords: guide.visualStyle.styleKeywords,
    mood: guide.visualStyle.mood,
    visualStyle: guide.visualStyle.description,
    avoidKeywords: guide.visualStyle.avoidKeywords,
  };
}
