'use client'

// Changelog Entry
// Single changelog entry card

import { Sparkles, Bug, Wrench, BookOpen, RefreshCw, Zap } from 'lucide-react'
import type { ChangelogEntry as Entry } from '@/hooks/useChangelog'

interface ChangelogEntryProps {
  entry: Entry
}

// Map commit types to icons and colors
const TYPE_CONFIG: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
  feat: { icon: Sparkles, color: '#22c55e', label: 'New Feature' },
  fix: { icon: Bug, color: '#ef4444', label: 'Bug Fix' },
  chore: { icon: Wrench, color: '#6b7280', label: 'Maintenance' },
  docs: { icon: BookOpen, color: '#3b82f6', label: 'Documentation' },
  refactor: { icon: RefreshCw, color: '#8b5cf6', label: 'Improvement' },
  perf: { icon: Zap, color: '#f59e0b', label: 'Performance' },
}

const DEFAULT_CONFIG = { icon: Sparkles, color: '#6b7280', label: 'Update' }

export function ChangelogEntry({ entry }: ChangelogEntryProps) {
  const config = TYPE_CONFIG[entry.commitType] || DEFAULT_CONFIG
  const Icon = config.icon

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: entry.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.05)',
        transition: 'background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Type Icon */}
        <div
          style={{
            padding: '8px',
            borderRadius: '8px',
            flexShrink: 0,
            background: `${config.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={16} style={{ color: config.color }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontWeight: 500,
                background: `${config.color}20`,
                color: config.color,
              }}
            >
              {config.label}
            </span>
            {entry.isHighlight && (
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontWeight: 500,
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                }}
              >
                Highlight
              </span>
            )}
            <span
              style={{
                fontSize: '12px',
                marginLeft: 'auto',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              {formatDate(entry.commitDate)}
            </span>
          </div>

          <h4
            style={{
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '4px',
              color: '#ffffff',
              margin: '0 0 4px 0',
            }}
          >
            {entry.title}
          </h4>

          {entry.description && (
            <p
              style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
              }}
            >
              {entry.description}
            </p>
          )}

          {/* Product badge */}
          {entry.product !== 'canvas' && entry.product !== 'all' && (
            <span
              style={{
                display: 'inline-block',
                marginTop: '8px',
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              {entry.product.charAt(0).toUpperCase() + entry.product.slice(1)}
            </span>
          )}
        </div>

        {/* Unread indicator */}
        {!entry.isRead && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: '8px',
              backgroundColor: '#0ea5e9',
            }}
          />
        )}
      </div>
    </div>
  )
}
