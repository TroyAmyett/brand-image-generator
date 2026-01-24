'use client';

import { useState } from 'react';
import { Bot, StickyNote, Palette, Users, ChevronDown } from 'lucide-react';
import { getAppUrl } from '@/lib/appUrls';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
  href?: string;
  comingSoon?: boolean;
}

const tools: Tool[] = [
  { id: 'agentpm', name: 'AgentPM', icon: <Bot size={18} />, description: 'AI project management', href: getAppUrl('agentpm') },
  { id: 'notetaker', name: 'NoteTaker', icon: <StickyNote size={18} />, description: 'Brainstorming & ideation', href: getAppUrl('notetaker') },
  { id: 'canvas', name: 'Canvas', icon: <Palette size={18} />, description: 'AI design & visuals' },
  { id: 'leadgen', name: 'LeadGen', icon: <Users size={18} />, description: 'Lead generation & enrichment', href: getAppUrl('leadgen') },
];

const CURRENT_APP = 'canvas';

export function ToolSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const active = tools.find(t => t.id === CURRENT_APP) || tools[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
          color: 'var(--fl-color-text-primary)',
        }}
      >
        {active.icon}
        <span style={{ fontWeight: 500 }}>{active.name}</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 0.15s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 350 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '100%',
              marginTop: '4px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              minWidth: '220px',
              zIndex: 400,
              background: 'var(--fl-color-bg-surface)',
              border: '1px solid var(--fl-color-border)',
              overflow: 'hidden',
            }}
          >
            {tools.map(tool => (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.comingSoon) return;
                  if (tool.href) {
                    window.location.href = tool.href;
                  }
                  setIsOpen(false);
                }}
                disabled={tool.comingSoon}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  textAlign: 'left',
                  border: 'none',
                  cursor: tool.comingSoon ? 'not-allowed' : 'pointer',
                  opacity: tool.comingSoon ? 0.5 : 1,
                  background: tool.id === CURRENT_APP ? 'var(--fl-color-bg-elevated)' : 'transparent',
                  color: 'var(--fl-color-text-primary)',
                  transition: 'background 0.15s ease',
                }}
              >
                {tool.icon}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tool.name}
                    {tool.comingSoon && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(14, 165, 233, 0.2)',
                          color: '#0ea5e9',
                        }}
                      >
                        Soon
                      </span>
                    )}
                  </div>
                  {tool.description && (
                    <div style={{ fontSize: '12px', color: 'var(--fl-color-text-muted)' }}>
                      {tool.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ToolSwitcher;
