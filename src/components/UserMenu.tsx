'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/ui/components/Button/Button';
import { LogIn, LogOut, User } from 'lucide-react';
import styles from './UserMenu.module.css';

export function UserMenu() {
  const { user, isFederated, isLoading, login, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Update position on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (showDropdown && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
    };

    if (showDropdown) {
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown]);

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

  // Logged in - show user icon with dropdown
  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={styles.userIconButton}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(14, 165, 233, 0.2)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <User style={{ width: '20px', height: '20px', color: '#0ea5e9' }} />
      </button>

      {showDropdown && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            right: menuPosition.right,
            width: '192px',
            padding: '8px 0',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            zIndex: 99999,
            background: '#111118',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {user.email && (
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'left',
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            <span>Sign Out</span>
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
