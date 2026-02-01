'use client'

// Changelog Badge
// Bell icon with unread count badge

import { Bell } from 'lucide-react'

interface ChangelogBadgeProps {
  unreadCount: number
  onClick: () => void
}

export function ChangelogBadge({ unreadCount, onClick }: ChangelogBadgeProps) {
  return (
    <button
      onClick={onClick}
      title="What's New"
      style={{
        position: 'relative',
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.7)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
      }}
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 500,
            borderRadius: '9999px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            padding: '0 4px',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
