'use client';

import { useState } from 'react';
import { brand } from '@/lib/brand';

interface BrandLogoProps {
  className?: string;
  height?: number;
  alt?: string;
}

/**
 * Brand logo component with automatic SVG to PNG fallback
 */
export function BrandLogo({ className, height = 32, alt }: BrandLogoProps) {
  const [useFallback, setUseFallback] = useState(false);

  const logoSrc = useFallback ? brand.logoFallback : brand.logo;
  const altText = alt || brand.name;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={altText}
      height={height}
      className={className}
      onError={() => {
        if (!useFallback) {
          setUseFallback(true);
        }
      }}
      style={{ height: `${height}px`, width: 'auto' }}
    />
  );
}

export default BrandLogo;
