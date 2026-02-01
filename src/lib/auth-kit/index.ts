/**
 * @funnelists/auth
 *
 * Shared authentication and API key management for Funnelists apps.
 *
 * Usage:
 * ```typescript
 * import { isPlatformFunded, resolveApiKey } from '@funnelists/auth';
 *
 * // Check if user needs to provide own keys
 * const context = { userId, account, profile };
 * if (isPlatformFunded(context)) {
 *   // Use platform keys
 * } else {
 *   // Fetch from AgentPM
 * }
 *
 * // Or use the unified resolver
 * const { key, source, error } = await resolveApiKey({
 *   provider: 'anthropic',
 *   context,
 *   config: { platformKeys: { anthropic: process.env.ANTHROPIC_API_KEY } }
 * });
 * ```
 */

// Types
export * from './types';

// Tier management
export {
  isPlatformFundedTier,
  isBYOKTier,
  isPlatformFunded,
  requiresBYOK,
  getAccountTier,
  isDemoAccount,
  getTierDisplayName,
  getTierLimits,
  PLATFORM_FUNDED_TIERS,
  BYOK_TIERS,
  type TierLimits,
} from './tiers';

// API key management
export {
  resolveApiKey,
  getApiKeyStatus,
  hasApiKey,
  createApiKeyService,
  type ApiKeyServiceConfig,
  type ResolveKeyOptions,
} from './api-keys';
