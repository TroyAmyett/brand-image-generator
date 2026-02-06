'use client';

import React from 'react';
import type { IsometricSettings, ShowcaseImage } from '@/lib/showcase/types';

interface IsometricEffectProps {
  images: ShowcaseImage[];
  settings: IsometricSettings;
  className?: string;
}

/**
 * Isometric Stack Effect
 *
 * Multiple screenshots stacked at isometric angles.
 * Popular for showing mobile/tablet/desktop together or layered app views.
 */
export function IsometricEffect({ images, settings, className = '' }: IsometricEffectProps) {
  const {
    offsetX: posX,
    offsetY: posY,
    imageScale,
    rotateX,
    rotateZ,
    stackOffset,
    glowIntensity,
    glowColor,
    shadowIntensity,
    background,
  } = settings;

  if (images.length === 0) {
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
        Upload images to preview
      </div>
    );
  }

  const glowRgba = hexToRgba(glowColor, glowIntensity * 0.4);

  // Calculate horizontal and vertical offset based on rotation for stacking
  const radZ = (rotateZ * Math.PI) / 180;
  const stackX = Math.cos(radZ) * stackOffset;
  const stackY = Math.sin(radZ) * stackOffset * 0.5; // Flatten Y offset

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
          top: '60%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '50%',
          background: `radial-gradient(ellipse at center, ${glowRgba}, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      {/* Isometric container */}
      <div
        style={{
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `translate(${posX}px, ${posY}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${imageScale})`,
        }}
      >
        {images.map((image, index) => {
          // Stack from back to front
          const reverseIndex = images.length - 1 - index;
          const xPos = reverseIndex * stackX;
          const yPos = reverseIndex * stackY;
          const zPos = reverseIndex * 2; // Small Z for stacking

          return (
            <div
              key={image.id}
              style={{
                position: index === 0 ? 'relative' : 'absolute',
                top: index === 0 ? 0 : `${-yPos}px`,
                left: index === 0 ? 0 : `${xPos}px`,
                transform: `translateZ(${zPos}px)`,
                transformStyle: 'preserve-3d',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: `
                  ${10 * shadowIntensity}px ${20 * shadowIntensity}px ${40 * shadowIntensity}px rgba(0, 0, 0, ${0.3 * shadowIntensity}),
                  0 0 0 1px rgba(255, 255, 255, 0.08),
                  0 0 ${30 * glowIntensity}px ${glowRgba}
                `,
                background: 'rgba(255, 255, 255, 0.02)',
                zIndex: images.length - index,
              }}
            >
              <img
                src={image.dataUrl}
                alt={image.label || `Layer ${index + 1}`}
                style={{
                  display: 'block',
                  maxWidth: '350px',
                  height: 'auto',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* Floor shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: `translateX(-50%) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg)`,
          width: `${images.length * 100 + 200}px`,
          height: '100px',
          background: `radial-gradient(ellipse at center, rgba(0,0,0,${0.4 * shadowIntensity}), transparent 70%)`,
          filter: 'blur(30px)',
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

export default IsometricEffect;
