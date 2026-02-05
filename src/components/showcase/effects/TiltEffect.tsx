'use client';

import React from 'react';
import type { TiltSettings, ShowcaseImage } from '@/lib/showcase/types';

interface TiltEffectProps {
  images: ShowcaseImage[];
  settings: TiltSettings;
  className?: string;
}

/**
 * Perspective Tilt Effect
 *
 * Single screenshot with 3D rotateY tilt, edge shadow, and ambient glow.
 * Great for hero sections and feature highlights.
 */
export function TiltEffect({ images, settings, className = '' }: TiltEffectProps) {
  const {
    rotateY,
    rotateX,
    perspective,
    glowIntensity,
    glowColor,
    shadowIntensity,
    background,
  } = settings;

  const image = images[0];

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

  const glowRgba = hexToRgba(glowColor, glowIntensity * 0.4);

  // Calculate shadow offset based on rotation
  const shadowX = Math.sin((rotateY * Math.PI) / 180) * 50 * shadowIntensity;
  const shadowY = 30 + Math.abs(rotateX) * 2;

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
          transform: 'translate(-50%, -30%)',
          width: '60%',
          height: '50%',
          background: `radial-gradient(ellipse at center, ${glowRgba}, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Perspective container */}
      <div
        style={{
          perspective: `${perspective}px`,
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div
          style={{
            transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
            transformStyle: 'preserve-3d',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: `
              ${shadowX}px ${shadowY}px ${60 * shadowIntensity}px rgba(0, 0, 0, ${0.4 * shadowIntensity}),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              0 0 ${40 * glowIntensity}px ${glowRgba}
            `,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <img
            src={image.dataUrl}
            alt={image.label || 'Tilted image'}
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

      {/* Subtle reflection underneath */}
      <div
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          height: '20%',
          background: `linear-gradient(to bottom, ${glowRgba}, transparent)`,
          filter: 'blur(40px)',
          opacity: shadowIntensity * 0.5,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default TiltEffect;
