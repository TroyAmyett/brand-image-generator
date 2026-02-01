/**
 * Color utility functions for brand style guide processing.
 */

/** Parse a hex color string and return RGB components */
export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

/** Check if a string is a valid hex color */
export function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

/** Calculate relative luminance of a color (WCAG formula) */
export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;

  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate contrast ratio between two colors (WCAG 2.0) */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Determine if a color is light or dark */
export function isLightColor(hex: string): boolean {
  return relativeLuminance(hex) > 0.179;
}

/**
 * Extract unique hex colors from a CSS string.
 * Returns an array of lowercase hex colors.
 */
export function extractColorsFromCSS(css: string): string[] {
  const hexPattern = /#([0-9a-fA-F]{3,8})\b/g;
  const rgbPattern = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;

  const colors = new Set<string>();

  let match: RegExpExecArray | null;

  // Extract hex colors
  while ((match = hexPattern.exec(css)) !== null) {
    const hex = match[0].toLowerCase();
    // Only 3 or 6 digit hex (skip 8 digit alpha hex for simplicity)
    if (hex.length === 4 || hex.length === 7) {
      colors.add(hex);
    }
  }

  // Extract rgb() colors and convert to hex
  while ((match = rgbPattern.exec(css)) !== null) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    if (r <= 255 && g <= 255 && b <= 255) {
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      colors.add(hex);
    }
  }

  // Filter out pure black/white and very common neutral colors
  const neutrals = new Set(['#000000', '#000', '#ffffff', '#fff', '#f5f5f5', '#e5e5e5', '#333333', '#333', '#666666', '#666', '#999999', '#999', '#cccccc', '#ccc']);

  return Array.from(colors).filter((c) => !neutrals.has(c));
}

/**
 * Extract font families from a CSS string.
 * Returns an array of unique font family names.
 */
export function extractFontsFromCSS(css: string): string[] {
  const fontPattern = /font-family\s*:\s*([^;}]+)/gi;
  const fonts = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = fontPattern.exec(css)) !== null) {
    const familyStr = match[1].trim();
    // Split on comma and clean each font name
    const families = familyStr.split(',').map((f) =>
      f.trim().replace(/['"]/g, '')
    );

    for (const family of families) {
      // Skip generic font families
      const generics = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'inherit', 'initial', 'unset'];
      if (!generics.includes(family.toLowerCase()) && family.length > 0) {
        fonts.add(family);
      }
    }
  }

  return Array.from(fonts);
}
