/**
 * Screenshot Showcase Presets
 *
 * Pre-configured effect settings for common use cases.
 */

import type { ShowcasePreset, CascadeSettings, SpotlightSettings, TiltSettings, IsometricSettings } from './types';

// ─────────────────────────────────────────────────────────────
// Default Settings
// ─────────────────────────────────────────────────────────────

export const DEFAULT_CASCADE: CascadeSettings = {
  effect: 'cascade',
  perspective: 1200,
  rotateY: -15,
  rotateX: 4,
  panelSpacing: 60,
  depthOffset: 80,
  glowIntensity: 0.4,
  glowColor: '#0ea5e9',
  edgeBlur: true,
  background: '#0a0a0f',
};

export const DEFAULT_SPOTLIGHT: SpotlightSettings = {
  effect: 'spotlight',
  scale: 1.0,
  glowIntensity: 0.5,
  glowColor: '#0ea5e9',
  vignette: true,
  floatAnimation: true,
  background: '#0a0a0f',
};

export const DEFAULT_TILT: TiltSettings = {
  effect: 'tilt',
  rotateY: 12,
  rotateX: 0,
  perspective: 1000,
  glowIntensity: 0.3,
  glowColor: '#0ea5e9',
  shadowIntensity: 0.5,
  background: '#0a0a0f',
};

export const DEFAULT_ISOMETRIC: IsometricSettings = {
  effect: 'isometric',
  rotateX: 55,
  rotateZ: -45,
  stackOffset: 40,
  glowIntensity: 0.3,
  glowColor: '#0ea5e9',
  shadowIntensity: 0.6,
  background: '#0a0a0f',
};

// ─────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────

export const SHOWCASE_PRESETS: ShowcasePreset[] = [
  // Cascade Presets
  {
    id: 'linear-hero',
    name: 'Linear Hero',
    description: 'Classic Linear-style cascade with subtle tilt and cyan glow',
    effect: 'cascade',
    settings: DEFAULT_CASCADE,
    minImages: 2,
    maxImages: 5,
  },
  {
    id: 'dramatic-tilt',
    name: 'Dramatic Cascade',
    description: 'High-contrast cascade with deeper perspective and purple glow',
    effect: 'cascade',
    settings: {
      ...DEFAULT_CASCADE,
      perspective: 800,
      rotateY: -25,
      rotateX: 8,
      panelSpacing: 40,
      depthOffset: 120,
      glowIntensity: 0.6,
      glowColor: '#a855f7',
    },
    minImages: 2,
    maxImages: 5,
  },
  {
    id: 'subtle-depth',
    name: 'Subtle Depth',
    description: 'Minimal cascade with gentle depth for documentation',
    effect: 'cascade',
    settings: {
      ...DEFAULT_CASCADE,
      perspective: 2000,
      rotateY: -8,
      rotateX: 2,
      panelSpacing: 80,
      depthOffset: 40,
      glowIntensity: 0.2,
      edgeBlur: false,
    },
    minImages: 2,
    maxImages: 4,
  },

  // Spotlight Presets
  {
    id: 'spotlight-hero',
    name: 'Spotlight Hero',
    description: 'Dramatic spotlight with floating animation and vignette',
    effect: 'spotlight',
    settings: DEFAULT_SPOTLIGHT,
    minImages: 1,
    maxImages: 1,
  },
  {
    id: 'spotlight-minimal',
    name: 'Minimal Spotlight',
    description: 'Clean spotlight without animation, perfect for documentation',
    effect: 'spotlight',
    settings: {
      ...DEFAULT_SPOTLIGHT,
      scale: 0.9,
      glowIntensity: 0.2,
      glowColor: '#22c55e',
      vignette: false,
      floatAnimation: false,
    },
    minImages: 1,
    maxImages: 1,
  },
  {
    id: 'spotlight-intense',
    name: 'Intense Spotlight',
    description: 'High-glow spotlight for maximum drama',
    effect: 'spotlight',
    settings: {
      ...DEFAULT_SPOTLIGHT,
      scale: 1.1,
      glowIntensity: 0.8,
      glowColor: '#f97316',
    },
    minImages: 1,
    maxImages: 1,
  },

  // Tilt Presets
  {
    id: 'tilt-right',
    name: 'Tilt Right',
    description: 'Classic perspective tilt to the right',
    effect: 'tilt',
    settings: DEFAULT_TILT,
    minImages: 1,
    maxImages: 1,
  },
  {
    id: 'tilt-left',
    name: 'Tilt Left',
    description: 'Perspective tilt to the left',
    effect: 'tilt',
    settings: {
      ...DEFAULT_TILT,
      rotateY: -12,
    },
    minImages: 1,
    maxImages: 1,
  },
  {
    id: 'tilt-dramatic',
    name: 'Dramatic Tilt',
    description: 'Extreme perspective for bold presentations',
    effect: 'tilt',
    settings: {
      ...DEFAULT_TILT,
      rotateY: 25,
      rotateX: -5,
      perspective: 600,
      glowIntensity: 0.5,
      shadowIntensity: 0.8,
    },
    minImages: 1,
    maxImages: 1,
  },

  // Isometric Presets
  {
    id: 'isometric-stack',
    name: 'Isometric Stack',
    description: 'Classic isometric view showing layered screens',
    effect: 'isometric',
    settings: DEFAULT_ISOMETRIC,
    minImages: 2,
    maxImages: 4,
  },
  {
    id: 'isometric-reverse',
    name: 'Isometric Reverse',
    description: 'Isometric view from the opposite angle',
    effect: 'isometric',
    settings: {
      ...DEFAULT_ISOMETRIC,
      rotateZ: 45,
    },
    minImages: 2,
    maxImages: 4,
  },
  {
    id: 'isometric-flat',
    name: 'Isometric Flat',
    description: 'Flatter isometric with more visible content',
    effect: 'isometric',
    settings: {
      ...DEFAULT_ISOMETRIC,
      rotateX: 45,
      stackOffset: 30,
      glowIntensity: 0.2,
    },
    minImages: 2,
    maxImages: 4,
  },
];

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

export function getPresetsByEffect(effect: string): ShowcasePreset[] {
  return SHOWCASE_PRESETS.filter((p) => p.effect === effect);
}

export function getPresetById(id: string): ShowcasePreset | undefined {
  return SHOWCASE_PRESETS.find((p) => p.id === id);
}

export function getDefaultSettingsForEffect(effect: string) {
  switch (effect) {
    case 'cascade':
      return { ...DEFAULT_CASCADE };
    case 'spotlight':
      return { ...DEFAULT_SPOTLIGHT };
    case 'tilt':
      return { ...DEFAULT_TILT };
    case 'isometric':
      return { ...DEFAULT_ISOMETRIC };
    default:
      return { ...DEFAULT_CASCADE };
  }
}
