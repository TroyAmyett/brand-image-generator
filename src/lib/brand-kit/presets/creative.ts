import type { BrandStyleGuide } from '../types';

export const creative: BrandStyleGuide = {
  id: 'creative',
  name: 'Creative Agency',
  description: 'Bold, expressive creative agency aesthetic. High contrast with vibrant colors and experimental compositions.',
  industry: 'Creative / Design Agency',
  colors: {
    primary: [
      { hex: '#FF3366', name: 'Hot Pink' },
      { hex: '#6C5CE7', name: 'Vivid Purple' },
    ],
    secondary: [
      { hex: '#00CEC9', name: 'Turquoise' },
      { hex: '#FDCB6E', name: 'Warm Yellow' },
    ],
    accent: [
      { hex: '#E17055', name: 'Coral' },
      { hex: '#00B894', name: 'Mint' },
    ],
    forbidden: ['no muted colors', 'no corporate gray', 'no dull palettes'],
    background: 'high contrast dark or white background to make colors pop',
  },
  typography: {
    headingFont: 'Space Grotesk',
    bodyFont: 'Inter',
    fontWeights: ['400', '700', '900'],
  },
  visualStyle: {
    styleKeywords: [
      'bold and expressive',
      'high contrast compositions',
      'experimental layouts',
      'vibrant color blocking',
      'artistic and avant-garde',
      'dynamic visual energy',
    ],
    mood: ['bold', 'creative', 'expressive', 'energetic', 'innovative'],
    description: 'bold creative agency aesthetic with vibrant colors and experimental compositions',
    avoidKeywords: ['corporate', 'conservative', 'muted', 'boring', 'traditional', 'stock photo'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
