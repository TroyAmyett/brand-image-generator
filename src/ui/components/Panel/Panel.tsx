import React from 'react';
import './Panel.css';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  noPadding?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      header,
      actions,
      children,
      noPadding = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = [
      'fl-panel',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const contentClassNames = [
      'fl-panel__content',
      noPadding ? 'fl-panel__content--no-padding' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {(header || actions) && (
          <div className="fl-panel__header">
            {header && <div className="fl-panel__title">{header}</div>}
            {actions && <div className="fl-panel__actions">{actions}</div>}
          </div>
        )}
        <div className={contentClassNames}>{children}</div>
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export default Panel;
