/**
 * Validation utilities for BrandStyleGuide objects.
 */

import type { BrandStyleGuide, ColorEntry } from '../types';
import { isValidHex } from './color-utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a ColorEntry array */
function validateColorEntries(entries: unknown, fieldName: string, errors: string[]): entries is ColorEntry[] {
  if (!Array.isArray(entries)) {
    errors.push(`${fieldName} must be an array`);
    return false;
  }
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (typeof entry !== 'object' || entry === null) {
      errors.push(`${fieldName}[${i}] must be an object`);
      continue;
    }
    if (typeof (entry as ColorEntry).hex !== 'string') {
      errors.push(`${fieldName}[${i}].hex must be a string`);
    } else if (!isValidHex((entry as ColorEntry).hex)) {
      errors.push(`${fieldName}[${i}].hex "${(entry as ColorEntry).hex}" is not a valid hex color`);
    }
  }
  return true;
}

/**
 * Validate a BrandStyleGuide object.
 * Returns validation result with specific error messages.
 */
export function validateBrandStyleGuide(guide: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof guide !== 'object' || guide === null) {
    return { valid: false, errors: ['Style guide must be an object'] };
  }

  const g = guide as Record<string, unknown>;

  // Required string fields
  if (typeof g.id !== 'string' || g.id.length === 0) {
    errors.push('id is required and must be a non-empty string');
  }
  if (typeof g.name !== 'string' || g.name.length === 0) {
    errors.push('name is required and must be a non-empty string');
  }

  // Colors
  if (typeof g.colors !== 'object' || g.colors === null) {
    errors.push('colors is required and must be an object');
  } else {
    const colors = g.colors as Record<string, unknown>;
    validateColorEntries(colors.primary, 'colors.primary', errors);
    validateColorEntries(colors.secondary, 'colors.secondary', errors);
    validateColorEntries(colors.accent, 'colors.accent', errors);

    if (!Array.isArray(colors.forbidden)) {
      errors.push('colors.forbidden must be an array');
    }
    if (typeof colors.background !== 'string') {
      errors.push('colors.background must be a string');
    }
  }

  // Visual style
  if (typeof g.visualStyle !== 'object' || g.visualStyle === null) {
    errors.push('visualStyle is required and must be an object');
  } else {
    const vs = g.visualStyle as Record<string, unknown>;
    if (!Array.isArray(vs.styleKeywords)) {
      errors.push('visualStyle.styleKeywords must be an array');
    }
    if (!Array.isArray(vs.mood)) {
      errors.push('visualStyle.mood must be an array');
    }
    if (typeof vs.description !== 'string') {
      errors.push('visualStyle.description must be a string');
    }
    if (!Array.isArray(vs.avoidKeywords)) {
      errors.push('visualStyle.avoidKeywords must be an array');
    }
  }

  // Typography (optional but must be object if present)
  if (g.typography !== undefined && (typeof g.typography !== 'object' || g.typography === null)) {
    errors.push('typography must be an object if provided');
  }

  // Timestamps
  if (typeof g.createdAt !== 'string') {
    errors.push('createdAt is required and must be a string');
  }
  if (typeof g.updatedAt !== 'string') {
    errors.push('updatedAt is required and must be a string');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Create a slug from a string (for use as style guide ID).
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
