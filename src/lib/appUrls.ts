/**
 * Helper to get app URLs based on environment (dev vs prod)
 */
export function getAppUrl(app: string): string {
  const isDev = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const devPorts: Record<string, number> = {
    agentpm: 3000,
    radar: 3001,
    notetaker: 3000, // same as agentpm - it's the same app
    canvas: 3003,
    leadgen: 3004,
  };

  const prodDomains: Record<string, string> = {
    agentpm: 'agentpm.funnelists.com',
    radar: 'radar.funnelists.com',
    notetaker: 'notetaker.funnelists.com',
    canvas: 'canvas.funnelists.com',
    leadgen: 'leadgen.funnelists.com',
  };

  if (isDev) {
    return `http://localhost:${devPorts[app] || 3000}`;
  }

  return `https://${prodDomains[app] || 'funnelists.com'}`;
}
