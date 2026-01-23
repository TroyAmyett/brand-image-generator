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
  { id: 'canvas', name: 'Canvas', icon: <Palette size={18} />, description: 'AI design & visuals' }, // Current app - no href, no comingSoon
  { id: 'leadgen', name: 'LeadGen', icon: <Users size={18} />, description: 'Lead generation & enrichment', href: getAppUrl('leadgen') },
];

const CURRENT_APP = 'canvas';

export function ToolSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const active = tools.find(t => t.id === CURRENT_APP) || tools[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--fl-color-bg-elevated)]"
        style={{ color: 'var(--fl-color-text-primary)' }}
      >
        {active.icon}
        <span className="font-medium">{active.name}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 350 }} onClick={() => setIsOpen(false)} />
          <div
            className="absolute left-0 top-full mt-1 rounded-lg shadow-lg min-w-[220px]"
            style={{ zIndex: 400, background: 'var(--fl-color-bg-surface)', border: '1px solid var(--fl-color-border)' }}
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
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  tool.comingSoon
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[var(--fl-color-bg-elevated)]'
                } ${tool.id === CURRENT_APP ? 'bg-[var(--fl-color-bg-elevated)]' : ''}`}
                style={{ color: 'var(--fl-color-text-primary)' }}
              >
                {tool.icon}
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {tool.name}
                    {tool.comingSoon && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(14, 165, 233, 0.2)', color: '#0ea5e9' }}
                      >
                        Soon
                      </span>
                    )}
                  </div>
                  {tool.description && (
                    <div className="text-xs" style={{ color: 'var(--fl-color-text-muted)' }}>
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
