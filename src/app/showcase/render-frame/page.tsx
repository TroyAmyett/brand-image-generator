'use client';

/**
 * Chromeless Showcase Render Frame
 *
 * This page is NOT part of the editor UI — it exists purely so the headless
 * browser (see `src/lib/showcase/browser.ts` + `/api/showcase/render`) can
 * render a single showcase effect at an exact state and screenshot it,
 * pixel-identical to the real effect components.
 *
 * Config is injected by the renderer before navigation as
 * `window.__SHOWCASE_CONFIG__`, or passed as `?c=<base64-json>` for manual
 * debugging in a normal browser tab.
 *
 * Readiness contract: once all images have decoded and one frame has painted,
 * we set `data-showcase-ready="true"` on <html>. The renderer waits for that
 * attribute, then screenshots the `#stage` element.
 */

import React, { useEffect, useState } from 'react';
import { CascadeEffect, SpotlightEffect, TiltEffect, IsometricEffect } from '@/components/showcase/effects';
import type {
  ShowcaseEffect,
  ShowcaseImage,
  EffectSettings,
  CascadeSettings,
  SpotlightSettings,
  TiltSettings,
  IsometricSettings,
} from '@/lib/showcase/types';

export interface RenderFrameConfig {
  effect: ShowcaseEffect;
  /** data: URLs or absolute http(s) URLs */
  images: string[];
  settings: EffectSettings;
  /** CSS pixel size of the design stage (resolution is applied via deviceScaleFactor at screenshot time) */
  designWidth: number;
  designHeight: number;
}

declare global {
  interface Window {
    __SHOWCASE_CONFIG__?: RenderFrameConfig;
  }
}

function readConfig(): RenderFrameConfig | null {
  if (typeof window === 'undefined') return null;
  if (window.__SHOWCASE_CONFIG__) return window.__SHOWCASE_CONFIG__;
  try {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    if (c) return JSON.parse(decodeURIComponent(escape(atob(c)))) as RenderFrameConfig;
  } catch {
    /* ignore malformed debug config */
  }
  return null;
}

function toShowcaseImages(urls: string[]): ShowcaseImage[] {
  return urls.map((dataUrl, i) => ({ id: `rf-${i}`, dataUrl, order: i }));
}

function renderEffect(config: RenderFrameConfig) {
  const images = toShowcaseImages(config.images);
  switch (config.effect) {
    case 'cascade':
      return <CascadeEffect images={images} settings={config.settings as CascadeSettings} />;
    case 'spotlight':
      return <SpotlightEffect images={images} settings={config.settings as SpotlightSettings} />;
    case 'tilt':
      return <TiltEffect images={images} settings={config.settings as TiltSettings} />;
    case 'isometric':
      return <IsometricEffect images={images} settings={config.settings as IsometricSettings} />;
    default:
      return null;
  }
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.complete && img.naturalWidth > 0) return;
      try {
        await img.decode();
      } catch {
        // decode() can reject for tainted/odd images; fall back to load event.
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }
    })
  );
}

export default function RenderFramePage() {
  const [config, setConfig] = useState<RenderFrameConfig | null>(null);

  // Read injected config after mount (avoids SSR hydration mismatch). The
  // renderer can also push a new config + dispatch `showcase:render` to render
  // additional frames on the same page (no reload — fast for batch/animation).
  useEffect(() => {
    const reread = () => setConfig(readConfig());
    reread();
    window.addEventListener('showcase:render', reread);
    return () => window.removeEventListener('showcase:render', reread);
  }, []);

  // Once the effect is in the DOM and images have decoded, signal readiness.
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    // Clear any previous ready flag so the renderer waits for THIS frame.
    document.documentElement.removeAttribute('data-showcase-ready');
    const stage = document.getElementById('stage');
    if (!stage) return;

    (async () => {
      await waitForImages(stage);
      // Two RAFs => guarantee the browser has painted the composited frame.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) document.documentElement.setAttribute('data-showcase-ready', 'true');
        })
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!config) return null;

  return (
    <>
      {/* Reset page chrome and freeze animations so captures are deterministic. */}
      <style>{`
        html, body { margin: 0; padding: 0; background: #0a0a0f; overflow: hidden; }
        #stage *, #stage *::before, #stage *::after {
          animation: none !important;
          transition: none !important;
        }
        /* Hide the Next.js dev-tools overlay so it can't leak into captures. */
        nextjs-portal,
        [data-next-badge-root],
        [data-nextjs-dev-tools-button],
        [data-nextjs-toast],
        #__next-build-watcher { display: none !important; }
      `}</style>
      <div
        id="stage"
        data-effect={config.effect}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${config.designWidth}px`,
          height: `${config.designHeight}px`,
          overflow: 'hidden',
          background: '#0a0a0f',
        }}
      >
        {renderEffect(config)}
      </div>
    </>
  );
}
