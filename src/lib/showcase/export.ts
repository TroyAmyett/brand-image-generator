/**
 * Screenshot Showcase Export Utilities
 *
 * Handles PNG/WebP export via html2canvas and CSS snippet generation.
 */

import type { EffectSettings, ExportOptions, CascadeSettings, SpotlightSettings, TiltSettings, IsometricSettings } from './types';

// ─────────────────────────────────────────────────────────────
// Image Export
// ─────────────────────────────────────────────────────────────

/**
 * Export the showcase as an image using html2canvas.
 *
 * Note: html2canvas has limitations with 3D transforms and backdrop-filter.
 * Results may vary. For production-quality exports, consider server-side
 * rendering via Puppeteer.
 */
export async function exportShowcase(
  element: HTMLElement,
  options: Partial<ExportOptions> = {}
): Promise<Blob> {
  const {
    width = 1920,
    height = 1080,
    format = 'png',
    quality = 0.95,
    scale = 2,
  } = options;

  // Dynamically import html2canvas to keep bundle size down
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0f',
    width,
    height,
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    // These options help with 3D transforms but aren't guaranteed
    foreignObjectRendering: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      format === 'webp' ? 'image/webp' : 'image/png',
      quality
    );
  });
}

/**
 * Trigger a download of the exported image.
 */
export async function downloadShowcase(
  element: HTMLElement,
  filename: string,
  options: Partial<ExportOptions> = {}
): Promise<void> {
  const blob = await exportShowcase(element, options);
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// CSS Snippet Generation
// ─────────────────────────────────────────────────────────────

function toHexAlpha(hex: string, alpha: number): string {
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${alphaHex}`;
}

export function generateCSSSnippet(settings: EffectSettings): string {
  switch (settings.effect) {
    case 'cascade':
      return generateCascadeCSS(settings);
    case 'spotlight':
      return generateSpotlightCSS(settings);
    case 'tilt':
      return generateTiltCSS(settings);
    case 'isometric':
      return generateIsometricCSS(settings);
    default:
      return '/* Unknown effect */';
  }
}

function generateCascadeCSS(s: CascadeSettings): string {
  return `/* Funnelists Screenshot Showcase — Cascade Effect */

.showcase-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${s.background};
  overflow: hidden;
  padding: 80px;
}

.showcase-glow {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 40%;
  background: radial-gradient(ellipse at center, ${toHexAlpha(s.glowColor, s.glowIntensity * 0.6)}, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

.showcase-perspective {
  perspective: ${s.perspective}px;
  perspective-origin: 50% 50%;
}

.showcase-panels {
  display: flex;
  gap: ${s.panelSpacing}px;
  transform: rotateY(${s.rotateY}deg) rotateX(${s.rotateX}deg);
  transform-style: preserve-3d;
}

.showcase-panel {
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 ${40 + s.glowIntensity * 60}px ${toHexAlpha(s.glowColor, s.glowIntensity * 0.4)};
}

/* Depth positioning — adjust translateZ for each panel */
.showcase-panel:nth-child(1) { transform: translateZ(${s.depthOffset * 2}px); }
.showcase-panel:nth-child(2) { transform: translateZ(${s.depthOffset}px); }
.showcase-panel:nth-child(3) { transform: translateZ(0); }
.showcase-panel:nth-child(4) { transform: translateZ(${s.depthOffset}px); }
.showcase-panel:nth-child(5) { transform: translateZ(${s.depthOffset * 2}px); }

.showcase-panel img {
  display: block;
  max-height: 400px;
  width: auto;
}
${s.edgeBlur ? `
/* Edge blur overlays */
.showcase-edge-top,
.showcase-edge-bottom,
.showcase-edge-left,
.showcase-edge-right {
  position: absolute;
  pointer-events: none;
  z-index: 10;
}

.showcase-edge-top {
  top: 0; left: 0; right: 0;
  height: 15%;
  background: linear-gradient(to bottom, ${s.background}, transparent);
}

.showcase-edge-bottom {
  bottom: 0; left: 0; right: 0;
  height: 15%;
  background: linear-gradient(to top, ${s.background}, transparent);
}

.showcase-edge-left {
  top: 0; left: 0; bottom: 0;
  width: 10%;
  background: linear-gradient(to right, ${s.background}, transparent);
}

.showcase-edge-right {
  top: 0; right: 0; bottom: 0;
  width: 10%;
  background: linear-gradient(to left, ${s.background}, transparent);
}` : ''}`;
}

function generateSpotlightCSS(s: SpotlightSettings): string {
  return `/* Funnelists Screenshot Showcase — Spotlight Effect */

.spotlight-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${s.background};
  overflow: hidden;
  min-height: 600px;
}

.spotlight-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 60%;
  background: radial-gradient(ellipse at center, ${toHexAlpha(s.glowColor, s.glowIntensity * 0.5)}, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}

.spotlight-element {
  position: relative;
  z-index: 1;
  transform: scale(${s.scale});
  ${s.floatAnimation ? 'animation: spotlight-float 4s ease-in-out infinite;' : ''}
}

.spotlight-card {
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  box-shadow:
    0 25px 80px -15px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 ${60 * s.glowIntensity}px ${toHexAlpha(s.glowColor, s.glowIntensity * 0.5)};
}

.spotlight-card img {
  display: block;
  max-width: 100%;
  max-height: 500px;
}
${s.vignette ? `
.spotlight-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, ${s.background} 90%);
  pointer-events: none;
  z-index: 2;
}` : ''}
${s.floatAnimation ? `
@keyframes spotlight-float {
  0%, 100% { transform: scale(${s.scale}) translateY(0); }
  50% { transform: scale(${s.scale}) translateY(-12px); }
}` : ''}`;
}

function generateTiltCSS(s: TiltSettings): string {
  const shadowX = Math.sin((s.rotateY * Math.PI) / 180) * 50 * s.shadowIntensity;
  const shadowY = 30 + Math.abs(s.rotateX) * 2;

  return `/* Funnelists Screenshot Showcase — Tilt Effect */

.tilt-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${s.background};
  overflow: hidden;
  min-height: 600px;
}

.tilt-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -30%);
  width: 60%;
  height: 50%;
  background: radial-gradient(ellipse at center, ${toHexAlpha(s.glowColor, s.glowIntensity * 0.4)}, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

.tilt-perspective {
  perspective: ${s.perspective}px;
  perspective-origin: 50% 50%;
}

.tilt-card {
  transform: rotateY(${s.rotateY}deg) rotateX(${s.rotateX}deg);
  transform-style: preserve-3d;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  box-shadow:
    ${shadowX.toFixed(1)}px ${shadowY}px ${(60 * s.shadowIntensity).toFixed(0)}px rgba(0, 0, 0, ${(0.4 * s.shadowIntensity).toFixed(2)}),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 ${(40 * s.glowIntensity).toFixed(0)}px ${toHexAlpha(s.glowColor, s.glowIntensity * 0.4)};
}

.tilt-card img {
  display: block;
  max-width: 100%;
  max-height: 500px;
}

.tilt-reflection {
  position: absolute;
  bottom: 5%;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 20%;
  background: linear-gradient(to bottom, ${toHexAlpha(s.glowColor, s.glowIntensity * 0.4)}, transparent);
  filter: blur(40px);
  opacity: ${(s.shadowIntensity * 0.5).toFixed(2)};
  pointer-events: none;
}`;
}

function generateIsometricCSS(s: IsometricSettings): string {
  const radZ = (s.rotateZ * Math.PI) / 180;
  const offsetX = Math.cos(radZ) * s.stackOffset;
  const offsetY = Math.sin(radZ) * s.stackOffset * 0.5;

  return `/* Funnelists Screenshot Showcase — Isometric Effect */

.isometric-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${s.background};
  overflow: hidden;
  min-height: 700px;
}

.isometric-glow {
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 50%;
  background: radial-gradient(ellipse at center, ${toHexAlpha(s.glowColor, s.glowIntensity * 0.4)}, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
}

.isometric-stack {
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(${s.rotateX}deg) rotateZ(${s.rotateZ}deg);
}

.isometric-card {
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  box-shadow:
    ${(10 * s.shadowIntensity).toFixed(0)}px ${(20 * s.shadowIntensity).toFixed(0)}px ${(40 * s.shadowIntensity).toFixed(0)}px rgba(0, 0, 0, ${(0.3 * s.shadowIntensity).toFixed(2)}),
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 0 ${(30 * s.glowIntensity).toFixed(0)}px ${toHexAlpha(s.glowColor, s.glowIntensity * 0.4)};
}

/* Position stacked cards — adjust for your number of images */
.isometric-card:nth-child(1) { position: relative; z-index: 4; }
.isometric-card:nth-child(2) { position: absolute; top: ${(-offsetY).toFixed(0)}px; left: ${offsetX.toFixed(0)}px; z-index: 3; }
.isometric-card:nth-child(3) { position: absolute; top: ${(-offsetY * 2).toFixed(0)}px; left: ${(offsetX * 2).toFixed(0)}px; z-index: 2; }
.isometric-card:nth-child(4) { position: absolute; top: ${(-offsetY * 3).toFixed(0)}px; left: ${(offsetX * 3).toFixed(0)}px; z-index: 1; }

.isometric-card img {
  display: block;
  max-width: 350px;
  height: auto;
}

.isometric-shadow {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%) rotateX(${s.rotateX}deg) rotateZ(${s.rotateZ}deg);
  width: 500px;
  height: 100px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, ${(0.4 * s.shadowIntensity).toFixed(2)}), transparent 70%);
  filter: blur(30px);
  pointer-events: none;
}`;
}
