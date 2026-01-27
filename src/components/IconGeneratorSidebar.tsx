'use client';

import { useState } from 'react';
import { Package, Wand2, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/ui/components/Button/Button';

interface IconGeneratorSidebarProps {
  mode: 'auto' | 'square';
  onModeChange: (mode: 'auto' | 'square') => void;
  padding: number;
  onPaddingChange: (padding: number) => void;
  background: 'transparent' | 'white';
  onBackgroundChange: (bg: 'transparent' | 'white') => void;
  onGenerate: () => void;
  canGenerate: boolean;
  isLoading: boolean;
}

export function IconGeneratorSidebar({
  mode,
  onModeChange,
  padding,
  onPaddingChange,
  background,
  onBackgroundChange,
  onGenerate,
  canGenerate,
  isLoading,
}: IconGeneratorSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '280px',
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '8px 0' : '8px 12px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Package style={{ width: '24px', height: '24px', color: '#0ea5e9', flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>Icon Generator</span>
          )}
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
            marginBottom: '8px',
          }}
          title="Expand sidebar"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}

      {/* Content */}
      {!collapsed && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Detection Mode */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Wand2 size={14} />
              Detection Mode
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onModeChange('auto')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: mode === 'auto' ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: mode === 'auto' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  color: mode === 'auto' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Auto-detect
              </button>
              <button
                onClick={() => onModeChange('square')}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: mode === 'square' ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: mode === 'square' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  color: mode === 'square' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Already Square
              </button>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '8px',
                lineHeight: 1.4,
              }}
            >
              {mode === 'auto'
                ? 'AI will detect and extract the icon from your logo'
                : 'Use the entire image as-is'}
            </p>
          </div>

          {/* Padding Slider */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <span>Safe Zone Padding</span>
              <span style={{ color: '#0ea5e9' }}>{padding}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={padding}
              onChange={(e) => onPaddingChange(parseInt(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.1)',
                outline: 'none',
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Background */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Settings size={14} />
              Background
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onBackgroundChange('transparent')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border:
                    background === 'transparent'
                      ? '1px solid #0ea5e9'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  background:
                    background === 'transparent'
                      ? 'rgba(14, 165, 233, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                  color: background === 'transparent' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: `linear-gradient(45deg, #666 25%, transparent 25%),
                      linear-gradient(-45deg, #666 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #666 75%),
                      linear-gradient(-45deg, transparent 75%, #666 75%)`,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                  }}
                />
                Transparent
              </button>
              <button
                onClick={() => onBackgroundChange('white')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border:
                    background === 'white' ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
                  background:
                    background === 'white' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  color: background === 'white' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '3px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: '#fff',
                  }}
                />
                White
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <div style={{ marginTop: 'auto' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={onGenerate}
              disabled={!canGenerate || isLoading}
              isLoading={isLoading}
              style={{ width: '100%' }}
            >
              {isLoading ? 'Generating...' : 'Generate Icons'}
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed state - just show generate button */}
      {collapsed && (
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={onGenerate}
            disabled={!canGenerate || isLoading}
            title="Generate Icons"
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: '8px',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              background: 'rgba(14, 165, 233, 0.2)',
              color: '#0ea5e9',
              cursor: canGenerate && !isLoading ? 'pointer' : 'not-allowed',
              opacity: canGenerate && !isLoading ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={20} />
          </button>
        </div>
      )}
    </aside>
  );
}

export default IconGeneratorSidebar;
