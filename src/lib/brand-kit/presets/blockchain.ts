import type { BrandStyleGuide } from '../types';

export const blockchain: BrandStyleGuide = {
  id: 'blockchain',
  name: 'Blockchain',
  description: 'Interconnected blockchain nodes and distributed ledger visualization. Gold and deep blue with metallic accents.',
  industry: 'Blockchain / Web3',
  colors: {
    primary: [
      { hex: '#F7931A', name: 'Gold' },
      { hex: '#FFA500', name: 'Amber' },
    ],
    secondary: [
      { hex: '#1a1a2e', name: 'Deep Blue' },
      { hex: '#6B5B95', name: 'Purple' },
    ],
    accent: [
      { hex: '#c0c0c0', name: 'Silver' },
    ],
    forbidden: ['no pink', 'no pastel colors', 'no bright green'],
    background: 'dark blue or black background with metallic accents',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '600', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'interconnected nodes',
      'distributed ledger chains',
      'cryptographic patterns',
      'decentralized network',
      'hash chain visualization',
      'digital currency aesthetic',
      'secure transaction flow',
    ],
    mood: ['secure', 'decentralized', 'transparent', 'immutable', 'trustless'],
    description: 'interconnected blockchain nodes and distributed ledger visualization',
    avoidKeywords: ['centralized', 'single point', 'organic', 'soft', 'rounded'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
