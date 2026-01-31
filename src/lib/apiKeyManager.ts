/**
 * Unified API Key Manager
 * Provides a single interface for getting API keys from either:
 * 1. AgentPM (for federated users) - uses shared @funnelists/auth
 * 2. Local storage (for standalone users)
 */

import { ImageProvider } from './providers/types';
import { getApiKey as getLocalApiKey, getApiKeyStatuses as getLocalApiKeyStatuses, ApiKeyStatus } from './apiKeyStorage';
import { isFederatedUser, getAgentPMApiKey, fetchAgentPMApiKeys, ApiKeyInfo, getCachedUserProfile } from './agentpm-oauth';
import {
  resolveApiKey,
  type AuthContext,
  type AIProvider as SharedAIProvider,
  AGENTPM_URLS,
} from '@funnelists/auth';

// AgentPM URL for API calls
const AGENTPM_URL = process.env.NEXT_PUBLIC_AGENTPM_URL || AGENTPM_URLS.production;

// Reverse map - maps Canvas provider IDs to AgentPM provider names
const REVERSE_PROVIDER_MAP: Record<ImageProvider, string[]> = {
  'openai': ['openai'],
  'stability': ['stability', 'stability-ai', 'stabilityai'],
  'replicate': ['replicate'],
  'anthropic': ['anthropic'],
};

/**
 * Build auth context for federated users
 */
function buildFederatedAuthContext(): AuthContext {
  const user = getCachedUserProfile();
  return {
    userId: user?.id,
    // For Canvas, we don't have full account info locally
    // The shared service will fetch from AgentPM
    account: null,
    profile: user ? { id: user.id } : null,
  };
}

/**
 * Get an API key for a specific provider
 * For federated users: uses shared @funnelists/auth to fetch from AgentPM
 * For standalone users: fetches from local storage
 */
export async function getApiKey(provider: ImageProvider): Promise<string | null> {
  // Check if user is federated (logged in via AgentPM SSO)
  if (isFederatedUser()) {
    const context = buildFederatedAuthContext();

    // Map ImageProvider to SharedAIProvider if needed
    const sharedProvider = provider as SharedAIProvider;

    // Use shared resolver to get the key
    const result = await resolveApiKey({
      provider: sharedProvider,
      context,
      config: {
        agentpmUrl: AGENTPM_URL,
        // Canvas doesn't have platform keys - always BYOK for image generation
        platformKeys: {},
      },
    });

    return result.key;
  }

  // Standalone user - use local storage
  return getLocalApiKey(provider);
}

/**
 * Get API key statuses for all providers
 * For federated users: fetches from AgentPM
 * For standalone users: fetches from local storage
 */
export async function getApiKeyStatuses(): Promise<ApiKeyStatus[]> {
  // Check if user is federated
  if (isFederatedUser()) {
    try {
      const agentpmKeys = await fetchAgentPMApiKeys();

      // Convert AgentPM key info to ApiKeyStatus format
      const providers: ImageProvider[] = ['openai', 'stability', 'replicate', 'anthropic'];
      const providerNames: Record<ImageProvider, string> = {
        'openai': 'OpenAI DALL-E 3',
        'stability': 'Stability AI',
        'replicate': 'Replicate (Flux)',
        'anthropic': 'Anthropic Claude',
      };

      return providers.map(provider => {
        const providerVariants = REVERSE_PROVIDER_MAP[provider] || [provider];
        const agentpmKey = agentpmKeys.find(k =>
          providerVariants.includes(k.provider.toLowerCase())
        );

        return {
          provider,
          providerName: providerNames[provider],
          isConfigured: !!agentpmKey,
          keyHint: agentpmKey?.key_hint || null,
          isValid: !!agentpmKey,
          lastValidatedAt: agentpmKey?.last_used_at ? new Date(agentpmKey.last_used_at) : null,
          source: 'agentpm' as const,
        };
      });
    } catch (error) {
      console.error('Failed to fetch AgentPM keys:', error);
      // Fall back to local keys on error
      return getLocalApiKeyStatuses();
    }
  }

  // Standalone user - use local storage
  return getLocalApiKeyStatuses();
}

/**
 * Check if user has an API key configured for a provider
 */
export async function hasApiKey(provider: ImageProvider): Promise<boolean> {
  const key = await getApiKey(provider);
  return !!key;
}

/**
 * Get federated keys info (for display only, not decrypted)
 */
export async function getFederatedKeysInfo(): Promise<ApiKeyInfo[]> {
  if (!isFederatedUser()) {
    return [];
  }

  return fetchAgentPMApiKeys();
}
