import { createClient } from '@supabase/supabase-js';

// AgentPM Identity Service connection
const AGENTPM_SUPABASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';
const AGENTPM_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_ANON_KEY || '';

// Create Supabase client for AgentPM
export const agentpmClient = createClient(AGENTPM_SUPABASE_URL, AGENTPM_SUPABASE_ANON_KEY);

// OAuth configuration for Canvas
export const OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_AGENTPM_CLIENT_ID || 'canvas-funnelists-dev',
  clientSecret: process.env.AGENTPM_CLIENT_SECRET || 'canvas_secret_dev_placeholder',
  redirectUri: process.env.NEXT_PUBLIC_AGENTPM_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  agentpmBaseUrl: AGENTPM_SUPABASE_URL,
  scopes: ['read:keys', 'read:profile'],
};
