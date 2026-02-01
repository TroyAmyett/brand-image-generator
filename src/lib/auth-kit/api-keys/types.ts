/**
 * API Key Management Types
 */

import type { AIProvider, ApiKeyResult, ApiKeyStatus, AuthContext } from '../types';

/**
 * Configuration for the API key service
 */
export interface ApiKeyServiceConfig {
  /**
   * Base URL for AgentPM API
   * Defaults to AGENTPM_URLS.production
   */
  agentpmUrl?: string;

  /**
   * Platform API keys by provider (from environment)
   * Only used for platform-funded tiers
   */
  platformKeys?: Partial<Record<AIProvider, string>>;

  /**
   * Custom fetch function (for server-side use with different auth)
   */
  fetch?: typeof fetch;
}

/**
 * Interface for fetching user's BYOK keys from AgentPM
 */
export interface BYOKKeyFetcher {
  /**
   * Fetch a decrypted API key for a provider
   * @param provider - The AI provider
   * @param userId - The user's ID
   * @returns The decrypted key or null
   */
  getKey(provider: AIProvider, userId: string): Promise<string | null>;

  /**
   * Check if a key is configured (without decrypting)
   * @param provider - The AI provider
   * @param userId - The user's ID
   * @returns Key status information
   */
  getKeyStatus(provider: AIProvider, userId: string): Promise<ApiKeyStatus>;
}

/**
 * Options for resolving an API key
 */
export interface ResolveKeyOptions {
  /**
   * The AI provider to get a key for
   */
  provider: AIProvider;

  /**
   * Authentication context (user, account, profile)
   */
  context: AuthContext;

  /**
   * Optional: override default config
   */
  config?: ApiKeyServiceConfig;
}
