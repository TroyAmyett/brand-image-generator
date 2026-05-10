/**
 * Funnelists shared auth options — INLINE COPY.
 *
 * This file is intentionally duplicated across every Funnelists product
 * (agentpm, radar, canvas, contacts, timechain, bookit, launchpad). Products
 * are standalone at the build layer — no shared-package imports. Suite
 * behavior comes from runtime contracts:
 *
 *   • storageKey: 'funnelists-auth'
 *   • Apex cookie: Domain=.funnelists.com; Secure; SameSite=Lax
 *   • localStorage fallback on localhost / preview deploys
 *
 * KEEP THIS FILE IDENTICAL across products. Divergence breaks cross-subdomain
 * SSO. The reference template lives at packages/auth/src/client/ in the
 * Funnelists workspace.
 *
 * Usage:
 *   import { createClient } from '@supabase/supabase-js'
 *   import { getFunnelistsAuthOptions } from './funnelists-auth'
 *
 *   export const supabase = createClient(url, anonKey, {
 *     auth: getFunnelistsAuthOptions(),
 *   })
 */

const FUNNELISTS_STORAGE_KEY = 'funnelists-auth'
const COOKIE_PATH = '/'
const APEX_DOMAIN = '.funnelists.com'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days

interface SupabaseStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function localStorageAdapter(): SupabaseStorage {
  return {
    getItem(key) {
      if (typeof window === 'undefined') return null
      try { return window.localStorage.getItem(key) } catch { return null }
    },
    setItem(key, value) {
      if (typeof window === 'undefined') return
      try { window.localStorage.setItem(key, value) } catch { /* quota / privacy mode */ }
    },
    removeItem(key) {
      if (typeof window === 'undefined') return
      try { window.localStorage.removeItem(key) } catch { /* */ }
    },
  }
}

function cookieAdapter(domain: string): SupabaseStorage {
  const ls = localStorageAdapter()

  const writeCookie = (key: string, value: string | null) => {
    if (typeof document === 'undefined') return
    const base = `${encodeURIComponent(key)}=`
    if (value === null) {
      document.cookie = `${base}; Domain=${domain}; Path=${COOKIE_PATH}; Max-Age=0; SameSite=Lax; Secure`
      return
    }
    document.cookie = `${base}${encodeURIComponent(value)}; Domain=${domain}; Path=${COOKIE_PATH}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax; Secure`
  }

  const readCookie = (key: string): string | null => {
    if (typeof document === 'undefined') return null
    const re = new RegExp('(?:^|;\\s*)' + escapeRegex(encodeURIComponent(key)) + '=([^;]*)')
    const match = document.cookie.match(re)
    if (!match) return null
    try { return decodeURIComponent(match[1]) } catch { return null }
  }

  return {
    getItem(key) {
      const fromCookie = readCookie(key)
      if (fromCookie !== null) {
        ls.setItem(key, fromCookie)
        return fromCookie
      }
      // Migration fallback: if a previous build left a session in localStorage,
      // promote it to the apex cookie so other subdomains can see it.
      const fromLs = ls.getItem(key)
      if (fromLs !== null) writeCookie(key, fromLs)
      return fromLs
    },
    setItem(key, value) {
      writeCookie(key, value)
      ls.setItem(key, value)
    },
    removeItem(key) {
      writeCookie(key, null)
      ls.removeItem(key)
    },
  }
}

function createStorageAdapter(): SupabaseStorage {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''
  if (host.endsWith(APEX_DOMAIN) || host === 'funnelists.com') {
    return cookieAdapter(APEX_DOMAIN)
  }
  // localhost / preview deploys — apex cookie not applicable, use localStorage.
  return localStorageAdapter()
}

export function getFunnelistsAuthOptions() {
  return {
    storageKey: FUNNELISTS_STORAGE_KEY,
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  } as const
}
