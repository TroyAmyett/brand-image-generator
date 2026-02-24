import { createClient, SupabaseClient } from '@supabase/supabase-js';

// AgentPM Identity Service connection (shared Supabase project)
const AGENTPM_SUPABASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';
const AGENTPM_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_ANON_KEY || '';

// Validate that the anon key is configured
if (!AGENTPM_SUPABASE_ANON_KEY || AGENTPM_SUPABASE_ANON_KEY.includes('placeholder')) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Supabase] NEXT_PUBLIC_AGENTPM_SUPABASE_ANON_KEY is not configured. ' +
      'Get the anon key from AgentPM Supabase dashboard: Settings > API > Project API keys'
    );
  }
}

// Create Supabase client with shared auth storage key
// Use a dummy key during build if env var is not set (Canvas works without Supabase for image generation)
const safeAnonKey = AGENTPM_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.build-placeholder';
export const agentpmClient: SupabaseClient = createClient(AGENTPM_SUPABASE_URL, safeAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'funnelists-auth', // Shared across all Funnelists apps
  },
});

// Get the redirect URL for OAuth callbacks
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/auth/callback';
  }
  return process.env.NEXT_PUBLIC_AGENTPM_REDIRECT_URI || 'http://localhost:3000/auth/callback';
}
