import type { BrandStyleGuide } from '../types';

export const funnelists: BrandStyleGuide = {
  id: 'funnelists',
  name: 'Funnelists',
  description: 'Futuristic tech aesthetic with glowing neon elements on dark backgrounds. The default Funnelists brand.',
  industry: 'SaaS / Technology',
  colors: {
    primary: [
      { hex: '#00FFFF', name: 'Electric Cyan' },
      { hex: '#39FF14', name: 'Neon Lime Green' },
    ],
    secondary: [
      { hex: '#0ea5e9', name: 'Neon Blue' },
      { hex: '#3b82f6', name: 'Deep Blue' },
    ],
    accent: [
      { hex: '#8b5cf6', name: 'Purple (sparingly)' },
    ],
    forbidden: ['no red', 'no orange', 'no yellow', 'no warm colors', 'no white backgrounds', 'no pink', 'no magenta', 'no bright daylight themes'],
    background: 'pitch black #000000 to deep navy #0A0A1F, infinite depth dark space',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    fontWeights: ['400', '500', '700'],
  },
  visualStyle: {
    styleKeywords: [
      'futuristic cyberpunk neon with Salesforce Agentforce-era vibes, hyper-realistic but slightly surreal',
      'translucent glass-like holograms with glowing edges, microchip traces visible inside objects',
      'cinematic volumetric god rays, depth-of-field bokeh lights, inner glows on elements',
      'holographic Salesforce cloud logo, neural network cores, floating dashboard interfaces, agent nodes',
      'flowing green and blue neon data streams, pulsating energy, holographic projections floating in space',
      'isometric 3D platforms on dark circuit board grids with high-tech digital grid patterns',
      'ultra-detailed 8K Octane Render or Redshift quality, sharp vibrant professional',
      'neural network nodes, interlinked AI brains, abstract server blocks, data pipelines, floating API connectors',
    ],
    mood: ['futuristic', 'high-tech', 'cyberpunk', 'cutting-edge AI', 'powerful'],
    description: 'futuristic cyberpunk neon with Salesforce Agentforce-era vibes, hyper-realistic but slightly surreal, translucent glass holograms with glowing edges, cinematic volumetric god rays and bokeh lights, ultra-detailed 8K Octane Render, dominant electric cyan and lime green glows on pitch black background',
    avoidKeywords: ['cartoon', 'hand-drawn', 'vintage', 'retro', 'watercolor', 'sketchy', 'warm colors', 'friendly', 'playful', 'flat design', 'muted colors', 'simple', 'minimalist', 'soft lighting', 'pastel', 'pink', 'magenta', 'bright daylight', 'non-neon colors', 'generic gears', 'generic lightbulbs'],
  },
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};
