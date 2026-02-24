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
      'cyberpunk neon data visualization',
      'dense scene packed with floating holographic screens and glowing icons',
      'bright vibrant neon cyan and emerald glow on pitch black background',
      'circuit board platform with glowing traces',
      'isometric perspective sci-fi command center',
      'particle effects and volumetric light rays',
      'multiple floating dashboards showing charts and data',
      'intense neon bloom lighting',
    ],
    mood: ['futuristic', 'high-tech', 'cyberpunk', 'cutting-edge AI', 'powerful'],
    description: 'cyberpunk neon data visualization scene, dense with floating holographic screens, bright glowing cyan and emerald neon on pitch black, isometric sci-fi command center aesthetic',
    avoidKeywords: ['cartoon', 'hand-drawn', 'vintage', 'retro', 'watercolor', 'sketchy', 'warm colors', 'friendly', 'playful', 'photorealism', 'photography', 'realistic photo', 'minimalist', 'clean', 'simple', 'flat design', 'muted colors'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
