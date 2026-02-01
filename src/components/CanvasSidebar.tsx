'use client';

import { useState } from 'react';
import { Sparkles, History, LayoutTemplate, Settings, Palette, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export type CanvasTab = 'generate' | 'history' | 'brand' | 'templates' | 'settings';

interface SidebarItem {
  id: CanvasTab;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

const sidebarItems: SidebarItem[] = [
  { id: 'generate', label: 'Generate', icon: Sparkles },
  { id: 'history', label: 'History', icon: History },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'templates', label: 'Templates', icon: LayoutTemplate },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface CanvasSidebarProps {
  activeTab: CanvasTab;
  onTabChange: (tab: CanvasTab) => void;
}

export function CanvasSidebar({ activeTab, onTabChange }: CanvasSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '256px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: collapsed ? '16px 8px' : '16px',
        transition: 'width 0.2s ease, padding 0.2s ease',
      }}
    >
      {/* App Logo/Name + Collapse Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '8px 0' : '8px 12px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Palette style={{ width: '24px', height: '24px', color: '#0ea5e9', flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>Canvas</span>}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.2s',
            }}
            title="Collapse sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 0',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            transition: 'color 0.2s, background 0.2s',
            marginBottom: '8px',
          }}
          title="Expand sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Navigation Items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                border: isActive ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isActive ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                color: isActive ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}

export default CanvasSidebar;
