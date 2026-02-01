'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Sparkles, AlertCircle } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import type { BrandStyleGuide } from '@/lib/brand-kit'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  activeGuideId?: string
  onGuideCreated?: (guide: BrandStyleGuide) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADER_HEIGHT = 56

const WELCOME_MESSAGE: ChatMessageData = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your **Brand Assistant**. I can help you:\n\n" +
    '- Discover and define your brand visual identity\n' +
    '- Create color palettes with specific hex codes\n' +
    '- Choose typography that fits your brand personality\n' +
    '- Define visual style keywords for image generation\n' +
    '- Refine your existing style guide\n\n' +
    "Tell me about your brand, or ask me to help improve your current style guide. What would you like to work on?",
  timestamp: new Date(),
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPanel({
  isOpen,
  onClose,
  activeGuideId,
  onGuideCreated,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([WELCOME_MESSAGE])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

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

  // Cleanup streaming on unmount or close
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Send message handler
  // ---------------------------------------------------------------------------

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isStreaming) return

    setError(null)

    // Create user message
    const userMessage: ChatMessageData = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    // Create placeholder assistant message for streaming
    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: ChatMessageData = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInputValue('')
    setIsStreaming(true)

    // Build messages array for the API (exclude welcome message and strip metadata)
    const apiMessages = [...messages.filter((m) => m.id !== 'welcome'), userMessage].map(
      (m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    )

    try {
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      const response = await fetch('/api/chat/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          activeGuideId,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.error?.message || `Request failed with status ${response.status}`
        )
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      // Read the SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines from the buffer
        const lines = buffer.split('\n')
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue

          if (trimmedLine === 'data: [DONE]') {
            continue
          }

          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.slice(6)
            try {
              const data = JSON.parse(jsonStr)
              if (data.text) {
                accumulated += data.text
                // Update assistant message content progressively
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulated }
                      : m
                  )
                )
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      }

      // Ensure final content is set
      if (accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: accumulated, timestamp: new Date() }
              : m
          )
        )
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled - remove the empty assistant message
        setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId || m.content))
        return
      }

      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)

      // Remove the empty assistant message on error
      setMessages((prev) =>
        prev.filter((m) => m.id !== assistantMessageId || m.content)
      )
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [inputValue, isStreaming, messages, activeGuideId, onGuideCreated])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
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

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: HEADER_HEIGHT,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '500px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: 'rgba(14, 165, 233, 0.15)',
              }}
            >
              <Sparkles size={16} style={{ color: '#0ea5e9' }} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: 0,
                  lineHeight: '1.2',
                }}
              >
                Brand Assistant
              </h2>
              {activeGuideId && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    lineHeight: '1',
                  }}
                >
                  Guide: {activeGuideId}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close chat panel"
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
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((msg, index) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              isStreaming={
                isStreaming &&
                msg.role === 'assistant' &&
                index === messages.length - 1
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderTop: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '13px',
              color: '#fca5a5',
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '12px',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Input area */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={isStreaming}
          placeholder={
            isStreaming ? 'Waiting for response...' : 'Ask about your brand...'
          }
        />
      </div>
    </>
  )
}
