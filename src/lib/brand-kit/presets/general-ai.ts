import type { BrandStyleGuide } from '../types';

export const generalAi: BrandStyleGuide = {
  id: 'general-ai',
  name: 'General AI',
  description: 'Abstract AI visualization with neural network patterns and data flows. Sophisticated and cutting-edge.',
  industry: 'Artificial Intelligence',
  colors: {
    primary: [
      { hex: '#0077be', name: 'Electric Blue' },
      { hex: '#1e3a5f', name: 'Deep Blue' },
    ],
    secondary: [
      { hex: '#0ea5e9', name: 'Cyan' },
    ],
    accent: [
      { hex: '#8b5cf6', name: 'Purple' },
    ],
    forbidden: ['no orange', 'no yellow', 'no warm earth tones'],
    background: 'dark gradient background, deep blue to black',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'neural network visualization',
      'AI brain patterns',
      'machine learning aesthetic',
      'data streams',
      'algorithmic patterns',
      'digital synapses',
      'abstract AI core',
    ],
    mood: ['intelligent', 'advanced', 'sophisticated', 'cutting-edge', 'powerful'],
    description: 'abstract AI visualization with neural network patterns and data flows',
    avoidKeywords: ['cartoon', 'childish', 'simple', 'hand-drawn', 'organic'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
