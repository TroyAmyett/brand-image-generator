import { createClient, SupabaseClient } from '@supabase/supabase-js';

// AgentPM Identity Service connection (shared Supabase project)
const AGENTPM_SUPABASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';
const AGENTPM_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_ANON_KEY || '';

// Validate that the anon key is configured
if (typeof window !== 'undefined' && (!AGENTPM_SUPABASE_ANON_KEY || AGENTPM_SUPABASE_ANON_KEY.includes('placeholder'))) {
  console.warn(
    '[Supabase] NEXT_PUBLIC_AGENTPM_SUPABASE_ANON_KEY is not configured. ' +
    'Get the anon key from AgentPM Supabase dashboard: Settings > API > Project API keys'
  );
}

// Create Supabase client for AgentPM with auth persistence
export const agentpmClient: SupabaseClient = createClient(AGENTPM_SUPABASE_URL, AGENTPM_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'agentpm-auth',
  },
});

// Get the redirect URL for OAuth callbacks
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin + '/auth/callback';
  }
  return process.env.NEXT_PUBLIC_AGENTPM_REDIRECT_URI || 'http://localhost:3000/auth/callback';
}
