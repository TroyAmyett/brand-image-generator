/**
 * API Key Resolution Service
 *
 * Provides unified API key resolution across all Funnelists apps.
 * Determines whether to use platform keys or BYOK based on subscription tier.
 */

import {
  type AIProvider,
  type ApiKeyResult,
  type ApiKeyStatus,
  type AuthContext,
  AGENTPM_URLS,
} from '../types';
import { isPlatformFunded, getAccountTier, getTierDisplayName } from '../tiers';
import type { ApiKeyServiceConfig, ResolveKeyOptions } from './types';

/**
 * Provider display names for error messages
 */
const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  stability: 'Stability AI',
  replicate: 'Replicate',
};

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: Required<ApiKeyServiceConfig> = {
  agentpmUrl: AGENTPM_URLS.production,
  platformKeys: {},
  fetch: globalThis.fetch,
};

/**
 * Merge user config with defaults
 */
function mergeConfig(config?: ApiKeyServiceConfig): Required<ApiKeyServiceConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    platformKeys: {
      ...DEFAULT_CONFIG.platformKeys,
      ...config?.platformKeys,
    },
  };
}

/**
 * Fetch a BYOK key from AgentPM
 *
 * @param provider - The AI provider
 * @param userId - The user's ID
 * @param config - Service configuration
 * @returns The decrypted key or null
 */
async function fetchBYOKKey(
  provider: AIProvider,
  userId: string,
  config: Required<ApiKeyServiceConfig>
): Promise<string | null> {
  try {
    const response = await config.fetch(`${config.agentpmUrl}/api/keys/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ provider, userId }),
    });

    if (!response.ok) {
      console.warn(`[ApiKeyService] Failed to fetch ${provider} key: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.key || null;
  } catch (error) {
    console.error(`[ApiKeyService] Error fetching ${provider} key:`, error);
    return null;
  }
}

/**
 * Fetch BYOK key status from AgentPM (without decrypting)
 *
 * @param provider - The AI provider
 * @param userId - The user's ID
 * @param config - Service configuration
 * @returns Key status information
 */
async function fetchBYOKKeyStatus(
  provider: AIProvider,
  userId: string,
  config: Required<ApiKeyServiceConfig>
): Promise<{ configured: boolean; keyHint?: string }> {
  try {
    const response = await config.fetch(
      `${config.agentpmUrl}/api/keys/status?provider=${provider}&userId=${userId}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      return { configured: false };
    }

    const data = await response.json();
    return {
      configured: data.configured || false,
      keyHint: data.keyHint,
    };
  } catch (error) {
    console.error(`[ApiKeyService] Error checking ${provider} key status:`, error);
    return { configured: false };
  }
}

/**
 * Resolve an API key based on subscription tier
 *
 * This is the main entry point for getting API keys across all apps.
 *
 * Strategy:
 * - Platform-funded tiers (beta, trial, demo, free, super admin): Use platform keys
 * - BYOK tiers (friends_family, starter, pro, business, enterprise): Fetch from AgentPM
 *
 * @param options - Resolution options
 * @returns API key result with source information
 */
export async function resolveApiKey(options: ResolveKeyOptions): Promise<ApiKeyResult> {
  const { provider, context } = options;
  const config = mergeConfig(options.config);

  // Check if platform-funded
  if (isPlatformFunded(context)) {
    const platformKey = config.platformKeys[provider];

    if (platformKey) {
      console.log(`[ApiKeyService] Platform-funded tier - using platform ${provider} key`);
      return { key: platformKey, source: 'platform' };
    }

    // Platform key not configured - this is a deployment issue
    return {
      key: null,
      source: 'none',
      error: `Platform ${PROVIDER_DISPLAY_NAMES[provider]} key not configured. Please contact support.`,
    };
  }

  // BYOK tier - must use user's stored key
  const { userId } = context;

  if (!userId) {
    return {
      key: null,
      source: 'none',
      error: 'User authentication required',
    };
  }

  // Fetch from AgentPM
  const userKey = await fetchBYOKKey(provider, userId, config);

  if (userKey) {
    console.log(`[ApiKeyService] BYOK tier - using user's ${provider} key`);
    return { key: userKey, source: 'byok' };
  }

  // BYOK tier but no key configured
  const tier = getAccountTier(context.account);
  const tierName = getTierDisplayName(tier);

  return {
    key: null,
    source: 'none',
    error: `Your ${tierName} plan requires you to bring your own ${PROVIDER_DISPLAY_NAMES[provider]} API key. Please add your key in AgentPM Settings > API Keys.`,
  };
}

/**
 * Get key status for a provider (for UI display)
 *
 * @param provider - The AI provider
 * @param context - Authentication context
 * @param config - Optional service configuration
 * @returns Key status for UI display
 */
export async function getApiKeyStatus(
  provider: AIProvider,
  context: AuthContext,
  config?: ApiKeyServiceConfig
): Promise<ApiKeyStatus> {
  const mergedConfig = mergeConfig(config);
  const platformFunded = isPlatformFunded(context);

  // Platform-funded: check if platform key exists
  if (platformFunded) {
    const hasPlatformKey = !!mergedConfig.platformKeys[provider];

    return {
      provider,
      providerName: PROVIDER_DISPLAY_NAMES[provider],
      isConfigured: hasPlatformKey,
      source: hasPlatformKey ? 'platform' : 'none',
      required: false,
    };
  }

  // BYOK: check if user has key configured
  if (!context.userId) {
    return {
      provider,
      providerName: PROVIDER_DISPLAY_NAMES[provider],
      isConfigured: false,
      source: 'none',
      required: true,
    };
  }

  const status = await fetchBYOKKeyStatus(provider, context.userId, mergedConfig);

  return {
    provider,
    providerName: PROVIDER_DISPLAY_NAMES[provider],
    isConfigured: status.configured,
    source: status.configured ? 'byok' : 'none',
    keyHint: status.keyHint,
    required: true,
  };
}

/**
 * Check if API key is configured for a provider
 * Simpler version of getApiKeyStatus for quick checks
 *
 * @param provider - The AI provider
 * @param context - Authentication context
 * @param config - Optional service configuration
 * @returns true if a key is available
 */
export async function hasApiKey(
  provider: AIProvider,
  context: AuthContext,
  config?: ApiKeyServiceConfig
): Promise<boolean> {
  const result = await resolveApiKey({ provider, context, config });
  return result.key !== null;
}

/**
 * Create a configured API key service for a specific app
 * This allows apps to set their platform keys once and reuse
 *
 * @param config - Service configuration
 * @returns Bound service functions
 */
export function createApiKeyService(config: ApiKeyServiceConfig) {
  return {
    resolveKey: (provider: AIProvider, context: AuthContext) =>
      resolveApiKey({ provider, context, config }),

    getStatus: (provider: AIProvider, context: AuthContext) =>
      getApiKeyStatus(provider, context, config),

    hasKey: (provider: AIProvider, context: AuthContext) =>
      hasApiKey(provider, context, config),
  };
}
