import React from 'react';
import './AppHeader.css';

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  toolName?: string;
  toolSwitcher?: React.ReactNode;
  settingsButton?: React.ReactNode;
  userMenu?: React.ReactNode;
}

export const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  (
    {
      logo,
      toolName,
      toolSwitcher,
      settingsButton,
      userMenu,
      className = '',
      ...props
    },
    ref
  ) => {
    const classNames = ['fl-app-header', className].filter(Boolean).join(' ');

    return (
      <header ref={ref} className={classNames} {...props}>
        <div className="fl-app-header__left">
          {logo && <div className="fl-app-header__logo">{logo}</div>}
          {toolName && <span className="fl-app-header__tool-name">{toolName}</span>}
          {toolSwitcher && (
            <div className="fl-app-header__tool-switcher">{toolSwitcher}</div>
          )}
        </div>
        <div className="fl-app-header__right">
          {settingsButton && (
            <div className="fl-app-header__settings">{settingsButton}</div>
          )}
          {userMenu && <div className="fl-app-header__user-menu">{userMenu}</div>}
        </div>
      </header>
    );
  }
);

AppHeader.displayName = 'AppHeader';

export default AppHeader;
