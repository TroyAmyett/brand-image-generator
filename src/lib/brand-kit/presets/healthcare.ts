import type { BrandStyleGuide } from '../types';

export const healthcare: BrandStyleGuide = {
  id: 'healthcare',
  name: 'Healthcare',
  description: 'Clean, trustworthy healthcare aesthetic. Calming blues and greens with white space, conveying professionalism and care.',
  industry: 'Healthcare / Medical',
  colors: {
    primary: [
      { hex: '#0077B6', name: 'Medical Blue' },
      { hex: '#00B4D8', name: 'Teal' },
    ],
    secondary: [
      { hex: '#90E0EF', name: 'Light Blue' },
      { hex: '#48CAE4', name: 'Aqua' },
    ],
    accent: [
      { hex: '#06D6A0', name: 'Healing Green' },
    ],
    forbidden: ['no dark themes', 'no neon', 'no aggressive colors', 'no black backgrounds'],
    background: 'clean white or very light blue background',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '600'],
  },
  visualStyle: {
    styleKeywords: [
      'clean medical aesthetic',
      'soft gradients',
      'caring and professional',
      'rounded friendly shapes',
      'health and wellness imagery',
      'modern clinical design',
    ],
    mood: ['trustworthy', 'caring', 'professional', 'calming', 'reliable'],
    description: 'clean healthcare illustration with calming blue tones and professional medical aesthetic',
    avoidKeywords: ['dark', 'scary', 'cyberpunk', 'aggressive', 'neon', 'gritty', 'industrial'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
