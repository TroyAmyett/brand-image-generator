/**
 * Funnelists Auth Types
 * Shared types for authentication, subscriptions, and API key management
 */

// ============================================================================
// Subscription Tiers
// ============================================================================

/**
 * Platform-funded tiers - use platform's API keys
 * These tiers do not require users to bring their own keys
 */
export const PLATFORM_FUNDED_TIERS = ['beta', 'trial', 'demo', 'free'] as const;
export type PlatformFundedTier = typeof PLATFORM_FUNDED_TIERS[number];

/**
 * BYOK (Bring Your Own Key) tiers - require user's own API keys
 * These are paid tiers that require users to configure their own keys in AgentPM
 * Note: 'professional' is an alias for 'pro' used in some apps
 */
export const BYOK_TIERS = ['friends_family', 'starter', 'pro', 'professional', 'business', 'enterprise'] as const;
export type BYOKTier = typeof BYOK_TIERS[number];

/**
 * All subscription tiers
 */
export const ALL_TIERS = [...PLATFORM_FUNDED_TIERS, ...BYOK_TIERS] as const;
export type SubscriptionTier = typeof ALL_TIERS[number];

/**
 * Subscription status
 */
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

/**
 * Subscription record
 */
export interface Subscription {
  id: string;
  account_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  stripe_subscription_id?: string;
}

// ============================================================================
// API Key Management
// ============================================================================

/**
 * Supported AI providers
 */
export const AI_PROVIDERS = ['anthropic', 'openai', 'gemini', 'stability', 'replicate'] as const;
export type AIProvider = typeof AI_PROVIDERS[number];

/**
 * Source of the API key being used
 */
export type ApiKeySource = 'platform' | 'byok' | 'none';

/**
 * Result from API key resolution
 */
export interface ApiKeyResult {
  key: string | null;
  source: ApiKeySource;
  error?: string;
}

/**
 * API key status for UI display
 */
export interface ApiKeyStatus {
  provider: AIProvider;
  providerName: string;
  isConfigured: boolean;
  source: ApiKeySource;
  keyHint?: string;
  isValid?: boolean;
  lastValidatedAt?: Date | null;
  required: boolean;
}

// ============================================================================
// Account & User Context
// ============================================================================

/**
 * Minimal account info needed for tier checking
 */
export interface AccountInfo {
  id: string;
  slug?: string;
  plan?: SubscriptionTier;
}

/**
 * Minimal user profile info needed for tier checking
 */
export interface UserProfile {
  id: string;
  isSuperAdmin?: boolean;
}

/**
 * Context needed for API key resolution
 */
export interface AuthContext {
  userId?: string;
  account?: AccountInfo | null;
  profile?: UserProfile | null;
  subscription?: Subscription | null;
}

// ============================================================================
// AgentPM Integration
// ============================================================================

/**
 * AgentPM URLs for different environments
 */
export const AGENTPM_URLS = {
  production: 'https://agentpm.funnelists.com',
  staging: 'https://staging-agentpm.funnelists.com',
  local: 'http://localhost:5173',
} as const;

/**
 * API key info returned from AgentPM
 */
export interface AgentPMKeyInfo {
  id: string;
  provider: AIProvider;
  key_hint: string;
  is_valid: boolean;
  last_used_at?: string;
  created_at: string;
}
