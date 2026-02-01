'use client'

// Changelog Drawer
// Slide-out panel showing changelog entries, positioned below the app header

import { useEffect, useRef } from 'react'
import { X, CheckCheck, Loader2 } from 'lucide-react'
import { ChangelogEntry } from './ChangelogEntry'
import type { ChangelogEntry as Entry } from '@/hooks/useChangelog'

interface ChangelogDrawerProps {
  isOpen: boolean
  onClose: () => void
  entries: Entry[]
  isLoading: boolean
  onMarkAllRead: () => void
  onMarkAsRead: (ids: string[]) => void
  onFetchEntries: () => void
}

const HEADER_HEIGHT = 56

export function ChangelogDrawer({
  isOpen,
  onClose,
  entries,
  isLoading,
  onMarkAllRead,
  onMarkAsRead,
  onFetchEntries,
}: ChangelogDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Fetch entries when drawer opens
  useEffect(() => {
    if (isOpen) {
      onFetchEntries()
    }
  }, [isOpen, onFetchEntries])

  // Mark visible entries as read after a short delay
  useEffect(() => {
    if (isOpen && entries.length > 0) {
      const unreadIds = entries.filter((e) => !e.isRead).map((e) => e.id)
      if (unreadIds.length > 0) {
        const timer = setTimeout(() => {
          onMarkAsRead(unreadIds)
        }, 2000)
        return () => clearTimeout(timer)
      }
    }
  }, [isOpen, entries, onMarkAsRead])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const unreadCount = entries.filter((e) => !e.isRead).length

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - below the header */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: HEADER_HEIGHT,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Drawer - positioned below header */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          top: HEADER_HEIGHT,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            flexShrink: 0,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#ffffff',
              margin: 0,
            }}
          >
            What&apos;s New
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 0',
              }}
            >
              <Loader2 size={24} style={{ color: 'rgba(255, 255, 255, 0.4)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>
                No updates yet. Check back later!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {entries.map((entry) => (
                <ChangelogEntry key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spin animation for loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
