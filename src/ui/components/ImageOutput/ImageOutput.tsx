import React from 'react';
import './ImageOutput.css';

export type ImageOutputVariant = 'default' | 'fill';

export interface ImageOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  variant?: ImageOutputVariant;
  isLoading?: boolean;
  placeholder?: React.ReactNode;
  actions?: React.ReactNode;
}

export const ImageOutput = React.forwardRef<HTMLDivElement, ImageOutputProps>(
  (
    {
      src,
      alt = 'Generated image',
      variant = 'default',
      isLoading = false,
      placeholder,
      actions,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      'fl-image-output',
      `fl-image-output--${variant}`,
      isLoading ? 'fl-image-output--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        <div className="fl-image-output__container">
          {isLoading ? (
            <div className="fl-image-output__loader">
              <div className="fl-image-output__spinner">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="31.4 31.4"
                  />
                </svg>
              </div>
              <span className="fl-image-output__loader-text">Generating image...</span>
            </div>
          ) : src ? (
            <img src={src} alt={alt} className="fl-image-output__image" />
          ) : (
            <div className="fl-image-output__placeholder">
              {placeholder || (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="fl-image-output__placeholder-icon"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span className="fl-image-output__placeholder-text">
                    Image will appear here
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        {actions && <div className="fl-image-output__actions">{actions}</div>}
      </div>
    );
  }
);

ImageOutput.displayName = 'ImageOutput';

export default ImageOutput;
