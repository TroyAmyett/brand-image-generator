/**
 * AgentPM OAuth Service
 * Handles SSO integration with AgentPM Identity Service
 *
 * Token format: flt_at_xxx (access), flt_rt_xxx (refresh)
 */

// OAuth configuration
const OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_AGENTPM_CLIENT_ID || 'canvas-funnelists-dev',
  redirectUri: process.env.NEXT_PUBLIC_AGENTPM_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  agentpmBaseUrl: process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co',
  scopes: ['read:keys', 'read:profile'],
};

// Storage keys
const STORAGE_KEYS = {
  accessToken: 'agentpm_access_token',
  refreshToken: 'agentpm_refresh_token',
  tokenExpiry: 'agentpm_token_expiry',
  oauthState: 'agentpm_oauth_state',
  oauthLinkingState: 'agentpm_linking_state',
  userProfile: 'agentpm_user_profile',
  isFederated: 'agentpm_is_federated',
  isLinked: 'agentpm_is_linked',
  linkedAgentPMUserId: 'agentpm_linked_user_id',
  canvasUserId: 'canvas_user_id',
};

// Link callback URL
const LINK_CALLBACK_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/agentpm/link-callback`
  : 'http://localhost:3000/auth/agentpm/link-callback';

export interface AgentPMUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface AgentPMTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface ApiKeyInfo {
  id: string;
  provider: string;
  key_hint: string;
  created_at: string;
  last_used_at?: string;
}

/**
 * Generate a secure random state parameter for OAuth
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const state = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  // Store state for validation
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEYS.oauthState, state);
  }

  return state;
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(state: string): boolean {
  if (typeof window === 'undefined') return false;

  const storedState = sessionStorage.getItem(STORAGE_KEYS.oauthState);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);

  return storedState === state;
}

/**
 * Build OAuth authorization URL
 */
export function buildAuthorizationUrl(): string {
  const state = generateOAuthState();
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIG.scopes.join(' '),
    state,
  });

  // AgentPM OAuth authorize endpoint
  return `${OAUTH_CONFIG.agentpmBaseUrl}/functions/v1/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<AgentPMTokens> {
  const response = await fetch('/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to exchange authorization code');
  }

  const tokens: AgentPMTokens = await response.json();
  storeTokens(tokens);

  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<AgentPMTokens | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token invalid or expired, clear session
      clearSession();
      return null;
    }

    const tokens: AgentPMTokens = await response.json();
    storeTokens(tokens);

    return tokens;
  } catch {
    clearSession();
    return null;
  }
}

/**
 * Store tokens in localStorage
 */
function storeTokens(tokens: AgentPMTokens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
  localStorage.setItem(STORAGE_KEYS.isFederated, 'true');

  // Calculate and store expiry time
  const expiryTime = Date.now() + (tokens.expires_in * 1000);
  localStorage.setItem(STORAGE_KEYS.tokenExpiry, expiryTime.toString());
}

/**
 * Get access token, refreshing if needed
 */
export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const expiryTime = localStorage.getItem(STORAGE_KEYS.tokenExpiry);

  if (!accessToken) return null;

  // Check if token is expired or will expire in next 60 seconds
  if (expiryTime && Date.now() > parseInt(expiryTime) - 60000) {
    const newTokens = await refreshAccessToken();
    return newTokens?.access_token || null;
  }

  return accessToken;
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.refreshToken);
}

/**
 * Check if user is authenticated via AgentPM federation
 */
export function isFederatedUser(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.isFederated) === 'true';
}

/**
 * Fetch user profile from AgentPM
 */
export async function fetchUserProfile(): Promise<AgentPMUser | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
      }
      return null;
    }

    const user: AgentPMUser = await response.json();

    // Cache user profile
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(user));
    }

    return user;
  } catch {
    return null;
  }
}

/**
 * Get cached user profile
 */
export function getCachedUserProfile(): AgentPMUser | null {
  if (typeof window === 'undefined') return null;

  const cached = localStorage.getItem(STORAGE_KEYS.userProfile);
  if (!cached) return null;

  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

/**
 * Fetch API keys from AgentPM
 */
export async function fetchAgentPMApiKeys(): Promise<ApiKeyInfo[]> {
  const accessToken = await getAccessToken();
  if (!accessToken) return [];

  try {
    const response = await fetch('/api/auth/keys', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await refreshAccessToken();
        return fetchAgentPMApiKeys(); // Retry once
      }
      return [];
    }

    const data = await response.json();
    return data.keys || [];
  } catch {
    return [];
  }
}

/**
 * Get decrypted API key from AgentPM
 */
export async function getAgentPMApiKey(provider: string): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  try {
    const response = await fetch(`/api/auth/keys/${encodeURIComponent(provider)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        await refreshAccessToken();
        return getAgentPMApiKey(provider); // Retry once
      }
      return null;
    }

    const data = await response.json();
    return data.api_key || null;
  } catch {
    return null;
  }
}

/**
 * Clear all session data
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.tokenExpiry);
  localStorage.removeItem(STORAGE_KEYS.userProfile);
  localStorage.removeItem(STORAGE_KEYS.isFederated);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);
}

/**
 * Initiate login with AgentPM
 */
export function loginWithAgentPM(): void {
  if (typeof window === 'undefined') return;

  const authUrl = buildAuthorizationUrl();
  window.location.href = authUrl;
}

/**
 * Logout from both Canvas and AgentPM sessions
 */
export async function logout(): Promise<void> {
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);

  // Revoke token on AgentPM side
  if (accessToken) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Ignore errors during logout
    }
  }

  // Clear local session
  clearSession();
}

// ============================================================================
// Account Linking Functions
// ============================================================================

export interface LinkingState {
  canvasUserId: string;
  canvasEmail?: string;
  intent: 'link_account';
  nonce: string;
}

export interface LinkResult {
  success: boolean;
  agentpmUserId?: string;
  agentpmEmail?: string;
  error?: string;
  emailMismatch?: boolean;
}

/**
 * Generate a state parameter for account linking
 * Includes canvas_user_id and linking intent
 */
export function generateLinkingState(canvasUserId: string, canvasEmail?: string): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  const linkingState: LinkingState = {
    canvasUserId,
    canvasEmail,
    intent: 'link_account',
    nonce,
  };

  const stateStr = btoa(JSON.stringify(linkingState));

  // Store for validation
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEYS.oauthLinkingState, stateStr);
  }

  return stateStr;
}

/**
 * Validate and parse linking state
 */
export function validateLinkingState(state: string): LinkingState | null {
  if (typeof window === 'undefined') return null;

  const storedState = sessionStorage.getItem(STORAGE_KEYS.oauthLinkingState);
  sessionStorage.removeItem(STORAGE_KEYS.oauthLinkingState);

  if (storedState !== state) {
    return null;
  }

  try {
    return JSON.parse(atob(state)) as LinkingState;
  } catch {
    return null;
  }
}

/**
 * Build OAuth authorization URL for account linking
 */
export function buildLinkingAuthorizationUrl(canvasUserId: string, canvasEmail?: string): string {
  const state = generateLinkingState(canvasUserId, canvasEmail);
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: LINK_CALLBACK_URL,
    response_type: 'code',
    scope: 'link:account read:keys read:profile',
    state,
  });

  return `${OAUTH_CONFIG.agentpmBaseUrl}/functions/v1/oauth/authorize?${params.toString()}`;
}

/**
 * Initiate account linking with AgentPM
 */
export function initiateAccountLinking(canvasUserId: string, canvasEmail?: string): void {
  if (typeof window === 'undefined') return;

  const authUrl = buildLinkingAuthorizationUrl(canvasUserId, canvasEmail);
  window.location.href = authUrl;
}

/**
 * Complete account linking after OAuth callback
 */
export async function completeAccountLinking(
  code: string,
  linkingState: LinkingState
): Promise<LinkResult> {
  try {
    const response = await fetch('/api/auth/link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        canvasUserId: linkingState.canvasUserId,
        canvasEmail: linkingState.canvasEmail,
        redirectUri: LINK_CALLBACK_URL,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to link account',
        emailMismatch: data.emailMismatch,
      };
    }

    // Store linking status and tokens
    if (data.access_token) {
      storeTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in || 3600,
        token_type: 'Bearer',
      });
    }

    // Mark as linked (not just federated - can be unlinked)
    localStorage.setItem(STORAGE_KEYS.isLinked, 'true');
    localStorage.setItem(STORAGE_KEYS.linkedAgentPMUserId, data.agentpmUserId);
    localStorage.setItem(STORAGE_KEYS.canvasUserId, linkingState.canvasUserId);

    return {
      success: true,
      agentpmUserId: data.agentpmUserId,
      agentpmEmail: data.agentpmEmail,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during linking',
    };
  }
}

/**
 * Check if account is linked to AgentPM
 */
export function isAccountLinked(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.isLinked) === 'true';
}

/**
 * Get linked AgentPM user ID
 */
export function getLinkedAgentPMUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.linkedAgentPMUserId);
}

/**
 * Unlink account from AgentPM
 */
export async function unlinkAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const accessToken = await getAccessToken();

    // Call API to unlink
    const response = await fetch('/api/auth/unlink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        canvasUserId: localStorage.getItem(STORAGE_KEYS.canvasUserId),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.error || 'Failed to unlink account',
      };
    }

    // Clear linking status but keep local data
    localStorage.removeItem(STORAGE_KEYS.isLinked);
    localStorage.removeItem(STORAGE_KEYS.linkedAgentPMUserId);
    localStorage.removeItem(STORAGE_KEYS.isFederated);
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.tokenExpiry);
    localStorage.removeItem(STORAGE_KEYS.userProfile);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during unlinking',
    };
  }
}

/**
 * Get local API keys for migration prompt
 */
export function getLocalApiKeysForMigration(): { provider: string; keyHint: string }[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem('user_api_keys');
    if (!data) return [];

    const keys = JSON.parse(data);
    return keys.map((k: { provider: string; keyHint: string }) => ({
      provider: k.provider,
      keyHint: k.keyHint,
    }));
  } catch {
    return [];
  }
}

/**
 * Migrate local keys to AgentPM (re-associate user_id in shared Supabase)
 */
export async function migrateKeysToAgentPM(
  selectedProviders: string[]
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { success: false, migratedCount: 0, error: 'Not authenticated' };
  }

  try {
    const response = await fetch('/api/auth/migrate-keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        providers: selectedProviders,
        canvasUserId: localStorage.getItem(STORAGE_KEYS.canvasUserId),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        migratedCount: 0,
        error: data.error || 'Failed to migrate keys',
      };
    }

    return {
      success: true,
      migratedCount: data.migratedCount || selectedProviders.length,
    };
  } catch (error) {
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error during migration',
    };
  }
}
