'use client'

import { useRef, useEffect, useCallback } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

const MAX_ROWS = 4
const LINE_HEIGHT = 20
const PADDING_Y = 20 // 10px top + 10px bottom
const MIN_HEIGHT = LINE_HEIGHT + PADDING_Y
const MAX_HEIGHT = LINE_HEIGHT * MAX_ROWS + PADDING_Y

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask about your brand...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to measure scrollHeight correctly
    textarea.style.height = `${MIN_HEIGHT}px`
    const scrollHeight = textarea.scrollHeight
    const newHeight = Math.min(Math.max(scrollHeight, MIN_HEIGHT), MAX_HEIGHT)
    textarea.style.height = `${newHeight}px`

    // Enable scrolling only when max height is reached
    textarea.style.overflowY = scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }

  const handleSendClick = () => {
    if (value.trim() && !disabled) {
      onSend()
      // Refocus the textarea after sending
      textareaRef.current?.focus()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: '#0f172a',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        style={{
          flex: 1,
          minHeight: `${MIN_HEIGHT}px`,
          maxHeight: `${MAX_HEIGHT}px`,
          padding: '10px 12px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          fontSize: '14px',
          lineHeight: `${LINE_HEIGHT}px`,
          fontFamily: 'inherit',
          resize: 'none',
          outline: 'none',
          overflowY: 'hidden',
          transition: 'border-color 0.15s ease, background-color 0.15s ease',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
        }}
      />

      <button
        onClick={handleSendClick}
        disabled={!canSend}
        aria-label="Send message"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          flexShrink: 0,
          borderRadius: '10px',
          border: 'none',
          backgroundColor: canSend ? '#0ea5e9' : 'rgba(255, 255, 255, 0.06)',
          color: canSend ? '#ffffff' : 'rgba(255, 255, 255, 0.25)',
          cursor: canSend ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.1s ease',
        }}
        onMouseEnter={(e) => {
          if (canSend) {
            e.currentTarget.style.backgroundColor = '#0284c7'
          }
        }}
        onMouseLeave={(e) => {
          if (canSend) {
            e.currentTarget.style.backgroundColor = '#0ea5e9'
          }
        }}
        onMouseDown={(e) => {
          if (canSend) {
            e.currentTarget.style.transform = 'scale(0.95)'
          }
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <Send size={18} />
      </button>
    </div>
  )
}
