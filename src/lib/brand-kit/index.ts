/**
 * @funnelists/brand
 *
 * Shared brand extraction and style guide management for Funnelists apps.
 *
 * Usage:
 * ```typescript
 * import { getPreset, toLegacyTheme, type BrandStyleGuide } from '@funnelists/brand';
 *
 * // Get a preset style guide
 * const guide = getPreset('funnelists');
 *
 * // Convert to legacy format for prompt generation
 * const legacyTheme = toLegacyTheme(guide);
 *
 * // Extract brand from a URL
 * import { extractFromUrl } from '@funnelists/brand/extractors';
 * const result = await extractFromUrl({ url: 'https://example.com', ai: myAiClient });
 *
 * // Convert to CSS variables for portal theming
 * import { toCssVariables } from '@funnelists/brand/converters';
 * const { cssText } = toCssVariables(guide);
 * ```
 */

// Types
export type {
  BrandStyleGuide,
  BrandColors,
  BrandTypography,
  BrandLogo,
  BrandVisualStyle,
  ColorEntry,
  LegacyBrandThemeDefinition,
} from './types';

// Presets
export {
  getAllPresets,
  getPreset,
  getPresetIds,
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
} from './presets';

// Converters
export { toLegacyTheme } from './converters/to-legacy-theme';
export { toCssVariables, type CssVariableSet } from './converters/to-css-variables';

// Extractors
export { extractFromUrl } from './extractors/url-extractor';
export { extractFromImage } from './extractors/image-extractor';
export type {
  AIAnalysisFunction,
  UrlExtractorOptions,
  ImageExtractorOptions,
  RawExtractionData,
  ExtractionResult,
} from './extractors/types';

// Utils
export {
  validateBrandStyleGuide,
  slugify,
  type ValidationResult,
} from './utils/validation';
export {
  isValidHex,
  parseHex,
  isLightColor,
  contrastRatio,
} from './utils/color-utils';
