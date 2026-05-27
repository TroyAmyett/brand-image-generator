import { NextResponse } from 'next/server';
import sharp from 'sharp';
import type { Browser, Page } from 'puppeteer-core';
import { launchBrowser } from '@/lib/showcase/browser';
import type { ShowcaseEffect, EffectSettings } from '@/lib/showcase/types';

// Headless Chromium must run in the Node runtime (not Edge), and rendering a
// batch of frames can take a while.
export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const VALID_EFFECTS: ShowcaseEffect[] = ['cascade', 'spotlight', 'tilt', 'isometric'];
const VALID_FORMATS = ['png', 'webp', 'jpeg'] as const;
type OutputFormat = (typeof VALID_FORMATS)[number];

const DESIGN_SHORT_SIDE = 720; // CSS px of the design stage's shorter side
const MAX_DIMENSION = 8192;
const MAX_FRAMES = 300;
const READY_TIMEOUT_MS = 30_000;

interface RenderRequest {
  effect: ShowcaseEffect;
  images: string[]; // data: URLs or absolute http(s) URLs
  /** Single-frame render */
  settings?: EffectSettings;
  /** Batch render (effect-animation): one screenshot per settings object */
  frames?: EffectSettings[];
  width: number; // output px
  height: number; // output px
  format?: OutputFormat;
  quality?: number; // 1–100 for webp/jpeg
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/** Design-stage size + capture scale that yields exactly width×height. */
function computeStage(width: number, height: number) {
  const shortSide = Math.min(width, height);
  const scale = DESIGN_SHORT_SIDE / shortSide;
  const designWidth = Math.max(1, Math.round(width * scale));
  const designHeight = Math.max(1, Math.round(height * scale));
  // Capture at a device scale factor that reaches the target resolution.
  const deviceScaleFactor = Math.min(4, Math.max(1, width / designWidth));
  return { designWidth, designHeight, deviceScaleFactor };
}

async function encode(raw: Uint8Array, width: number, height: number, format: OutputFormat, quality: number) {
  const pipeline = sharp(Buffer.from(raw)).resize(width, height, { fit: 'fill' });
  if (format === 'webp') return { buffer: await pipeline.webp({ quality }).toBuffer(), mime: 'image/webp' };
  if (format === 'jpeg') return { buffer: await pipeline.jpeg({ quality }).toBuffer(), mime: 'image/jpeg' };
  return { buffer: await pipeline.png().toBuffer(), mime: 'image/png' };
}

/** Push a config into the page, wait for the ready flag, screenshot #stage. */
async function renderOneFrame(
  page: Page,
  config: { effect: ShowcaseEffect; images: string[]; settings: EffectSettings; designWidth: number; designHeight: number }
): Promise<Uint8Array> {
  await page.evaluate((cfg) => {
    document.documentElement.removeAttribute('data-showcase-ready');
    // `window.__SHOWCASE_CONFIG__` is declared globally by the render-frame page.
    window.__SHOWCASE_CONFIG__ = cfg;
    window.dispatchEvent(new Event('showcase:render'));
  }, config);

  await page.waitForSelector('html[data-showcase-ready="true"]', { timeout: READY_TIMEOUT_MS });

  const stage = await page.$('#stage');
  if (!stage) throw new Error('Render stage element not found');
  return (await stage.screenshot({ type: 'png', omitBackground: false })) as Uint8Array;
}

export async function POST(request: Request) {
  let body: RenderRequest;
  try {
    body = (await request.json()) as RenderRequest;
  } catch {
    return err('INVALID_JSON', 'Request body must be valid JSON.', 400);
  }

  const { effect, images, settings, frames, width, height } = body;
  const format: OutputFormat = VALID_FORMATS.includes(body.format as OutputFormat) ? (body.format as OutputFormat) : 'png';
  const quality = typeof body.quality === 'number' ? Math.min(100, Math.max(1, body.quality)) : 92;

  // ── Validation ───────────────────────────────────────────────
  if (!effect || !VALID_EFFECTS.includes(effect)) {
    return err('INVALID_EFFECT', `effect must be one of: ${VALID_EFFECTS.join(', ')}`, 400);
  }
  if (!Array.isArray(images) || images.length === 0) {
    return err('MISSING_IMAGES', 'images must be a non-empty array of data/http URLs.', 400);
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return err('INVALID_DIMENSIONS', 'width and height must be positive numbers.', 400);
  }
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    return err('DIMENSIONS_TOO_LARGE', `width/height must be <= ${MAX_DIMENSION}px.`, 400);
  }

  const settingsList: EffectSettings[] = Array.isArray(frames) && frames.length > 0 ? frames : settings ? [settings] : [];
  if (settingsList.length === 0) {
    return err('MISSING_SETTINGS', 'Provide `settings` (single frame) or `frames` (batch).', 400);
  }
  if (settingsList.length > MAX_FRAMES) {
    return err('TOO_MANY_FRAMES', `frames must be <= ${MAX_FRAMES} per request.`, 400);
  }

  const { designWidth, designHeight, deviceScaleFactor } = computeStage(Math.round(width), Math.round(height));
  const origin = new URL(request.url).origin;
  const renderUrl = `${origin}/showcase/render-frame`;

  let browser: Browser | null = null;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: designWidth, height: designHeight, deviceScaleFactor });
    await page.goto(renderUrl, { waitUntil: 'domcontentloaded' });

    const outputs: string[] = [];
    for (const s of settingsList) {
      const raw = await renderOneFrame(page, {
        effect,
        images,
        settings: s,
        designWidth,
        designHeight,
      });
      const { buffer, mime } = await encode(raw, Math.round(width), Math.round(height), format, quality);
      outputs.push(`data:${mime};base64,${buffer.toString('base64')}`);
    }

    const isBatch = Array.isArray(frames) && frames.length > 0;
    return NextResponse.json({
      success: true,
      ...(isBatch ? { images: outputs } : { image: outputs[0] }),
      metadata: {
        effect,
        width: Math.round(width),
        height: Math.round(height),
        format,
        frameCount: outputs.length,
        designWidth,
        designHeight,
        deviceScaleFactor,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[showcase/render] error:', msg, error);
    const code = /executable|Chrome|Chromium|browser/i.test(msg) ? 'BROWSER_LAUNCH_FAILED' : 'RENDER_ERROR';
    return err(code, `Showcase render failed: ${msg}`, 500);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
