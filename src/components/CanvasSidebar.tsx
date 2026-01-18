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
  return (
    <div
      className="w-60 flex-shrink-0 flex flex-col h-full border-r"
      style={{
        background: 'var(--fl-color-bg-surface)',
        borderColor: 'var(--fl-color-border)',
      }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0ea5e9] text-white'
                    : 'hover:bg-white/10'
                }`}
                style={{ color: isActive ? 'white' : 'var(--fl-color-text-secondary)' }}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="my-4 border-t" style={{ borderColor: 'var(--fl-color-border)' }} />

        {/* Settings */}
        <button
          onClick={() => onTabChange(settingsItem.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === settingsItem.id
              ? 'bg-[#0ea5e9] text-white'
              : 'hover:bg-white/10'
          }`}
          style={{ color: activeTab === settingsItem.id ? 'white' : 'var(--fl-color-text-secondary)' }}
        >
          <settingsItem.icon className="w-5 h-5" />
          <span>{settingsItem.label}</span>
        </button>
      </nav>
    </div>
  );
}

export default CanvasSidebar;
