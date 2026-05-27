/**
 * Canvas Hero Showcase Pipeline
 * ─────────────────────────────
 * Turns a product screenshot into a polished hero-video frame sequence.
 *
 *   screenshot → [optional AI enhance] → showcase effect render →
 *   motion frame sequence (Ken Burns or effect-animation) →
 *   numbered PNG/WebP frames + manifest.json (+ optional ffmpeg preview)
 *
 * Runs LOCALLY against the Canvas dev server (`npm run dev`, port 3002) and
 * calls the same documented API the UI/agents use (`/api/showcase/render`,
 * and the existing enhance routes). Output frames import straight into any
 * video tool (Premiere/CapCut/Remotion/ffmpeg), or the first & last frames
 * serve as start/end keyframes for an AI image-to-video tool.
 *
 * Usage:
 *   npx tsx .claude/skills/canvas-hero-pipeline/pipeline.ts \
 *     --input ./shot.png --effect tilt --aspects 16:9,9:16 \
 *     --motion ken-burns --duration 4 --fps 30 --out ./hero-out --preview
 *
 * Run with --help for the full flag list.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

import {
  planKenBurns,
  resolveMotion,
  maxZoom,
  interpolateSettings,
  MOTION_PRESETS,
  DEFAULT_MOTION,
  frameCount,
} from '../../../src/lib/showcase/motion.ts';
import {
  getDefaultSettingsForEffect,
  getPresetById,
} from '../../../src/lib/showcase/presets.ts';
import type { ShowcaseEffect, EffectSettings } from '../../../src/lib/showcase/types.ts';

// ─────────────────────────────────────────────────────────────
// Args
// ─────────────────────────────────────────────────────────────

interface Args {
  input: string[];
  effect: ShowcaseEffect;
  preset?: string;
  aspects: string[];
  motion: string;
  mode: 'kenburns' | 'effect';
  duration: number;
  fps: number;
  out: string;
  server: string;
  format: 'png' | 'webp' | 'jpeg';
  quality: number;
  enhance?: string; // transformation mode for /api/generate-img2img, if set
  enhanceStrength: number;
  preview: boolean;
  help: boolean;
}

const ASPECTS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
};

function parseArgs(argv: string[]): Args {
  const get = (name: string, def?: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    if (i === -1) return def;
    const v = argv[i + 1];
    return v && !v.startsWith('--') ? v : def;
  };
  const has = (name: string) => argv.includes(`--${name}`);

  const effect = (get('effect', 'tilt') || 'tilt') as ShowcaseEffect;
  return {
    input: (get('input', '') || '').split(',').map((s) => s.trim()).filter(Boolean),
    effect,
    preset: get('preset'),
    aspects: (get('aspects', '16:9,9:16') || '16:9,9:16')
      .split(',')
      .map((s) => s.trim().replace('x', ':'))
      .filter(Boolean),
    motion: get('motion', DEFAULT_MOTION) || DEFAULT_MOTION,
    mode: (get('mode', 'kenburns') as Args['mode']) || 'kenburns',
    duration: Number(get('duration', '4')),
    fps: Number(get('fps', '30')),
    out: get('out', './hero-out') || './hero-out',
    server: (get('server', 'http://localhost:3002') || 'http://localhost:3002').replace(/\/$/, ''),
    format: (get('format', 'png') as Args['format']) || 'png',
    quality: Number(get('quality', '92')),
    enhance: has('enhance') ? get('enhance', 'enhance_brand') || 'enhance_brand' : undefined,
    enhanceStrength: Number(get('enhance-strength', '45')),
    preview: has('preview'),
    help: has('help') || has('h'),
  };
}

const HELP = `
Canvas Hero Showcase Pipeline

  --input <paths>        Screenshot(s), comma-separated file paths or URLs (required)
  --effect <name>        cascade | spotlight | tilt | isometric   (default: tilt)
  --preset <id>          Showcase preset id (e.g. tilt-right, spotlight-hero)
  --aspects <list>       Comma list: 16:9,9:16,1:1,4:5            (default: 16:9,9:16)
  --motion <name>        ${Object.keys(MOTION_PRESETS).join(' | ')}
                                                                  (default: ${DEFAULT_MOTION})
  --mode <kenburns|effect>  Motion style                          (default: kenburns)
  --duration <sec>       Clip length in seconds                   (default: 4)
  --fps <n>              Frames per second                        (default: 30)
  --format <png|webp|jpeg>  Frame format                          (default: png)
  --quality <1-100>      webp/jpeg quality                        (default: 92)
  --enhance [mode]       AI-enhance the screenshot first via /api/generate-img2img
                         (style_transfer | reimagine | enhance_brand) — needs API key
  --enhance-strength <0-100>  Style strength when enhancing       (default: 45)
  --out <dir>            Output directory                         (default: ./hero-out)
  --server <url>         Canvas dev server                        (default: http://localhost:3002)
  --preview              Assemble an ffmpeg preview clip per aspect (needs ffmpeg)
  --help                 Show this help
`;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

async function loadAsDataUrl(src: string): Promise<string> {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to fetch ${src}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type')?.split(';')[0] || 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
  if (src.startsWith('data:')) return src;
  const buf = await fs.readFile(src);
  const mime = MIME[path.extname(src).toLowerCase()] || 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const b64 = dataUrl.split(',')[1] ?? '';
  return Buffer.from(b64, 'base64');
}

/** Bump the subject scale for portrait/square so it fills the taller frame. */
function adaptSettings(base: EffectSettings, width: number, height: number): EffectSettings {
  const portrait = height > width;
  const square = height === width;
  const boost = portrait ? 1.45 : square ? 1.15 : 1;
  if (boost === 1) return base;
  const s = { ...base } as Record<string, unknown>;
  const key = base.effect === 'spotlight' ? 'scale' : 'imageScale';
  if (typeof s[key] === 'number') s[key] = Math.min(2, (s[key] as number) * boost);
  return s as EffectSettings;
}

function resolveBaseSettings(effect: ShowcaseEffect, preset?: string): EffectSettings {
  if (preset) {
    const p = getPresetById(preset);
    if (!p) throw new Error(`Unknown preset "${preset}"`);
    return p.settings;
  }
  return getDefaultSettingsForEffect(effect) as EffectSettings;
}

interface RenderResp {
  success: boolean;
  image?: string;
  images?: string[];
  error?: { code: string; message: string };
}

async function callRender(server: string, payload: Record<string, unknown>): Promise<RenderResp> {
  const res = await fetch(`${server}/api/showcase/render`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as RenderResp;
  if (!res.ok || !json.success) {
    throw new Error(`render failed (${res.status}): ${json.error?.message || 'unknown error'}`);
  }
  return json;
}

async function enhance(server: string, dataUrl: string, mode: string, strength: number): Promise<string> {
  const res = await fetch(`${server}/api/generate-img2img`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sourceImage: dataUrl, transformationMode: mode, styleStrength: strength }),
  });
  const json = (await res.json()) as { success: boolean; styledImage?: string; error?: { message: string } };
  if (!res.ok || !json.success || !json.styledImage) {
    throw new Error(`enhance failed (${res.status}): ${json.error?.message || 'unknown error'}`);
  }
  return json.styledImage;
}

const frameName = (i: number, ext: string) => `frame_${String(i + 1).padStart(4, '0')}.${ext}`;

function buildPreview(dir: string, fps: number, ext: string, width: number, height: number): string | null {
  // Even dimensions required for yuv420p H.264.
  const w = width % 2 === 0 ? width : width - 1;
  const h = height % 2 === 0 ? height : height - 1;
  const out = path.join(dir, 'preview.mp4');
  const r = spawnSync(
    'ffmpeg',
    [
      '-y', '-framerate', String(fps), '-start_number', '1',
      '-i', path.join(dir, `frame_%04d.${ext}`),
      '-vf', `scale=${w}:${h}`,
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      out,
    ],
    { encoding: 'utf-8' }
  );
  if (r.status !== 0) {
    console.warn(`  ⚠ ffmpeg preview skipped (${r.error ? r.error.message : 'non-zero exit'})`);
    return null;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// Per-aspect rendering
// ─────────────────────────────────────────────────────────────

async function renderAspectKenBurns(opts: {
  server: string;
  effect: ShowcaseEffect;
  images: string[];
  settings: EffectSettings;
  width: number;
  height: number;
  motionName: string;
  duration: number;
  fps: number;
  outDir: string;
  format: Args['format'];
  quality: number;
}) {
  const spec = resolveMotion(opts.motionName);
  const overscan = maxZoom(spec);
  const baseW = Math.round(opts.width * overscan);
  const baseH = Math.round(opts.height * overscan);

  // 1 browser render of the effect at overscan resolution.
  const resp = await callRender(opts.server, {
    effect: opts.effect,
    images: opts.images,
    settings: opts.settings,
    width: baseW,
    height: baseH,
    format: 'png',
  });
  const baseBuf = dataUrlToBuffer(resp.image!);

  const plan = planKenBurns({
    base: { width: baseW, height: baseH },
    output: { width: opts.width, height: opts.height },
    durationSec: opts.duration,
    fps: opts.fps,
    spec,
  });

  // Cheap sharp crops per frame.
  for (const f of plan.frames) {
    const pipeline = sharp(baseBuf)
      .extract({ left: f.crop.left, top: f.crop.top, width: f.crop.width, height: f.crop.height })
      .resize(opts.width, opts.height, { fit: 'fill' });
    const out = path.join(opts.outDir, frameName(f.index, opts.format));
    if (opts.format === 'webp') await pipeline.webp({ quality: opts.quality }).toFile(out);
    else if (opts.format === 'jpeg') await pipeline.jpeg({ quality: opts.quality }).toFile(out);
    else await pipeline.png().toFile(out);
  }
  return plan.frames.length;
}

/** Auto-generate a gentle settings sweep for effect-animation mode. */
function buildSweep(settings: EffectSettings): { from: EffectSettings; to: EffectSettings } {
  const s = settings as Record<string, number | string | boolean>;
  const from = { ...s };
  const to = { ...s };
  switch (settings.effect) {
    case 'tilt':
    case 'cascade':
      from.rotateY = (s.rotateY as number) - 6;
      to.rotateY = (s.rotateY as number) + 6;
      break;
    case 'spotlight':
      from.scale = (s.scale as number) * 0.98;
      to.scale = (s.scale as number) * 1.06;
      break;
    case 'isometric':
      from.rotateZ = (s.rotateZ as number) - 5;
      to.rotateZ = (s.rotateZ as number) + 5;
      break;
  }
  return { from: from as EffectSettings, to: to as EffectSettings };
}

async function renderAspectEffectAnim(opts: {
  server: string;
  effect: ShowcaseEffect;
  images: string[];
  settings: EffectSettings;
  width: number;
  height: number;
  duration: number;
  fps: number;
  outDir: string;
  format: Args['format'];
  quality: number;
}) {
  const n = frameCount(opts.duration, opts.fps);
  const { from, to } = buildSweep(opts.settings);
  const frames: EffectSettings[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    frames.push(interpolateSettings(from as Record<string, unknown>, to as Record<string, unknown>, t) as EffectSettings);
  }

  const resp = await callRender(opts.server, {
    effect: opts.effect,
    images: opts.images,
    frames,
    width: opts.width,
    height: opts.height,
    format: opts.format,
    quality: opts.quality,
  });

  const imgs = resp.images || [];
  for (let i = 0; i < imgs.length; i++) {
    await fs.writeFile(path.join(opts.outDir, frameName(i, opts.format)), dataUrlToBuffer(imgs[i]));
  }
  return imgs.length;
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP);
    return;
  }
  if (args.input.length === 0) {
    console.error('Error: --input is required.\n' + HELP);
    process.exit(1);
  }

  const t0 = Date.now();
  console.log(`\n🎬 Canvas Hero Pipeline`);
  console.log(`   effect=${args.effect}${args.preset ? ` preset=${args.preset}` : ''} mode=${args.mode} motion=${args.motion}`);
  console.log(`   ${args.duration}s @ ${args.fps}fps · aspects=${args.aspects.join(',')} · format=${args.format}`);

  // 1. Ingest
  let images = await Promise.all(args.input.map(loadAsDataUrl));
  console.log(`   ✓ loaded ${images.length} screenshot(s)`);

  // 2. Optional enhance
  if (args.enhance) {
    console.log(`   ↻ enhancing via /api/generate-img2img (mode=${args.enhance}, strength=${args.enhanceStrength})…`);
    images = await Promise.all(images.map((d) => enhance(args.server, d, args.enhance!, args.enhanceStrength)));
    console.log(`   ✓ enhanced`);
  }

  const baseSettings = resolveBaseSettings(args.effect, args.preset);
  await fs.mkdir(args.out, { recursive: true });

  const manifestAspects: Array<Record<string, unknown>> = [];

  // 3–5. Render + motion + package, per aspect
  for (const aspectKey of args.aspects) {
    const dim = ASPECTS[aspectKey];
    if (!dim) {
      console.warn(`   ⚠ unknown aspect "${aspectKey}" — skipping (known: ${Object.keys(ASPECTS).join(', ')})`);
      continue;
    }
    const dirName = aspectKey.replace(':', 'x');
    const outDir = path.join(args.out, dirName);
    await fs.mkdir(outDir, { recursive: true });

    const settings = adaptSettings(baseSettings, dim.width, dim.height);
    console.log(`   → ${aspectKey} (${dim.width}×${dim.height}) …`);

    const frames =
      args.mode === 'effect'
        ? await renderAspectEffectAnim({ server: args.server, effect: args.effect, images, settings, width: dim.width, height: dim.height, duration: args.duration, fps: args.fps, outDir, format: args.format, quality: args.quality })
        : await renderAspectKenBurns({ server: args.server, effect: args.effect, images, settings, width: dim.width, height: dim.height, motionName: args.motion, duration: args.duration, fps: args.fps, outDir, format: args.format, quality: args.quality });

    let preview: string | null = null;
    if (args.preview) preview = buildPreview(outDir, args.fps, args.format, dim.width, dim.height);

    console.log(`     ✓ ${frames} frames${preview ? ' + preview.mp4' : ''} → ${path.relative(process.cwd(), outDir)}`);

    manifestAspects.push({
      name: aspectKey,
      width: dim.width,
      height: dim.height,
      dir: dirName,
      frames,
      framePattern: `frame_%04d.${args.format}`,
      preview: preview ? path.basename(preview) : null,
    });
  }

  // 6. Manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    tool: 'canvas-hero-pipeline',
    input: args.input,
    enhanced: Boolean(args.enhance),
    effect: args.effect,
    preset: args.preset || null,
    motionMode: args.mode,
    motion: args.mode === 'kenburns' ? args.motion : 'effect-sweep',
    durationSec: args.duration,
    fps: args.fps,
    format: args.format,
    aspects: manifestAspects,
  };
  await fs.writeFile(path.join(args.out, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Done in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${path.relative(process.cwd(), args.out)}/manifest.json\n`);
}

main().catch((e) => {
  console.error(`\n❌ ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
