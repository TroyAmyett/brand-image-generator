'use client'

import { useMemo } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

/**
 * Parse simple markdown-like syntax into React elements.
 * Handles: **bold**, `inline code`, ```code blocks```, and - list items.
 */
function parseContent(content: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const lines = content.split('\n')
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ''
  let keyIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code block start/end
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockLang = line.trim().slice(3).trim()
        codeBlockLines = []
        continue
      } else {
        inCodeBlock = false
        nodes.push(
          <pre
            key={`code-${keyIndex++}`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '10px 12px',
              margin: '8px 0',
              overflowX: 'auto',
              fontSize: '13px',
              fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        )
        codeBlockLines = []
        continue
      }
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      nodes.push(<div key={`br-${keyIndex++}`} style={{ height: '8px' }} />)
      continue
    }

    // List items (- or * prefix)
    if (/^\s*[-*]\s/.test(line)) {
      const listContent = line.replace(/^\s*[-*]\s/, '')
      nodes.push(
        <div
          key={`li-${keyIndex++}`}
          style={{
            display: 'flex',
            gap: '8px',
            margin: '2px 0',
            paddingLeft: '4px',
          }}
        >
          <span style={{ color: 'rgba(255, 255, 255, 0.4)', flexShrink: 0 }}>&#8226;</span>
          <span>{parseInline(listContent, keyIndex++)}</span>
        </div>
      )
      continue
    }

    // Numbered list items
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^(\s*\d+\.)\s(.*)/)
      if (match) {
        nodes.push(
          <div
            key={`ol-${keyIndex++}`}
            style={{
              display: 'flex',
              gap: '8px',
              margin: '2px 0',
              paddingLeft: '4px',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', flexShrink: 0 }}>{match[1]}</span>
            <span>{parseInline(match[2], keyIndex++)}</span>
          </div>
        )
        continue
      }
    }

    // Headings (### Heading)
    if (line.startsWith('### ')) {
      nodes.push(
        <div
          key={`h3-${keyIndex++}`}
          style={{
            fontWeight: 600,
            fontSize: '14px',
            margin: '12px 0 4px',
            color: '#ffffff',
          }}
        >
          {parseInline(line.slice(4), keyIndex++)}
        </div>
      )
      continue
    }

    if (line.startsWith('## ')) {
      nodes.push(
        <div
          key={`h2-${keyIndex++}`}
          style={{
            fontWeight: 600,
            fontSize: '15px',
            margin: '12px 0 4px',
            color: '#ffffff',
          }}
        >
          {parseInline(line.slice(3), keyIndex++)}
        </div>
      )
      continue
    }

    // Regular paragraph
    nodes.push(
      <div key={`p-${keyIndex++}`} style={{ margin: '2px 0' }}>
        {parseInline(line, keyIndex++)}
      </div>
    )
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    nodes.push(
      <pre
        key={`code-${keyIndex++}`}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          padding: '10px 12px',
          margin: '8px 0',
          overflowX: 'auto',
          fontSize: '13px',
          fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Menlo, Consolas, monospace",
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        <code>{codeBlockLines.join('\n')}</code>
      </pre>
    )
  }

  return nodes
}

/**
 * Parse inline markdown: **bold**, `code`, and hex color swatches.
 */
function parseInline(text: string, baseKey: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  // Match **bold**, `code`, or hex colors like #0ea5e9
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+?)`)|(\#[0-9a-fA-F]{6}\b)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let inlineKey = 0

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (match[1]) {
      // **bold**
      nodes.push(
        <strong key={`b-${baseKey}-${inlineKey++}`} style={{ fontWeight: 600, color: '#ffffff' }}>
          {match[2]}
        </strong>
      )
    } else if (match[3]) {
      // `inline code`
      nodes.push(
        <code
          key={`ic-${baseKey}-${inlineKey++}`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            padding: '1px 5px',
            fontSize: '12px',
            fontFamily: "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
          }}
        >
          {match[4]}
        </code>
      )
    } else if (match[5]) {
      // Hex color with inline swatch
      const hex = match[5]
      nodes.push(
        <span
          key={`hex-${baseKey}-${inlineKey++}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: hex,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              verticalAlign: 'middle',
              flexShrink: 0,
            }}
          />
          <code
            style={{
              fontSize: '12px',
              fontFamily: "'SF Mono', 'Fira Code', Menlo, Consolas, monospace",
              color: '#e2e8f0',
            }}
          >
            {hex}
          </code>
        </span>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user'

  const parsedContent = useMemo(() => {
    if (isUser) return null
    return parseContent(content)
  }, [content, isUser])

  const timeStr = timestamp.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: '4px',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '88%',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          backgroundColor: isUser ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: isUser
            ? '1px solid rgba(14, 165, 233, 0.25)'
            : '1px solid rgba(255, 255, 255, 0.08)',
          color: '#ffffff',
          fontSize: '14px',
          lineHeight: '1.55',
          wordBreak: 'break-word',
        }}
      >
        {isUser ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {parsedContent}
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: '6px',
                  height: '16px',
                  backgroundColor: '#0ea5e9',
                  marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'chatCursorBlink 1s step-end infinite',
                }}
              />
            )}
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.35)',
          padding: isUser ? '0 6px 0 0' : '0 0 0 6px',
        }}
      >
        {isUser ? 'You' : 'Brand Assistant'} &middot; {timeStr}
      </span>

      <style>{`
        @keyframes chatCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
