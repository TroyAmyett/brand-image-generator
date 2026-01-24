'use client';

import { Sparkles, History, LayoutTemplate, Settings } from 'lucide-react';

export type CanvasTab = 'generate' | 'history' | 'templates' | 'settings';

interface SidebarItem {
  id: CanvasTab;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const sidebarItems: SidebarItem[] = [
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'history', label: 'History', icon: History },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
];

const settingsItem: SidebarItem = { id: 'settings', label: 'Settings', icon: Settings };

interface CanvasSidebarProps {
  activeTab: CanvasTab;
  onTabChange: (tab: CanvasTab) => void;
}

export function CanvasSidebar({ activeTab, onTabChange }: CanvasSidebarProps) {
  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: isActive ? '#0ea5e9' : 'transparent',
    color: isActive ? 'white' : 'var(--fl-color-text-secondary)',
  });

  return (
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid var(--fl-color-border)',
        background: 'var(--fl-color-bg-surface)',
      }}
    >
      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={buttonStyle(isActive)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div style={{ margin: '16px 0', borderTop: '1px solid var(--fl-color-border)' }} />

        {/* Settings */}
        <button
          onClick={() => onTabChange(settingsItem.id)}
          style={buttonStyle(activeTab === settingsItem.id)}
        >
          <settingsItem.icon size={20} />
          <span>{settingsItem.label}</span>
        </button>
      </nav>
    </div>
  );
}

export default CanvasSidebar;
