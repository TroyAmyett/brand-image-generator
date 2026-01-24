'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Palette, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { resetPassword } from '@/lib/agentpm-oauth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
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

  if (success) {
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

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center',
        }}>
          <CheckCircle style={{ width: '48px', height: '48px', color: '#4ade80' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
            Check your email
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            We sent a password reset link to <strong style={{ color: '#fff' }}>{email}</strong>
          </p>
          <Link
            href="/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#0ea5e9',
              textDecoration: 'none',
              marginTop: '1rem',
            }}
          >
            <ArrowLeft style={{ width: '18px', height: '18px' }} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

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
        Reset Password
      </h1>
      <p style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', marginBottom: '2rem' }}>
        We&apos;ll send you a reset link
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

        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? (
            <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#0ea5e9',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
