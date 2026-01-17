/**
 * Unified API Key Manager
 * Provides a single interface for getting API keys from either:
 * 1. AgentPM (for federated users)
 * 2. Local storage (for standalone users)
 */

import { ImageProvider } from './providers/types';
import { getApiKey as getLocalApiKey, getApiKeyStatuses as getLocalApiKeyStatuses, ApiKeyStatus } from './apiKeyStorage';
import { isFederatedUser, getAgentPMApiKey, fetchAgentPMApiKeys, ApiKeyInfo } from './agentpm-oauth';

// Reverse map - maps Canvas provider IDs to AgentPM provider names
const REVERSE_PROVIDER_MAP: Record<ImageProvider, string[]> = {
  'openai': ['openai'],
  'stability': ['stability', 'stability-ai', 'stabilityai'],
  'replicate': ['replicate'],
  'anthropic': ['anthropic'],
};

/**
 * Get an API key for a specific provider
 * For federated users: fetches from AgentPM
 * For standalone users: fetches from local storage
 */
export async function getApiKey(provider: ImageProvider): Promise<string | null> {
  // Check if user is federated (logged in via AgentPM SSO)
  if (isFederatedUser()) {
    // Try all possible provider name variations
    const providerNames = REVERSE_PROVIDER_MAP[provider] || [provider];

    for (const providerName of providerNames) {
      const key = await getAgentPMApiKey(providerName);
      if (key) {
        return key;
      }
    }

    return null;
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
