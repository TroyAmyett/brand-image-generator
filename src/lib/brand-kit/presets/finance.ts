import type { BrandStyleGuide } from '../types';

export const finance: BrandStyleGuide = {
  id: 'finance',
  name: 'Finance',
  description: 'Conservative, authoritative financial aesthetic. Navy and gold palette conveying security, stability, and trust.',
  industry: 'Finance / Banking',
  colors: {
    primary: [
      { hex: '#1B365D', name: 'Navy' },
      { hex: '#003366', name: 'Dark Blue' },
    ],
    secondary: [
      { hex: '#C9A961', name: 'Gold' },
      { hex: '#8B7D3C', name: 'Dark Gold' },
    ],
    accent: [
      { hex: '#2E7D32', name: 'Success Green' },
    ],
    forbidden: ['no neon', 'no playful colors', 'no bright orange', 'no pink'],
    background: 'white or deep navy background with subtle texture',
  },
  typography: {
    headingFont: 'Georgia',
    bodyFont: 'Inter',
    fontWeights: ['400', '600', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'conservative professional',
      'authoritative and stable',
      'clean data visualization',
      'financial charts aesthetic',
      'security-focused imagery',
      'traditional corporate elegance',
    ],
    mood: ['trustworthy', 'stable', 'authoritative', 'secure', 'professional'],
    description: 'conservative financial imagery with navy and gold palette conveying stability and trust',
    avoidKeywords: ['playful', 'cartoon', 'casual', 'neon', 'cyberpunk', 'hand-drawn', 'informal'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
