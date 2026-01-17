'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  validateLinkingState,
  completeAccountLinking,
  getLocalApiKeysForMigration,
  migrateKeysToAgentPM,
} from '@/lib/agentpm-oauth';

interface LocalKey {
  provider: string;
  keyHint: string;
  selected: boolean;
}

function LinkCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'migration' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [emailMismatch, setEmailMismatch] = useState<{ canvas?: string; agentpm?: string } | null>(null);
  const [agentpmEmail, setAgentpmEmail] = useState<string | null>(null);
  const [localKeys, setLocalKeys] = useState<LocalKey[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; count?: number } | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth error response
      if (errorParam) {
        setStatus('error');
        setError(errorDescription || errorParam);
        return;
      }

      // Validate required parameters
      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state parameter');
        return;
      }

      // Validate and parse linking state
      const linkingState = validateLinkingState(state);
      if (!linkingState) {
        setStatus('error');
        setError('Invalid state parameter - possible CSRF attack or session expired');
        return;
      }

      try {
        // Complete account linking
        const result = await completeAccountLinking(code, linkingState);

        if (!result.success) {
          setStatus('error');
          setError(result.error || 'Failed to link account');
          if (result.emailMismatch) {
            setEmailMismatch({
              canvas: linkingState.canvasEmail,
              agentpm: result.agentpmEmail,
            });
          }
          return;
        }

        setAgentpmEmail(result.agentpmEmail || null);

        // Check for local keys to migrate
        const keys = getLocalApiKeysForMigration();
        if (keys.length > 0) {
          setLocalKeys(keys.map(k => ({ ...k, selected: true })));
          setStatus('migration');
        } else {
          setStatus('success');
          // Redirect to home after short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to complete account linking');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const handleMigrateKeys = async () => {
    setIsMigrating(true);
    const selectedProviders = localKeys.filter(k => k.selected).map(k => k.provider);

    if (selectedProviders.length === 0) {
      // Skip migration, go to success
      setStatus('success');
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    const result = await migrateKeysToAgentPM(selectedProviders);
    setMigrationResult({ success: result.success, count: result.migratedCount });
    setIsMigrating(false);

    if (result.success) {
      setStatus('success');
      setTimeout(() => router.push('/'), 2000);
    } else {
      setError(result.error || 'Failed to migrate keys');
    }
  };

  const handleSkipMigration = () => {
    setStatus('success');
    setTimeout(() => router.push('/'), 2000);
  };

  const toggleKeySelection = (provider: string) => {
    setLocalKeys(prev =>
      prev.map(k => k.provider === provider ? { ...k, selected: !k.selected } : k)
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg, #1a1a2e)',
      color: 'var(--color-text, #ffffff)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
      }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: 'var(--color-accent, #7c3aed)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 1s linear infinite',
            }} />
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Linking your account...
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Completing connection with AgentPM
            </p>
          </>
        )}

        {status === 'migration' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-accent, #7c3aed)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Account Linked!
            </h1>
            {agentpmEmail && (
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                Connected to <strong>{agentpmEmail}</strong>
              </p>
            )}

            <div style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                Migrate your API keys to AgentPM?
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                We found {localKeys.length} API key(s) stored locally. Select which ones to associate with your AgentPM account:
              </p>

              <div style={{ marginBottom: '1rem' }}>
                {localKeys.map(key => (
                  <label
                    key={key.provider}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: key.selected ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      border: key.selected ? '1px solid rgba(124,58,237,0.5)' : '1px solid transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={key.selected}
                      onChange={() => toggleKeySelection(key.provider)}
                      style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                    />
                    <div>
                      <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{key.provider}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                        {key.keyHint}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleMigrateKeys}
                  disabled={isMigrating}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--color-accent, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: isMigrating ? 'wait' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    opacity: isMigrating ? 0.7 : 1,
                  }}
                >
                  {isMigrating ? 'Migrating...' : 'Migrate Selected Keys'}
                </button>
                <button
                  onClick={handleSkipMigration}
                  disabled={isMigrating}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'transparent',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-success, #22c55e)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Account Linked Successfully!
            </h1>
            {migrationResult?.success && migrationResult.count && migrationResult.count > 0 && (
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                {migrationResult.count} API key(s) migrated to AgentPM
              </p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              Redirecting to Canvas...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--color-danger, #ef4444)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              Linking Failed
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
              {error}
            </p>

            {emailMismatch && (
              <div style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left',
              }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <strong>Email Mismatch:</strong>
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                  Canvas: {emailMismatch.canvas || 'Unknown'}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                  AgentPM: {emailMismatch.agentpm || 'Unknown'}
                </p>
              </div>
            )}

            <button
              onClick={() => router.push('/')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--color-accent, #7c3aed)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Return to Canvas
            </button>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg, #1a1a2e)',
      color: 'var(--color-text, #ffffff)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        maxWidth: '400px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(255,255,255,0.3)',
          borderTopColor: 'var(--color-accent, #7c3aed)',
          borderRadius: '50%',
          margin: '0 auto 1.5rem',
          animation: 'spin 1s linear infinite',
        }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          Loading...
        </h1>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function LinkCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LinkCallbackContent />
    </Suspense>
  );
}
