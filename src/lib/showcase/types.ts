/**
 * Screenshot Showcase Types
 *
 * Type definitions for the cinematic screenshot showcase feature.
 */

export type ShowcaseEffect = 'cascade' | 'spotlight' | 'tilt' | 'isometric';

export interface ShowcaseImage {
  id: string;
  dataUrl: string; // Base64 data URL
  order: number;
  label?: string;
  width?: number;
  height?: number;
}

// ─────────────────────────────────────────────────────────────
// Effect Settings
// ─────────────────────────────────────────────────────────────

export interface CascadeSettings {
  effect: 'cascade';
  perspective: number; // 400–2400, default 1200
  rotateY: number; // -40 to 40, default -15
  rotateX: number; // -20 to 20, default 4
  panelSpacing: number; // 0–200, default 60
  depthOffset: number; // 0–200, default 80
  glowIntensity: number; // 0–1, default 0.4
  glowColor: string; // hex, default #0ea5e9
  edgeBlur: boolean; // default true
  background: string; // hex, default #0a0a0f
}

export interface SpotlightSettings {
  effect: 'spotlight';
  scale: number; // 0.5–1.5, default 1
  glowIntensity: number; // 0–1, default 0.5
  glowColor: string; // hex, default #0ea5e9
  vignette: boolean; // default true
  floatAnimation: boolean; // default true
  background: string; // hex, default #0a0a0f
}

export interface TiltSettings {
  effect: 'tilt';
  rotateY: number; // -45 to 45, default 12
  rotateX: number; // -20 to 20, default 0
  perspective: number; // 400–2000, default 1000
  glowIntensity: number; // 0–1, default 0.3
  glowColor: string; // hex, default #0ea5e9
  shadowIntensity: number; // 0–1, default 0.5
  background: string; // hex, default #0a0a0f
}

export interface IsometricSettings {
  effect: 'isometric';
  rotateX: number; // 40–70, default 55
  rotateZ: number; // -60 to 60, default -45
  stackOffset: number; // 10–100, default 40
  glowIntensity: number; // 0–1, default 0.3
  glowColor: string; // hex, default #0ea5e9
  shadowIntensity: number; // 0–1, default 0.6
  background: string; // hex, default #0a0a0f
}

export type EffectSettings =
  | CascadeSettings
  | SpotlightSettings
  | TiltSettings
  | IsometricSettings;

// ─────────────────────────────────────────────────────────────
// Presets
// ─────────────────────────────────────────────────────────────

export interface ShowcasePreset {
  id: string;
  name: string;
  description: string;
  effect: ShowcaseEffect;
  settings: EffectSettings;
  minImages: number;
  maxImages: number;
}

// ─────────────────────────────────────────────────────────────
// Export Options
// ─────────────────────────────────────────────────────────────

export interface ExportOptions {
  width: number;
  height: number;
  format: 'png' | 'webp';
  quality: number; // 0–1
  scale: number; // 1 or 2 for retina
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  width: 1920,
  height: 1080,
  format: 'png',
  quality: 0.95,
  scale: 2,
};

// ─────────────────────────────────────────────────────────────
// Control Definitions (for dynamic UI generation)
// ─────────────────────────────────────────────────────────────

export interface SliderControlDef {
  type: 'slider';
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface ToggleControlDef {
  type: 'toggle';
  key: string;
  label: string;
}

export interface ColorControlDef {
  type: 'color';
  key: string;
  label: string;
}

export type ControlDef = SliderControlDef | ToggleControlDef | ColorControlDef;

export const EFFECT_CONTROLS: Record<ShowcaseEffect, ControlDef[]> = {
  cascade: [
    { type: 'slider', key: 'perspective', label: 'Perspective', min: 400, max: 2400, step: 50, unit: 'px' },
    { type: 'slider', key: 'rotateY', label: 'Rotate Y', min: -40, max: 40, step: 1, unit: '°' },
    { type: 'slider', key: 'rotateX', label: 'Rotate X', min: -20, max: 20, step: 1, unit: '°' },
    { type: 'slider', key: 'panelSpacing', label: 'Panel Spacing', min: 0, max: 200, step: 5, unit: 'px' },
    { type: 'slider', key: 'depthOffset', label: 'Depth Offset', min: 0, max: 200, step: 5, unit: 'px' },
    { type: 'slider', key: 'glowIntensity', label: 'Glow Intensity', min: 0, max: 1, step: 0.05 },
    { type: 'color', key: 'glowColor', label: 'Glow Color' },
    { type: 'toggle', key: 'edgeBlur', label: 'Edge Blur' },
    { type: 'color', key: 'background', label: 'Background' },
  ],
  spotlight: [
    { type: 'slider', key: 'scale', label: 'Scale', min: 0.5, max: 1.5, step: 0.05 },
    { type: 'slider', key: 'glowIntensity', label: 'Glow Intensity', min: 0, max: 1, step: 0.05 },
    { type: 'color', key: 'glowColor', label: 'Glow Color' },
    { type: 'toggle', key: 'vignette', label: 'Vignette' },
    { type: 'toggle', key: 'floatAnimation', label: 'Float Animation' },
    { type: 'color', key: 'background', label: 'Background' },
  ],
  tilt: [
    { type: 'slider', key: 'perspective', label: 'Perspective', min: 400, max: 2000, step: 50, unit: 'px' },
    { type: 'slider', key: 'rotateY', label: 'Rotate Y', min: -45, max: 45, step: 1, unit: '°' },
    { type: 'slider', key: 'rotateX', label: 'Rotate X', min: -20, max: 20, step: 1, unit: '°' },
    { type: 'slider', key: 'glowIntensity', label: 'Glow Intensity', min: 0, max: 1, step: 0.05 },
    { type: 'color', key: 'glowColor', label: 'Glow Color' },
    { type: 'slider', key: 'shadowIntensity', label: 'Shadow', min: 0, max: 1, step: 0.05 },
    { type: 'color', key: 'background', label: 'Background' },
  ],
  isometric: [
    { type: 'slider', key: 'rotateX', label: 'Rotate X', min: 40, max: 70, step: 1, unit: '°' },
    { type: 'slider', key: 'rotateZ', label: 'Rotate Z', min: -60, max: 60, step: 1, unit: '°' },
    { type: 'slider', key: 'stackOffset', label: 'Stack Offset', min: 10, max: 100, step: 5, unit: 'px' },
    { type: 'slider', key: 'glowIntensity', label: 'Glow Intensity', min: 0, max: 1, step: 0.05 },
    { type: 'color', key: 'glowColor', label: 'Glow Color' },
    { type: 'slider', key: 'shadowIntensity', label: 'Shadow', min: 0, max: 1, step: 0.05 },
    { type: 'color', key: 'background', label: 'Background' },
  ],
};
