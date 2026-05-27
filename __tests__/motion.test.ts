import { describe, it, expect } from 'vitest';
import {
  EASINGS,
  clamp,
  lerp,
  frameCount,
  computeCrop,
  planKenBurns,
  maxZoom,
  resolveMotion,
  interpolateSettings,
  MOTION_PRESETS,
  type Size,
  type KenBurnsSpec,
} from '../src/lib/showcase/motion';

describe('primitives', () => {
  it('clamp bounds values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it('lerp endpoints and midpoint', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('easings are normalized at 0 and 1', () => {
    for (const fn of Object.values(EASINGS)) {
      expect(fn(0)).toBeCloseTo(0, 6);
      expect(fn(1)).toBeCloseTo(1, 6);
    }
  });

  it('frameCount is at least 1 and rounds', () => {
    expect(frameCount(0, 30)).toBe(1);
    expect(frameCount(4, 30)).toBe(120);
    expect(frameCount(2.0, 24)).toBe(48);
  });
});

describe('computeCrop', () => {
  const base: Size = { width: 1000, height: 1000 };

  it('zoom 1 covers the whole image', () => {
    const c = computeCrop(base, 1, { x: 0.5, y: 0.5 });
    expect(c).toEqual({ left: 0, top: 0, width: 1000, height: 1000 });
  });

  it('zoom 2 is a quarter-area centered window', () => {
    const c = computeCrop(base, 2, { x: 0.5, y: 0.5 });
    expect(c.width).toBe(500);
    expect(c.height).toBe(500);
    expect(c.left).toBe(250);
    expect(c.top).toBe(250);
  });

  it('clamps the window inside the image when panned to an edge', () => {
    const c = computeCrop(base, 2, { x: 1, y: 0 });
    // 500x500 window: max left = 500, top pinned to 0
    expect(c.left).toBe(500);
    expect(c.top).toBe(0);
    expect(c.left + c.width).toBeLessThanOrEqual(base.width);
    expect(c.top + c.height).toBeLessThanOrEqual(base.height);
  });

  it('never produces a window larger than the base or a zoom < 1', () => {
    const c = computeCrop(base, 0.25, { x: 0.5, y: 0.5 });
    expect(c.width).toBeLessThanOrEqual(base.width);
    expect(c.height).toBeLessThanOrEqual(base.height);
  });

  it('returns integer coordinates', () => {
    const c = computeCrop({ width: 1920, height: 1080 }, 1.137, { x: 0.43, y: 0.61 });
    for (const v of [c.left, c.top, c.width, c.height]) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('planKenBurns', () => {
  const base: Size = { width: 2304, height: 1296 }; // 1920x1080 * 1.2
  const output: Size = { width: 1920, height: 1080 };

  it('produces exactly duration*fps frames', () => {
    const plan = planKenBurns({ base, output, durationSec: 4, fps: 30, spec: MOTION_PRESETS['zoom-in'] });
    expect(plan.frames).toHaveLength(120);
    expect(plan.frames[0].index).toBe(0);
    expect(plan.frames[119].index).toBe(119);
  });

  it('first and last frames hit the spec endpoints', () => {
    const spec = MOTION_PRESETS['zoom-in'];
    const plan = planKenBurns({ base, output, durationSec: 1, fps: 10, spec });
    expect(plan.frames[0].zoom).toBeCloseTo(spec.zoomFrom, 5);
    expect(plan.frames.at(-1)!.zoom).toBeCloseTo(spec.zoomTo, 5);
    expect(plan.frames[0].t).toBe(0);
    expect(plan.frames.at(-1)!.t).toBe(1);
  });

  it('zoom-in monotonically shrinks the crop window', () => {
    const plan = planKenBurns({ base, output, durationSec: 2, fps: 30, spec: MOTION_PRESETS['zoom-in'] });
    for (let i = 1; i < plan.frames.length; i++) {
      expect(plan.frames[i].crop.width).toBeLessThanOrEqual(plan.frames[i - 1].crop.width);
    }
  });

  it('every crop stays within the base image', () => {
    const plan = planKenBurns({ base, output, durationSec: 3, fps: 30, spec: MOTION_PRESETS['ken-burns'] });
    for (const f of plan.frames) {
      expect(f.crop.left).toBeGreaterThanOrEqual(0);
      expect(f.crop.top).toBeGreaterThanOrEqual(0);
      expect(f.crop.left + f.crop.width).toBeLessThanOrEqual(base.width);
      expect(f.crop.top + f.crop.height).toBeLessThanOrEqual(base.height);
    }
  });

  it('a still spec yields a 1-frame plan with the full frame', () => {
    const plan = planKenBurns({ base, output, durationSec: 0, fps: 30, spec: MOTION_PRESETS['still'] });
    expect(plan.frames).toHaveLength(1);
    expect(plan.frames[0].crop).toEqual({ left: 0, top: 0, width: base.width, height: base.height });
  });
});

describe('maxZoom / resolveMotion', () => {
  it('maxZoom picks the larger endpoint', () => {
    expect(maxZoom(MOTION_PRESETS['zoom-in'])).toBeCloseTo(1.18);
    expect(maxZoom(MOTION_PRESETS['zoom-out'])).toBeCloseTo(1.18);
    expect(maxZoom(MOTION_PRESETS['still'])).toBe(1);
  });

  it('resolveMotion falls back to default for unknown names', () => {
    const spec = resolveMotion('does-not-exist');
    expect(spec).toEqual(MOTION_PRESETS['ken-burns']);
  });

  it('resolveMotion applies overrides', () => {
    const spec = resolveMotion('zoom-in', { zoomTo: 1.5 });
    expect(spec.zoomTo).toBe(1.5);
    expect(spec.zoomFrom).toBe(MOTION_PRESETS['zoom-in'].zoomFrom);
  });
});

describe('interpolateSettings', () => {
  const from = { effect: 'tilt', rotateY: -20, glowIntensity: 0.2, glowColor: '#0ea5e9', vignette: true };
  const to = { effect: 'tilt', rotateY: 20, glowIntensity: 0.6, glowColor: '#22c55e', vignette: false };

  it('interpolates numeric fields and keeps non-numeric from `to`', () => {
    const mid = interpolateSettings(from, to, 0.5, 'linear');
    expect(mid.rotateY).toBeCloseTo(0);
    expect(mid.glowIntensity).toBeCloseTo(0.4);
    expect(mid.glowColor).toBe('#22c55e');
    expect(mid.vignette).toBe(false);
    expect(mid.effect).toBe('tilt');
  });

  it('endpoints are exact under linear easing', () => {
    expect(interpolateSettings(from, to, 0, 'linear').rotateY).toBeCloseTo(-20);
    expect(interpolateSettings(from, to, 1, 'linear').rotateY).toBeCloseTo(20);
  });
});

describe('preset sanity', () => {
  it('all presets have valid zoom (>= 1) endpoints and normalized pans', () => {
    for (const [, spec] of Object.entries(MOTION_PRESETS) as [string, KenBurnsSpec][]) {
      expect(spec.zoomFrom).toBeGreaterThanOrEqual(1);
      expect(spec.zoomTo).toBeGreaterThanOrEqual(1);
      for (const p of [spec.panFrom, spec.panTo]) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
  });
});
