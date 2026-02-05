'use client';

import React from 'react';
import type { CascadeSettings, ShowcaseImage } from '@/lib/showcase/types';

interface CascadeEffectProps {
  images: ShowcaseImage[];
  settings: CascadeSettings;
  className?: string;
}

/**
 * Layered Cascade Effect
 *
 * Multiple panels arranged in 3D perspective, fanned out with depth staggering.
 * Inspired by Linear's hero section.
 */
export function CascadeEffect({ images, settings, className = '' }: CascadeEffectProps) {
  const {
    perspective,
    rotateY,
    rotateX,
    panelSpacing,
    depthOffset,
    glowIntensity,
    glowColor,
    edgeBlur,
    background,
  } = settings;

  // Convert hex glow color to RGBA
  const glowRgba = hexToRgba(glowColor, glowIntensity * 0.4);
  const glowRgbaStrong = hexToRgba(glowColor, glowIntensity * 0.6);

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
      {/* Ambient glow underneath */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '40%',
          background: `radial-gradient(ellipse at center, ${glowRgbaStrong}, transparent 70%)`,
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Edge blur - top */}
      {edgeBlur && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '15%',
              background: `linear-gradient(to bottom, ${background}, transparent)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '15%',
              background: `linear-gradient(to top, ${background}, transparent)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '10%',
              background: `linear-gradient(to right, ${background}, transparent)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: '10%',
              background: `linear-gradient(to left, ${background}, transparent)`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        </>
      )}

      {/* 3D perspective container */}
      <div
        style={{
          perspective: `${perspective}px`,
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Panel group with rotation */}
        <div
          style={{
            display: 'flex',
            gap: `${panelSpacing}px`,
            transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {images.map((image, index) => {
            // Calculate depth: center panels forward, outer panels back
            const centerIndex = (images.length - 1) / 2;
            const distanceFromCenter = Math.abs(index - centerIndex);
            const zOffset = (images.length - 1 - distanceFromCenter) * depthOffset;

            return (
              <div
                key={image.id}
                style={{
                  transform: `translateZ(${zOffset}px)`,
                  transformStyle: 'preserve-3d',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(255, 255, 255, 0.1),
                    0 0 ${40 + glowIntensity * 60}px ${glowRgba}
                  `,
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <img
                  src={image.dataUrl}
                  alt={image.label || `Panel ${index + 1}`}
                  style={{
                    display: 'block',
                    maxHeight: '400px',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default CascadeEffect;
