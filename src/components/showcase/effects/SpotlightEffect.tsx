'use client';

import React from 'react';
import type { SpotlightSettings, ShowcaseImage } from '@/lib/showcase/types';

interface SpotlightEffectProps {
  images: ShowcaseImage[];
  settings: SpotlightSettings;
  className?: string;
}

/**
 * Floating Spotlight Effect
 *
 * Single UI element isolated on a dark stage with vignette, glow,
 * and optional floating animation.
 */
export function SpotlightEffect({ images, settings, className = '' }: SpotlightEffectProps) {
  const {
    offsetX,
    offsetY,
    scale,
    glowIntensity,
    glowColor,
    vignette,
    floatAnimation,
    background,
  } = settings;

  const image = images[0]; // Spotlight uses only one image

  if (!image) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background,
          color: 'rgba(255, 255, 255, 0.3)',
          fontSize: '14px',
        }}
      >
        Upload an image to preview
      </div>
    );
  }

  const glowRgba = hexToRgba(glowColor, glowIntensity * 0.5);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '60%',
          background: `radial-gradient(ellipse at center, ${glowRgba}, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating image */}
      <div
        style={{
          position: 'relative',
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          animation: floatAnimation ? 'spotlight-float 4s ease-in-out infinite' : 'none',
          zIndex: 1,
        }}
      >
        <div
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `
              0 25px 80px -15px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 0 ${60 * glowIntensity}px ${glowRgba}
            `,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <img
            src={image.dataUrl}
            alt={image.label || 'Spotlight image'}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '500px',
              objectFit: 'contain',
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Vignette overlay */}
      {vignette && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 30%, ${background} 90%)`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {/* Float animation keyframes */}
      <style>{`
        @keyframes spotlight-float {
          0%, 100% { transform: translate(${offsetX}px, ${offsetY}px) scale(${scale}); }
          50% { transform: translate(${offsetX}px, ${offsetY - 12}px) scale(${scale}); }
        }
      `}</style>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default SpotlightEffect;
