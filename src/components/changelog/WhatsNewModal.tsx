'use client'

// What's New Modal
// Auto-popup modal for highlighted changelog entries

import { X, Sparkles } from 'lucide-react'
import type { ChangelogEntry } from '@/hooks/useChangelog'

interface WhatsNewModalProps {
  isOpen: boolean
  highlights: ChangelogEntry[]
  onDismiss: () => void
  onViewAll: () => void
}

export function WhatsNewModal({ isOpen, highlights, onDismiss, onViewAll }: WhatsNewModalProps) {
  if (!isOpen || highlights.length === 0) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 50,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '512px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 51,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                What&apos;s New
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  margin: 0,
                }}
              >
                {highlights.length} new update{highlights.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.4)',
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

        {/* Content */}
        <div
          style={{
            padding: '16px 24px',
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 500,
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22c55e',
                    }}
                  >
                    {highlight.commitType === 'feat' ? 'New Feature' : 'Update'}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    {new Date(highlight.commitDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    margin: '0 0 4px 0',
                    color: '#ffffff',
                  }}
                >
                  {highlight.title}
                </h3>
                {highlight.description && (
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      margin: 0,
                    }}
                  >
                    {highlight.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <button
            onClick={onViewAll}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              color: '#0ea5e9',
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#38bdf8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#0ea5e9';
            }}
          >
            View all updates
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              backgroundColor: '#0ea5e9',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0ea5e9';
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  )
}
