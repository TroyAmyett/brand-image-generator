/**
 * Showcase Motion Engine
 *
 * Pure, framework-free math for turning a single high-resolution showcase
 * still into a motion *frame sequence* (the hero-video pipeline's core).
 *
 * Two motion styles are supported by the pipeline:
 *
 *  1. "Ken Burns" (default) — render the effect ONCE per aspect at high res,
 *     then sweep a crop window across that still (zoom + pan) to emit frames.
 *     Cheap: one browser render, N cheap `sharp` extracts. This module owns
 *     the crop-window math (`planKenBurns`).
 *
 *  2. "Effect animation" (advanced) — re-render the effect every frame with
 *     interpolated settings (e.g. the tilt angle sweeps). This module owns the
 *     per-frame settings interpolation (`interpolateSettings`).
 *
 * Everything here is deterministic and dependency-free so it can be unit
 * tested and shared between the API route and the local orchestrator.
 */

export type EasingName = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

export interface Size {
  width: number;
  height: number;
}

export interface Vec2 {
  /** normalized focal center, 0..1 across the base image */
  x: number;
  y: number;
}

export interface KenBurnsSpec {
  /** crop-window zoom at the first frame (>= 1; 1 = whole image) */
  zoomFrom: number;
  /** crop-window zoom at the last frame */
  zoomTo: number;
  /** focal center at the first frame (normalized 0..1) */
  panFrom: Vec2;
  /** focal center at the last frame (normalized 0..1) */
  panTo: Vec2;
  easing: EasingName;
}

/** An integer pixel rectangle, ready to hand to `sharp.extract()`. */
export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FramePlanItem {
  /** zero-based frame index */
  index: number;
  /** linear progress 0..1 */
  t: number;
  /** eased progress 0..1 */
  eased: number;
  /** effective zoom applied to the crop window */
  zoom: number;
  /** crop rectangle in the BASE image's pixel space */
  crop: CropRect;
}

export interface KenBurnsPlan {
  frames: FramePlanItem[];
  base: Size;
  output: Size;
  fps: number;
  durationSec: number;
}

// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────

export const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  // Smooth, symmetric ease — the natural choice for a hero pan/zoom.
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Number of frames for a clip. Always >= 1. A 1-frame plan is a still.
 */
export function frameCount(durationSec: number, fps: number): number {
  return Math.max(1, Math.round(durationSec * fps));
}

// ─────────────────────────────────────────────────────────────
// Ken Burns crop-window math
// ─────────────────────────────────────────────────────────────

/**
 * Compute the crop rectangle for a given zoom + focal center.
 *
 * The window is `base / zoom` in size, centered on `center` (normalized),
 * then clamped so it never spills outside the base image. Returned values are
 * integers (pixel coordinates) so they can be fed straight to `sharp.extract`.
 */
export function computeCrop(base: Size, zoom: number, center: Vec2): CropRect {
  const z = Math.max(1, zoom);

  // Window size — never larger than the base image.
  const width = clamp(Math.round(base.width / z), 1, base.width);
  const height = clamp(Math.round(base.height / z), 1, base.height);

  const maxLeft = base.width - width;
  const maxTop = base.height - height;

  const left = clamp(Math.round(center.x * base.width - width / 2), 0, maxLeft);
  const top = clamp(Math.round(center.y * base.height - height / 2), 0, maxTop);

  return { left, top, width, height };
}

/**
 * Build the full per-frame crop plan for a Ken Burns motion over a still.
 */
export function planKenBurns(params: {
  base: Size;
  output: Size;
  durationSec: number;
  fps: number;
  spec: KenBurnsSpec;
}): KenBurnsPlan {
  const { base, output, durationSec, fps, spec } = params;
  const n = frameCount(durationSec, fps);
  const ease = EASINGS[spec.easing] ?? EASINGS.easeInOut;

  const frames: FramePlanItem[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const eased = ease(t);
    const zoom = lerp(spec.zoomFrom, spec.zoomTo, eased);
    const center: Vec2 = {
      x: lerp(spec.panFrom.x, spec.panTo.x, eased),
      y: lerp(spec.panFrom.y, spec.panTo.y, eased),
    };
    frames.push({ index: i, t, eased, zoom, crop: computeCrop(base, zoom, center) });
  }

  return { frames, base, output, fps, durationSec };
}

// ─────────────────────────────────────────────────────────────
// Motion presets
// ─────────────────────────────────────────────────────────────

const CENTER: Vec2 = { x: 0.5, y: 0.5 };

/**
 * Named camera moves. `zoomTo`/`zoomFrom` are crop-window zoom factors; pans
 * are normalized focal centers. Tuned to read well on a 16:9 / 9:16 hero.
 */
export const MOTION_PRESETS: Record<string, KenBurnsSpec> = {
  still: { zoomFrom: 1, zoomTo: 1, panFrom: CENTER, panTo: CENTER, easing: 'linear' },
  'zoom-in': { zoomFrom: 1.0, zoomTo: 1.18, panFrom: CENTER, panTo: CENTER, easing: 'easeInOut' },
  'zoom-out': { zoomFrom: 1.18, zoomTo: 1.0, panFrom: CENTER, panTo: CENTER, easing: 'easeInOut' },
  'pan-left': { zoomFrom: 1.12, zoomTo: 1.12, panFrom: { x: 0.66, y: 0.5 }, panTo: { x: 0.34, y: 0.5 }, easing: 'easeInOut' },
  'pan-right': { zoomFrom: 1.12, zoomTo: 1.12, panFrom: { x: 0.34, y: 0.5 }, panTo: { x: 0.66, y: 0.5 }, easing: 'easeInOut' },
  'pan-up': { zoomFrom: 1.12, zoomTo: 1.12, panFrom: { x: 0.5, y: 0.66 }, panTo: { x: 0.5, y: 0.34 }, easing: 'easeInOut' },
  'pan-down': { zoomFrom: 1.12, zoomTo: 1.12, panFrom: { x: 0.5, y: 0.34 }, panTo: { x: 0.5, y: 0.66 }, easing: 'easeInOut' },
  // Classic Ken Burns: slow push-in with a gentle diagonal drift.
  'ken-burns': { zoomFrom: 1.02, zoomTo: 1.16, panFrom: { x: 0.44, y: 0.56 }, panTo: { x: 0.56, y: 0.44 }, easing: 'easeInOut' },
};

export const DEFAULT_MOTION = 'ken-burns';

/**
 * The largest zoom a spec reaches — the orchestrator uses this to decide how
 * many extra pixels to render into the base still so even the most zoomed-in
 * frame still has >= output resolution to sample (no upscaling blur).
 */
export function maxZoom(spec: KenBurnsSpec): number {
  return Math.max(1, spec.zoomFrom, spec.zoomTo);
}

export function resolveMotion(name: string, overrides: Partial<KenBurnsSpec> = {}): KenBurnsSpec {
  const base = MOTION_PRESETS[name] ?? MOTION_PRESETS[DEFAULT_MOTION];
  return { ...base, ...overrides };
}

// ─────────────────────────────────────────────────────────────
// Effect-animation settings interpolation (advanced motion mode)
// ─────────────────────────────────────────────────────────────

/**
 * Interpolate between two effect-settings objects for a given progress `t`.
 *
 * Numeric fields are linearly interpolated (after easing); everything else
 * (strings, booleans — colors, flags, the `effect` discriminant) is taken from
 * the `to` object. Both objects are assumed to describe the same effect.
 */
export function interpolateSettings<T extends Record<string, unknown>>(
  from: T,
  to: T,
  t: number,
  easing: EasingName = 'easeInOut'
): T {
  const eased = (EASINGS[easing] ?? EASINGS.easeInOut)(clamp(t, 0, 1));
  const out: Record<string, unknown> = { ...to };

  for (const key of Object.keys(to)) {
    const a = from[key];
    const b = to[key];
    if (typeof a === 'number' && typeof b === 'number') {
      out[key] = lerp(a, b, eased);
    }
  }

  return out as T;
}
