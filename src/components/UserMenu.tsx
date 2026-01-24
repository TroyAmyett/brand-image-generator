'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/ui/components/Button/Button';
import { LogIn, LogOut, User, ChevronDown, ExternalLink } from 'lucide-react';
import styles from './UserMenu.module.css';

const AGENTPM_URL = process.env.NEXT_PUBLIC_AGENTPM_URL || 'https://agentpm.ai';

export function UserMenu() {
  const { user, isFederated, isLoading, login, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  if (isLoading) {
    return (
      <div className={styles.loadingPlaceholder}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  // Not logged in - show Sign in button
  if (!isFederated || !user) {
    return (
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<LogIn className="w-4 h-4" />}
        onClick={login}
        className={styles.signInButton}
      >
        Sign in
      </Button>
    );
  }

  // Logged in - show user menu
  return (
    <div className={styles.userMenuContainer} ref={dropdownRef}>
      <button
        className={styles.userButton}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={user.name || user.email}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <User className="w-4 h-4" />
          </div>
        )}
        <span className={styles.userName}>{user.name || user.email}</span>
        <ChevronDown className={`w-4 h-4 ${styles.chevron} ${showDropdown ? styles.chevronOpen : ''}`} />
      </button>

      {showDropdown && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <p className={styles.dropdownEmail}>{user.email}</p>
            <span className={styles.federatedBadge}>Funnelists</span>
          </div>

          <div className={styles.dropdownDivider} />

          <a
            href={`${AGENTPM_URL}/settings/api-keys`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.dropdownItem}
            onClick={() => setShowDropdown(false)}
          >
            <ExternalLink className="w-4 h-4" />
            Manage API Keys
          </a>

          <div className={styles.dropdownDivider} />

          <button
            className={`${styles.dropdownItem} ${styles.logoutItem}`}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
