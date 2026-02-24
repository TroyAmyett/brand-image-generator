import type { BrandStyleGuide } from '../types';

export const funnelists: BrandStyleGuide = {
  id: 'funnelists',
  name: 'Funnelists',
  description: 'Futuristic tech aesthetic with glowing neon elements on dark backgrounds. The default Funnelists brand.',
  industry: 'SaaS / Technology',
  colors: {
    primary: [
      { hex: '#0ea5e9', name: 'Cyan' },
      { hex: '#14b8a6', name: 'Teal' },
      { hex: '#3b82f6', name: 'Blue' },
    ],
    secondary: [
      { hex: '#10b981', name: 'Emerald Green' },
    ],
    accent: [
      { hex: '#8b5cf6', name: 'Purple' },
    ],
    forbidden: ['no red', 'no orange', 'no yellow', 'no pink', 'no warm colors'],
    background: 'dark black background, navy #0a0a0f, deep space black',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'isometric 3D technical illustration',
      'glowing cyan and emerald neon accents',
      'circuit board platform base',
      'holographic floating elements',
      'dark space background with depth',
      'volumetric light rays and bloom',
      'octane render quality',
      'enterprise AI visualization',
    ],
    mood: ['innovative', 'professional', 'enterprise-grade', 'cutting-edge AI', 'powerful'],
    description: 'isometric 3D tech illustration with glowing cyan and emerald elements on dark background, octane render quality',
    avoidKeywords: ['cartoon', 'hand-drawn', 'vintage', 'retro', 'watercolor', 'sketchy', 'warm colors', 'friendly', 'playful', 'photorealism', 'photography', 'realistic photo'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
