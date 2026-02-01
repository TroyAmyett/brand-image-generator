import type { BrandStyleGuide } from '../types';

export const salesforce: BrandStyleGuide = {
  id: 'salesforce',
  name: 'Salesforce',
  description: 'Clean, friendly corporate illustration style inspired by Salesforce marketing. Bright, optimistic, and customer-focused.',
  industry: 'CRM / Enterprise Software',
  colors: {
    primary: [
      { hex: '#00A1E0', name: 'Salesforce Blue' },
      { hex: '#1798c1', name: 'Sky Blue' },
    ],
    secondary: [
      { hex: '#ffffff', name: 'White' },
      { hex: '#f3f3f3', name: 'Light Gray' },
    ],
    accent: [
      { hex: '#FF6D00', name: 'Orange' },
      { hex: '#2e844a', name: 'Success Green' },
    ],
    forbidden: ['no dark themes', 'no neon', 'no purple', 'no black backgrounds', 'no cyberpunk'],
    background: 'white or light blue gradient background, clean bright backdrop',
  },
  typography: {
    headingFont: 'Salesforce Sans',
    bodyFont: 'Salesforce Sans',
    fontWeights: ['400', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'friendly and approachable',
      'clean corporate illustration',
      'cloud iconography',
      'connected systems',
      'customer-centric imagery',
      'diverse people illustrations',
      'Salesforce Astro style',
      'modern SaaS aesthetic',
    ],
    mood: ['trustworthy', 'friendly', 'innovative', 'connected', 'customer-focused', 'approachable'],
    description: 'clean modern corporate illustration, Salesforce marketing style, bright and optimistic',
    avoidKeywords: ['dark', 'gritty', 'cyberpunk', 'neon', 'futuristic dystopia', 'scary', 'complex', 'technical'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
