'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Palette, Mail, Lock, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { signUp } from '@/lib/agentpm-oauth';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password);
      if (result.success) {
        if (result.needsConfirmation) {
          setSuccess('Check your email to confirm your account!');
        } else {
          router.push('/');
        }
      } else {
        setError(result.error || 'Failed to sign up');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    width: '100%',
    maxWidth: '400px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 12px 12px 44px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#0ea5e9',
    color: '#fff',
    fontWeight: 500,
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.5 : 1,
    transition: 'background 0.15s ease',
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '2rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Palette style={{ width: '28px', height: '28px', color: '#fff' }} />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Canvas</span>
      </div>

      <h1 style={{ fontSize: '1.25rem', fontWeight: 600, textAlign: 'center', marginBottom: '0.5rem', color: '#fff' }}>
        Create Account
      </h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginBottom: '2rem' }}>
        Sign up for a Funnelists account
      </p>

      {error && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#4ade80',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle style={{ width: '18px', height: '18px' }} />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.4)' }} />
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? (
            <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              Create Account
              <ArrowRight style={{ width: '20px', height: '20px' }} />
            </>
          )}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#0ea5e9', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
