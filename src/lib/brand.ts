/**
 * Funnelists Design System - Brand Configuration
 *
 * Supports white-label customization via environment variables.
 * All products should feel like a family while having their own identity.
 */

export const brand = {
  // Organization branding
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Funnelists',
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO || '/Funnelists-logo.png',
  logoFallback: process.env.NEXT_PUBLIC_BRAND_LOGO_FALLBACK || '/Funnelists-logo.png',
  logoDark: process.env.NEXT_PUBLIC_BRAND_LOGO_DARK || '/Funnelists-logo.png',

  // Brand colors (can be overridden for white-label)
  colors: {
    primary: process.env.NEXT_PUBLIC_BRAND_PRIMARY || '#0ea5e9',
    primaryHover: process.env.NEXT_PUBLIC_BRAND_PRIMARY_HOVER || '#0284c7',
    accent: process.env.NEXT_PUBLIC_BRAND_ACCENT || '#22c55e',
    accentHover: process.env.NEXT_PUBLIC_BRAND_ACCENT_HOVER || '#16a34a',
  },

  // Footer attribution
  footer: process.env.NEXT_PUBLIC_BRAND_FOOTER || 'Powered by Funnelists',

  // Product-specific identity
  product: {
    name: process.env.NEXT_PUBLIC_PRODUCT_NAME || 'Canvas',
    tagline: process.env.NEXT_PUBLIC_PRODUCT_TAGLINE || 'On-brand images, instantly',
  },

  // Links
  links: {
    website: 'https://funnelists.com',
    support: 'https://funnelists.com/support',
  },
};

/**
 * Apply brand colors to CSS variables dynamically
 * Call this in a useEffect to support white-label color overrides
 */
export function applyBrandColors(): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', brand.colors.primary);
  root.style.setProperty('--color-primary-hover', brand.colors.primaryHover);
  root.style.setProperty('--color-accent', brand.colors.accent);
  root.style.setProperty('--color-accent-hover', brand.colors.accentHover);

  // Update legacy aliases too
  root.style.setProperty('--primary', brand.colors.primary);
  root.style.setProperty('--primary-hover', brand.colors.primaryHover);
  root.style.setProperty('--accent', brand.colors.accent);
  root.style.setProperty('--accent-hover', brand.colors.accentHover);
}

export default brand;
