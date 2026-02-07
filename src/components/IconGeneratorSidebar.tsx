'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Wand2, Settings, PanelLeftClose, PanelLeftOpen, Key, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/ui/components/Button/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getApiKey, hasApiKey } from '@/lib/apiKeyManager';
import { saveApiKey, deleteApiKey, getApiKey as getLocalApiKey } from '@/lib/apiKeyStorage';

const AGENTPM_URL = process.env.NEXT_PUBLIC_AGENTPM_URL || 'https://agentpm.funnelists.com';

type SidebarTab = 'generate' | 'settings';

interface IconGeneratorSidebarProps {
  mode: 'auto' | 'square';
  onModeChange: (mode: 'auto' | 'square') => void;
  padding: number;
  onPaddingChange: (padding: number) => void;
  background: 'transparent' | 'white' | 'black';
  onBackgroundChange: (bg: 'transparent' | 'white' | 'black') => void;
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
  const [activeTab, setActiveTab] = useState<SidebarTab>('generate');
  const { isFederated, isLinked } = useAuth();

  // API Key state
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [hasPlatformKey, setHasPlatformKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const checkApiKey = useCallback(async () => {
    setIsCheckingKey(true);
    try {
      // Check user's stored key
      const hasKey = await hasApiKey('anthropic');
      setHasAnthropicKey(hasKey);

      // Check platform key availability
      const response = await fetch('/api/platform-keys');
      if (response.ok) {
        const data = await response.json();
        setHasPlatformKey(data.platformKeys?.anthropic || false);
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    } finally {
      setIsCheckingKey(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) {
      setSaveError('Please enter an API key');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Validate the key format
      if (!keyInput.trim().startsWith('sk-ant-')) {
        setSaveError('Invalid Anthropic API key format. Keys should start with sk-ant-');
        return;
      }

      // Save the key
      await saveApiKey('anthropic', keyInput.trim());
      setHasAnthropicKey(true);
      setSaveSuccess(true);
      setKeyInput('');

      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async () => {
    try {
      await deleteApiKey('anthropic');
      setHasAnthropicKey(false);
      setKeyInput('');
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  const renderGenerateTab = () => (
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
        {mode === 'auto' && !hasAnthropicKey && !hasPlatformKey && !isCheckingKey && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              fontSize: '12px',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={14} />
            <span>Anthropic API key required for auto-detect</span>
          </div>
        )}
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onBackgroundChange('transparent')}
            style={{
              flex: '1 1 calc(50% - 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 8px',
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
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: `linear-gradient(45deg, #666 25%, transparent 25%),
                  linear-gradient(-45deg, #666 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #666 75%),
                  linear-gradient(-45deg, transparent 75%, #666 75%)`,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                flexShrink: 0,
              }}
            />
            Transparent
          </button>
          <button
            onClick={() => onBackgroundChange('white')}
            style={{
              flex: '1 1 calc(50% - 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 8px',
              borderRadius: '8px',
              border:
                background === 'white' ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
              background:
                background === 'white' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              color: background === 'white' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: '#fff',
                flexShrink: 0,
              }}
            />
            White
          </button>
          <button
            onClick={() => onBackgroundChange('black')}
            style={{
              flex: '1 1 100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px 8px',
              borderRadius: '8px',
              border:
                background === 'black' ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
              background:
                background === 'black' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
              color: background === 'black' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: '#000',
                flexShrink: 0,
              }}
            />
            Black
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
  );

  const renderSettingsTab = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* API Keys Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          <Key size={14} />
          API Keys
        </div>

        {/* Anthropic API Key */}
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>Anthropic Claude</span>
            {hasAnthropicKey && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: '#22c55e',
                }}
              >
                <Check size={12} />
                Configured
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '12px' }}>
            Required for auto-detection mode to identify icon bounds in logos.
          </p>

          {isFederated || isLinked ? (
            // Federated/Linked users - link to AgentPM
            <a
              href={`${AGENTPM_URL}/settings`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '6px',
                background: 'rgba(14, 165, 233, 0.1)',
                border: '1px solid rgba(14, 165, 233, 0.3)',
                color: '#0ea5e9',
                fontSize: '13px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Manage in AgentPM
              <ExternalLink size={14} />
            </a>
          ) : (
            // Standalone users - manage locally
            <>
              {hasAnthropicKey ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleDeleteKey}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Remove Key
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={isSaving || !keyInput.trim()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      background: 'rgba(14, 165, 233, 0.2)',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                      color: '#0ea5e9',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isSaving || !keyInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: isSaving || !keyInput.trim() ? 0.5 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Save Key'}
                  </button>
                </div>
              )}
              {saveError && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{saveError}</p>
              )}
              {saveSuccess && (
                <p style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px' }}>Key saved successfully!</p>
              )}
            </>
          )}

          {/* Get API Key Link */}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '12px',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              textDecoration: 'none',
            }}
          >
            Get an API key
            <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );

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
          marginBottom: '16px',
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

      {/* Tab Navigation */}
      {!collapsed && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('generate')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: activeTab === 'generate' ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
              background: activeTab === 'generate' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
              color: activeTab === 'generate' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Wand2 size={14} />
            Generate
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: activeTab === 'settings' ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
              background: activeTab === 'settings' ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
              color: activeTab === 'settings' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      )}

      {/* Content */}
      {!collapsed && (activeTab === 'generate' ? renderGenerateTab() : renderSettingsTab())}

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
