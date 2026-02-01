import type { BrandStyleGuide } from '../types';

export const minimal: BrandStyleGuide = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Minimal clean design with generous white space. Elegant simplicity with single focal points.',
  industry: 'Design / Lifestyle',
  colors: {
    primary: [
      { hex: '#ffffff', name: 'White' },
      { hex: '#fafafa', name: 'Off-White' },
    ],
    secondary: [
      { hex: '#e5e7eb', name: 'Light Gray' },
      { hex: '#f3f4f6', name: 'Subtle Gray' },
    ],
    accent: [
      { hex: '#000000', name: 'Black' },
    ],
    forbidden: ['no multiple bright colors', 'no gradients', 'no complex patterns'],
    background: 'pure white or very light neutral background',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['300', '400', '500'],
  },
  visualStyle: {
    styleKeywords: [
      'minimal design',
      'generous negative space',
      'single focal point',
      'clean lines',
      'elegant simplicity',
      'modern minimalist',
    ],
    mood: ['calm', 'sophisticated', 'elegant', 'refined', 'peaceful'],
    description: 'minimal clean design with generous white space',
    avoidKeywords: ['complex', 'busy', 'cluttered', 'colorful', 'detailed', 'ornate', 'cyberpunk', 'neon'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
