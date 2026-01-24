'use client';

import { useState } from 'react';
import { Button } from '@/ui/components/Button/Button';
import { Input } from '@/ui/components/Input/Input';
import { X, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { signIn, signUp, resetPassword } from '@/lib/agentpm-oauth';

type AuthMode = 'signin' | 'signup' | 'reset';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const result = await signIn(email, password);
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error || 'Sign in failed');
        }
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const result = await signUp(email, password);
        if (result.success) {
          if (result.needsConfirmation) {
            setSuccessMessage('Check your email to confirm your account!');
            setMode('signin');
          } else {
            onSuccess();
            onClose();
          }
        } else {
          setError(result.error || 'Sign up failed');
        }
      } else if (mode === 'reset') {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccessMessage('Password reset email sent! Check your inbox.');
          setMode('signin');
        } else {
          setError(result.error || 'Failed to send reset email');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
  };

  const contentStyle: React.CSSProperties = {
    background: 'var(--fl-color-bg-surface, #1a1a1a)',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid var(--fl-color-border, #2a2a2a)',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '24px',
  };

  const logoStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: 'var(--fl-color-text-primary, #fff)',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    color: 'var(--fl-color-text-secondary, #a1a1aa)',
    fontSize: '14px',
  };

  const inputGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  };

  const alertStyle = (type: 'error' | 'success'): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    background: type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
    color: type === 'error' ? '#ef4444' : '#22c55e',
    fontSize: '14px',
  });

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '24px',
    color: 'var(--fl-color-text-secondary, #a1a1aa)',
    fontSize: '14px',
  };

  const linkStyle: React.CSSProperties = {
    color: '#0ea5e9',
    cursor: 'pointer',
    fontWeight: 500,
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--fl-color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={headerStyle}>
          <div style={logoStyle}>F</div>
          <h2 style={titleStyle}>
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p style={subtitleStyle}>
            {mode === 'signin' && 'Sign in to access your settings'}
            {mode === 'signup' && 'Create your Funnelists account'}
            {mode === 'reset' && "We'll send you a reset link"}
          </p>
        </div>

        {successMessage && (
          <div style={alertStyle('success')}>
            <CheckCircle size={18} />
            {successMessage}
          </div>
        )}

        {error && (
          <div style={alertStyle('error')}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              leftIcon={<Mail size={18} />}
            />

            {mode !== 'reset' && (
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                leftIcon={<Lock size={18} />}
              />
            )}

            {mode === 'signup' && (
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                leftIcon={<Lock size={18} />}
              />
            )}
          </div>

          {mode === 'signin' && (
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <span style={linkStyle} onClick={() => switchMode('reset')}>
                Forgot password?
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            isLoading={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </Button>
        </form>

        <div style={footerStyle}>
          {mode === 'reset' ? (
            <span style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => switchMode('signin')}>
              <ArrowLeft size={14} />
              Back to sign in
            </span>
          ) : (
            <p>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <span style={linkStyle} onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
