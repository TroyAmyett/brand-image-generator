/**
 * @funnelists/brand - Type Definitions
 *
 * Canonical data model for brand style guides shared across all Funnelists products.
 */

/** A single color entry with hex value and optional name */
export interface ColorEntry {
  /** Hex color value, e.g. "#0ea5e9" */
  hex: string;
  /** Human-readable name, e.g. "Sky Blue" */
  name?: string;
}

/** Brand color palette */
export interface BrandColors {
  /** Primary brand colors */
  primary: ColorEntry[];
  /** Secondary/supporting colors */
  secondary: ColorEntry[];
  /** Accent colors used sparingly */
  accent: ColorEntry[];
  /** Colors that must NOT be used (e.g. "no red", "no warm colors") */
  forbidden: string[];
  /** Background color description or hex */
  background: string;
}

/** Brand typography settings */
export interface BrandTypography {
  /** Primary heading font family */
  headingFont?: string;
  /** Body text font family */
  bodyFont?: string;
  /** Font weight preferences */
  fontWeights?: string[];
}

/** Brand logo information */
export interface BrandLogo {
  /** URL or data URI of the primary logo */
  url?: string;
  /** URL or data URI of the dark-background variant */
  darkUrl?: string;
  /** Description of what the logo looks like (for AI context) */
  description?: string;
}

/** Visual style directives for image/logo generation */
export interface BrandVisualStyle {
  /** Keywords describing the visual style, e.g. ["futuristic", "glowing neon"] */
  styleKeywords: string[];
  /** Mood descriptors, e.g. ["innovative", "professional"] */
  mood: string[];
  /** Overall visual style description for prompt generation */
  description: string;
  /** Keywords/elements to avoid in generation */
  avoidKeywords: string[];
}

/**
 * Complete brand style guide.
 * This is the canonical schema shared across all Funnelists products.
 */
export interface BrandStyleGuide {
  /** Unique identifier (slug) for this guide, e.g. "acme-corp" */
  id: string;
  /** Display name, e.g. "Acme Corporation" */
  name: string;
  /** Optional description or freeform notes */
  description?: string;
  /** Source URL if extracted from a website */
  sourceUrl?: string;
  /** Logo information */
  logo?: BrandLogo;
  /** Color palette */
  colors: BrandColors;
  /** Typography settings */
  typography: BrandTypography;
  /** Visual style directives for generation */
  visualStyle: BrandVisualStyle;
  /** Industry/vertical categorization */
  industry?: string;
  /** Custom metadata for extensibility */
  metadata?: Record<string, unknown>;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
}

/**
 * Legacy brand theme format used by Canvas's prompt.ts.
 * Used for backward compatibility via the toLegacyTheme converter.
 */
export interface LegacyBrandThemeDefinition {
  name: string;
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    forbidden: string[];
    background: string;
  };
  styleKeywords: string[];
  mood: string[];
  visualStyle: string;
  avoidKeywords: string[];
}
