import type { BrandStyleGuide } from '../types';

export const ecommerce: BrandStyleGuide = {
  id: 'ecommerce',
  name: 'E-Commerce',
  description: 'Conversion-focused e-commerce aesthetic. Bold CTAs, product-centric imagery, and warm inviting tones.',
  industry: 'E-Commerce / Retail',
  colors: {
    primary: [
      { hex: '#FF6B00', name: 'Action Orange' },
      { hex: '#1A1A2E', name: 'Dark Navy' },
    ],
    secondary: [
      { hex: '#F8F9FA', name: 'Off-White' },
      { hex: '#495057', name: 'Charcoal' },
    ],
    accent: [
      { hex: '#28A745', name: 'Add to Cart Green' },
      { hex: '#DC3545', name: 'Sale Red' },
    ],
    forbidden: ['no muted pastels', 'no overly dark themes', 'no complex abstract patterns'],
    background: 'clean white or light neutral background for product focus',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '600', '700', '800'],
  },
  visualStyle: {
    styleKeywords: [
      'product-focused photography',
      'clean product staging',
      'bold call-to-action elements',
      'lifestyle product imagery',
      'conversion-optimized layout',
      'aspirational shopping experience',
    ],
    mood: ['inviting', 'exciting', 'aspirational', 'trustworthy', 'action-oriented'],
    description: 'conversion-focused e-commerce imagery with bold CTAs and product-centric staging',
    avoidKeywords: ['abstract', 'minimal', 'cyberpunk', 'dark', 'complex illustration', 'technical'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
