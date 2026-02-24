import type { BrandStyleGuide } from '../types';

export const funnelists: BrandStyleGuide = {
  id: 'funnelists',
  name: 'Funnelists',
  description: 'Futuristic tech aesthetic with glowing neon elements on dark backgrounds. The default Funnelists brand.',
  industry: 'SaaS / Technology',
  colors: {
    primary: [
      { hex: '#00FFFF', name: 'Electric Cyan' },
      { hex: '#0ea5e9', name: 'Neon Blue' },
      { hex: '#3b82f6', name: 'Deep Blue' },
    ],
    secondary: [
      { hex: '#39FF14', name: 'Lime Green' },
      { hex: '#10b981', name: 'Emerald' },
    ],
    accent: [
      { hex: '#FF00FF', name: 'Magenta' },
      { hex: '#8b5cf6', name: 'Neon Purple' },
    ],
    forbidden: ['no red', 'no orange', 'no yellow', 'no warm colors', 'no white backgrounds'],
    background: 'pitch black #000000 to deep navy #0A0A1F, infinite depth dark space',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'futuristic cyberpunk neon, hyper-realistic but slightly surreal',
      'translucent glass-like holograms with glowing edges and microchip traces visible inside',
      'cinematic volumetric god rays, depth-of-field bokeh lights, inner glows',
      'holographic Salesforce cloud logos, neural network cores, floating dashboard interfaces',
      'flowing neon data streams, pulsating energy, quantum particle connections',
      'isometric 3D platforms on dark circuit board grids with neon traces',
      'ultra-detailed 8K Octane Render quality, sharp vibrant professional',
      'dense scene with floating holographic projections in dark space',
    ],
    mood: ['futuristic', 'high-tech', 'cyberpunk', 'cutting-edge AI', 'powerful'],
    description: 'futuristic cyberpunk neon scene, hyper-realistic but slightly surreal, translucent glass holograms with glowing edges, cinematic volumetric god rays and bokeh lights, ultra-detailed 8K Octane Render quality on pitch black background',
    avoidKeywords: ['cartoon', 'hand-drawn', 'vintage', 'retro', 'watercolor', 'sketchy', 'warm colors', 'friendly', 'playful', 'flat design', 'muted colors', 'simple', 'minimalist', 'soft lighting', 'pastel'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
