/**
 * Funnelists shared LoginScreen — INLINE COPY.
 *
 * This file is intentionally duplicated across every Funnelists product.
 * Products are standalone-first at the build layer — no `@funnelists/auth`
 * import. The reference template lives at `packages/auth/src/components/`.
 *
 * KEEP THIS FILE IDENTICAL across products. Visual + behavioral parity is
 * what makes the suite feel cohesive. Per-product variation goes in the
 * <LoginScreen /> props at the call site (appName, Icon, OAuth handlers).
 *
 * Funnelists is invite-only — this component has NO signup affordance.
 * New users get in via a separate invite-acceptance page (typically
 * `/signup?invite=<token>`).
 */

import { useState, type ComponentType, type FormEvent } from 'react'
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

type AuthMode = 'signin' | 'reset'

export interface LoginScreenProps {
  /** App name shown next to logo (e.g., 'AgentPM', 'Radar'). */
  appName: string
  /** Optional tagline shown below the headline. */
  tagline?: string
  /** Icon component from lucide-react. */
  Icon: ComponentType<{ className?: string; size?: number | string }>
  /** Sign in with email + password. Return `{ error }` on failure. */
  onSignInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>
  /** Optional: sign in with Google OAuth. Omit to hide the button. */
  onSignInWithGoogle?: () => Promise<{ error?: string }>
  /**
   * Optional: sign in with Microsoft (Supabase `azure` provider — covers
   * both personal Microsoft accounts and Azure AD work accounts). Omit
   * to hide the button.
   */
  onSignInWithMicrosoft?: () => Promise<{ error?: string }>
  /** Send a password-reset email. */
  onResetPassword: (email: string) => Promise<{ error?: string }>
  /** Optional: footer caption under the card. */
  footer?: string
}

export function LoginScreen({
  appName,
  tagline,
  Icon,
  onSignInWithPassword,
  onSignInWithGoogle,
  onSignInWithMicrosoft,
  onResetPassword,
  footer,
}: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<
    'google' | 'microsoft' | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const hasOAuth = Boolean(onSignInWithGoogle || onSignInWithMicrosoft)

  // Cross-app SSO support: respect ?returnUrl=... if present.
  const returnUrl =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('returnUrl')
      : null

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError(null)
    setSuccessMessage(null)
    setPassword('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        const result = await onSignInWithPassword(email, password)
        if (result.error) {
          setError(result.error)
        } else if (returnUrl) {
          window.location.href = returnUrl
        }
      } else {
        const result = await onResetPassword(email)
        if (result.error) {
          setError(result.error)
        } else {
          setSuccessMessage(
            `Password reset email sent. Check ${email} for the link.`,
          )
          setMode('signin')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (
    provider: 'google' | 'microsoft',
    handler: () => Promise<{ error?: string }>,
  ) => {
    setError(null)
    setOauthLoading(provider)
    try {
      const result = await handler()
      if (result.error) setError(result.error)
      // On success, Supabase redirects — we won't return here.
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `${provider === 'google' ? 'Google' : 'Microsoft'} sign-in failed`,
      )
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-sky-500 to-teal-500">
              <Icon size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {mode === 'signin'
                ? `Welcome to ${appName}`
                : 'Reset your password'}
            </h1>
            {tagline && mode === 'signin' && (
              <p className="text-sm text-white/60 mt-1.5">{tagline}</p>
            )}
            {mode === 'reset' && (
              <p className="text-sm text-white/60 mt-1.5">
                We&apos;ll email you a reset link.
              </p>
            )}
          </div>

          {/* Success */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a24] border border-white/[0.06] focus-within:border-sky-500 transition-colors">
              <Mail size={16} className="text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                autoComplete="email"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/40"
              />
            </div>

            {mode === 'signin' && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a24] border border-white/[0.06] focus-within:border-sky-500 transition-colors">
                <Lock size={16} className="text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/40"
                />
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-xs text-white/60 hover:text-white/90 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-1 rounded-lg bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading
                ? 'Working...'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Send reset link'}
            </button>
          </form>

          {/* OAuth providers — only shown on signin if at least one is wired */}
          {mode === 'signin' && hasOAuth && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-xs text-white/40">or</span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>
              <div className="space-y-2">
                {onSignInWithGoogle && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('google', onSignInWithGoogle)}
                    disabled={oauthLoading !== null}
                    className="w-full py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {oauthLoading === 'google' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <GoogleGlyph />
                    )}
                    {oauthLoading === 'google'
                      ? 'Working...'
                      : 'Continue with Google'}
                  </button>
                )}
                {onSignInWithMicrosoft && (
                  <button
                    type="button"
                    onClick={() =>
                      handleOAuth('microsoft', onSignInWithMicrosoft)
                    }
                    disabled={oauthLoading !== null}
                    className="w-full py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {oauthLoading === 'microsoft' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <MicrosoftGlyph />
                    )}
                    {oauthLoading === 'microsoft'
                      ? 'Working...'
                      : 'Continue with Microsoft'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Back to sign-in (reset mode only) */}
          {mode === 'reset' && (
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            </div>
          )}

          {/* Invite-only notice (always visible on signin mode) */}
          {mode === 'signin' && (
            <p className="text-center text-xs text-white/40 mt-6">
              {appName} is invite-only. Need access?{' '}
              <a
                href="mailto:troy@funnelists.com"
                className="text-white/60 hover:text-white/90 transition-colors"
              >
                Get in touch
              </a>
              .
            </p>
          )}
        </div>

        {/* Footer caption */}
        {footer && (
          <p className="text-center text-xs text-white/40 mt-6">{footer}</p>
        )}
      </div>
    </div>
  )
}

/** Inline Google "G" logo so the component has no external SVG dependency. */
function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

/** Inline Microsoft 4-square logo (per Microsoft brand guidelines). */
function MicrosoftGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}
