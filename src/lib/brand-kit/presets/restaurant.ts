import type { BrandStyleGuide } from '../types';

export const restaurant: BrandStyleGuide = {
  id: 'restaurant',
  name: 'Restaurant',
  description: 'Warm, appetizing restaurant aesthetic. Earthy tones with rich textures conveying quality and craftsmanship.',
  industry: 'Restaurant / Food & Beverage',
  colors: {
    primary: [
      { hex: '#8B4513', name: 'Warm Brown' },
      { hex: '#2D5016', name: 'Forest Green' },
    ],
    secondary: [
      { hex: '#F5E6D3', name: 'Cream' },
      { hex: '#D4A574', name: 'Warm Sand' },
    ],
    accent: [
      { hex: '#C41E3A', name: 'Wine Red' },
      { hex: '#DAA520', name: 'Goldenrod' },
    ],
    forbidden: ['no neon', 'no cyberpunk', 'no cold blues', 'no clinical white'],
    background: 'warm dark wood or cream textured background',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'appetizing food photography',
      'warm inviting atmosphere',
      'rustic craftsmanship',
      'rich textures and materials',
      'artisan quality',
      'cozy dining ambiance',
    ],
    mood: ['warm', 'inviting', 'artisanal', 'authentic', 'appetizing'],
    description: 'warm restaurant aesthetic with earthy tones, rich textures, and appetizing food presentation',
    avoidKeywords: ['cold', 'clinical', 'technical', 'cyberpunk', 'neon', 'corporate', 'abstract'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
