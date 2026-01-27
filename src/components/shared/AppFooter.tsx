import React from 'react';
import './AppFooter.css';

// Globe icon inline SVG to avoid external dependencies
const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="fl-app-footer__badge-icon"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

export interface AppFooterProps extends React.HTMLAttributes<HTMLElement> {
  brandUrl?: string;
  brandText?: string;
  ctaUrl?: string;
  ctaText?: string;
  showBadge?: boolean;
  badgeText?: string;
}

export const AppFooter = React.forwardRef<HTMLElement, AppFooterProps>(
  (
    {
      brandUrl = 'https://funnelists.com',
      brandText = 'Funnelists',
      ctaUrl = 'https://calendly.com/funnelists',
      ctaText = 'Build your AI app',
      showBadge = true,
      badgeText = 'Built with Claude Code',
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = ['fl-app-footer', className].filter(Boolean).join(' ');

    return (
      <footer ref={ref} className={classNames} {...props}>
        <a
          href={brandUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fl-app-footer__brand"
        >
          {brandText}
        </a>

        <div className="fl-app-footer__right">
          {showBadge && (
            <div className="fl-app-footer__badge">
              <GlobeIcon />
              <span>{badgeText}</span>
            </div>
          )}

          {ctaUrl && ctaText && (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="fl-app-footer__cta"
            >
              {ctaText}
            </a>
          )}
        </div>
      </footer>
    );
  }
);

AppFooter.displayName = 'AppFooter';

export default AppFooter;
