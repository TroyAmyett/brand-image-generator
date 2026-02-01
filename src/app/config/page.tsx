'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';

import { CanvasToolNav } from '@/components/CanvasToolNav';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import {
  getApiKeyStatuses,
  saveApiKey,
  deleteApiKey,
  getApiKey as getLocalApiKey,
  ApiKeyStatus,
} from '@/lib/apiKeyStorage';
import { getApiKeyStatuses as getFederatedApiKeyStatuses } from '@/lib/apiKeyManager';
import '@/ui/styles/index.css';

const AGENTPM_URL = process.env.NEXT_PUBLIC_AGENTPM_URL || 'https://agentpm.funnelists.com';

interface Provider {
  id: 'openai' | 'stability' | 'replicate' | 'anthropic';
  name: string;
  description: string;
  keyPrefix: string;
  docsUrl: string;
}

const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI (DALL-E 3)',
    description: 'Used for image generation',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    description: 'Used for image generation',
    keyPrefix: 'sk-',
    docsUrl: 'https://platform.stability.ai/account/keys',
  },
  {
    id: 'replicate',
    name: 'Replicate (Flux)',
    description: 'Used for image generation',
    keyPrefix: 'r8_',
    docsUrl: 'https://replicate.com/account/api-tokens',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    description: 'Used for icon auto-detection',
    keyPrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
];

export default function ConfigPage() {
  const { user, isFederated, isLinked, isLoading: authLoading } = useAuth();
  const isLoggedIn = (isFederated || isLinked) && user;
  const router = useRouter();

  const [keyStatuses, setKeyStatuses] = useState<ApiKeyStatus[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadKeyStatuses = useCallback(async () => {
    setIsLoadingKeys(true);
    try {
      if (isFederated || isLinked) {
        const statuses = await getFederatedApiKeyStatuses();
        setKeyStatuses(statuses);
      } else {
        setKeyStatuses(getApiKeyStatuses());
      }
    } catch (error) {
      console.error('Failed to load key statuses:', error);
      setKeyStatuses(getApiKeyStatuses());
    } finally {
      setIsLoadingKeys(false);
    }
  }, [isFederated, isLinked]);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      loadKeyStatuses();
    }
  }, [authLoading, isLoggedIn, loadKeyStatuses]);

  // Redirect to login when not authenticated
  if (!authLoading && !isLoggedIn) {
    router.push('/login');
    return null;
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: '#0ea5e9' }} />
      </div>
    );
  }

  const handleDeleteKey = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await deleteApiKey(providerId as Provider['id']);
      loadKeyStatuses();
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  };

  const configuredKeys = keyStatuses.filter((k) => k.isConfigured);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#000000',
        paddingTop: '56px',
      }}
    >
      <AppHeader
        toolSwitcher={<CanvasToolNav />}
        settingsButton={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserMenu />
          </div>
        }
      />

      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
          {/* Page Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              Config
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
              API keys and settings for Canvas.
            </p>
          </div>

          {/* User Info */}
          {user && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {(isFederated || isLinked) && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#22c55e',
                    }}
                  >
                    {isFederated ? 'AgentPM SSO' : 'Linked'}
                  </span>
                )}
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  {isFederated || isLinked
                    ? 'API keys managed via AgentPM'
                    : 'Standalone mode - keys stored locally'}
                </span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '14px' }}>
                {user.email}
              </span>
            </div>
          )}

          {/* API Keys Section */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'white',
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Key size={18} />
                  API Keys
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                  Add your API keys to enable image generation and icon detection.
                </p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: '#0ea5e9',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Plus size={16} />
                Add Key
              </button>
            </div>

            {/* Keys List */}
            {isLoadingKeys ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '32px',
                }}
              >
                <Loader2
                  style={{
                    width: '24px',
                    height: '24px',
                    animation: 'spin 1s linear infinite',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}
                />
              </div>
            ) : configuredKeys.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No API keys configured.</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                  Add your keys to enable Canvas features.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {configuredKeys.map((keyStatus) => {
                  const provider = providers.find((p) => p.id === keyStatus.provider);
                  return (
                    <div
                      key={keyStatus.provider}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: keyStatus.isValid ? '#22c55e' : '#eab308',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 500, color: 'white' }}>
                            {provider?.name || keyStatus.provider}
                          </div>
                          <div
                            style={{
                              color: 'rgba(255, 255, 255, 0.4)',
                              fontSize: '13px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {keyStatus.keyHint || '••••••••'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteKey(keyStatus.provider)}
                        style={{
                          padding: '8px',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255, 255, 255, 0.4)',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          transition: 'color 0.15s ease',
                        }}
                        title="Delete key"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Provider Reference */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '12px' }}>
                  Supported Providers
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {providers.map((provider) => (
                    <a
                      key={provider.id}
                      href={provider.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '13px',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{provider.name}</span>
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
          </div>


        </div>
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <AddApiKeyModal
          providers={providers}
          configuredProviders={configuredKeys.map((k) => k.provider)}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadKeyStatuses();
          }}
        />
      )}

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Add API Key Modal
function AddApiKeyModal({
  providers,
  configuredProviders,
  onClose,
  onSuccess,
}: {
  providers: Provider[];
  configuredProviders: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableProviders = providers.filter((p) => !configuredProviders.includes(p.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider || !apiKey.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const provider = providers.find((p) => p.id === selectedProvider);

      // Basic validation
      if (provider && !apiKey.trim().startsWith(provider.keyPrefix)) {
        setError(`Invalid key format. ${provider.name} keys should start with "${provider.keyPrefix}"`);
        setIsSubmitting(false);
        return;
      }

      await saveApiKey(selectedProvider as Provider['id'], apiKey.trim());
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#111118',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '20px' }}>
          Add API Key
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Provider Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '8px',
              }}
            >
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#1a1a1a' }}>
                Select a provider
              </option>
              {availableProviders.map((provider) => (
                <option key={provider.id} value={provider.id} style={{ background: '#1a1a1a' }}>
                  {provider.name}
                </option>
              ))}
            </select>
            {selectedProvider && (
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '6px' }}>
                {providers.find((p) => p.id === selectedProvider)?.description}
              </p>
            )}
          </div>

          {/* API Key Input */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '8px',
              }}
            >
              API Key
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  selectedProvider
                    ? `${providers.find((p) => p.id === selectedProvider)?.keyPrefix}...`
                    : 'Enter your API key'
                }
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.4)',
                  cursor: 'pointer',
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedProvider || !apiKey.trim() || isSubmitting}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#0ea5e9',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor:
                  !selectedProvider || !apiKey.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                opacity: !selectedProvider || !apiKey.trim() || isSubmitting ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting && (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              )}
              Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
