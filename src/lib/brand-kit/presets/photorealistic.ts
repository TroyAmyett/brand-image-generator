import type { BrandStyleGuide } from '../types';

export const photorealistic: BrandStyleGuide = {
  id: 'photorealistic',
  name: 'Photorealistic',
  description: 'Photorealistic professional photography with natural lighting. Authentic and genuine imagery.',
  industry: 'Photography / General',
  colors: {
    primary: [
      { hex: '#8B7355', name: 'Natural Tone' },
      { hex: '#6B8E7B', name: 'Earthy Green' },
    ],
    secondary: [
      { hex: '#D4C5A9', name: 'Warm Beige' },
      { hex: '#87CEEB', name: 'Sky' },
    ],
    accent: [
      { hex: '#CD853F', name: 'Natural Accent' },
    ],
    forbidden: ['no neon colors', 'no unrealistic saturation'],
    background: 'natural environment or studio backdrop',
  },
  typography: {
    headingFont: 'Georgia',
    bodyFont: 'Inter',
    fontWeights: ['400', '600'],
  },
  visualStyle: {
    styleKeywords: [
      'photorealistic',
      'natural photography',
      'real-world setting',
      'authentic lighting',
      'professional photography',
      'natural environment',
    ],
    mood: ['authentic', 'realistic', 'natural', 'genuine', 'relatable'],
    description: 'photorealistic professional photography with natural lighting',
    avoidKeywords: ['illustration', 'cartoon', 'stylized', 'abstract', 'neon', 'cyberpunk', 'digital art'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
