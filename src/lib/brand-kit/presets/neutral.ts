import type { BrandStyleGuide } from '../types';

export const neutral: BrandStyleGuide = {
  id: 'neutral',
  name: 'Neutral',
  description: 'Clean professional imagery with neutral color palette. Versatile and understated for corporate use.',
  industry: 'General / Corporate',
  colors: {
    primary: [
      { hex: '#64748b', name: 'Slate Gray' },
      { hex: '#6b7280', name: 'Neutral Gray' },
      { hex: '#374151', name: 'Charcoal' },
    ],
    secondary: [
      { hex: '#e5e7eb', name: 'Light Gray' },
      { hex: '#9ca3af', name: 'Silver' },
    ],
    accent: [
      { hex: '#3b82f6', name: 'Subtle Blue' },
    ],
    forbidden: ['no bright neon', 'no saturated colors'],
    background: 'neutral gray or off-white background',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '600'],
  },
  visualStyle: {
    styleKeywords: [
      'professional and clean',
      'corporate neutral',
      'balanced composition',
      'understated elegance',
      'versatile imagery',
    ],
    mood: ['professional', 'balanced', 'versatile', 'understated'],
    description: 'clean professional imagery with neutral color palette',
    avoidKeywords: ['flashy', 'neon', 'extreme', 'dramatic', 'bold colors'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
