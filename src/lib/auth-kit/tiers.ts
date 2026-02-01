/**
 * Funnelists Tier Management
 * Logic for determining tier-based access to platform resources
 */

import {
  PLATFORM_FUNDED_TIERS,
  BYOK_TIERS,
  type SubscriptionTier,
  type PlatformFundedTier,
  type BYOKTier,
  type AuthContext,
  type AccountInfo,
} from './types';

// Re-export types for convenience
export {
  PLATFORM_FUNDED_TIERS,
  BYOK_TIERS,
  type SubscriptionTier,
  type PlatformFundedTier,
  type BYOKTier,
};

/**
 * Check if a tier is platform-funded (can use platform API keys)
 */
export function isPlatformFundedTier(tier: string): tier is PlatformFundedTier {
  return PLATFORM_FUNDED_TIERS.includes(tier as PlatformFundedTier);
}

/**
 * Check if a tier requires BYOK (must provide own API keys)
 */
export function isBYOKTier(tier: string): tier is BYOKTier {
  return BYOK_TIERS.includes(tier as BYOKTier);
}

/**
 * Get the tier from an account, with fallback to 'free'
 */
export function getAccountTier(account?: AccountInfo | null): SubscriptionTier {
  return account?.plan || 'free';
}

/**
 * Check if the account is a demo/default account
 * These are always platform-funded regardless of tier setting
 */
export function isDemoAccount(account?: AccountInfo | null): boolean {
  if (!account) return false;
  return account.id?.startsWith('default-') || account.slug === 'demo';
}

/**
 * Determine if the current context qualifies for platform-funded access
 *
 * Platform-funded access is granted when:
 * 1. User is a super admin
 * 2. Account is a demo/default account
 * 3. Account tier is in PLATFORM_FUNDED_TIERS (beta, trial, demo, free)
 *
 * @param context - The authentication context
 * @returns true if platform API keys should be used
 */
export function isPlatformFunded(context: AuthContext): boolean {
  const { account, profile } = context;

  // Super admins always get platform-funded access
  if (profile?.isSuperAdmin) {
    return true;
  }

  // Demo/default accounts are platform-funded
  if (isDemoAccount(account)) {
    return true;
  }

  // Check account tier
  const tier = getAccountTier(account);
  return isPlatformFundedTier(tier);
}

/**
 * Determine if the current context requires BYOK
 * This is the inverse of isPlatformFunded
 *
 * @param context - The authentication context
 * @returns true if user must provide their own API keys
 */
export function requiresBYOK(context: AuthContext): boolean {
  return !isPlatformFunded(context);
}

/**
 * Get a human-readable tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const displayNames: Record<SubscriptionTier, string> = {
    beta: 'Beta',
    trial: 'Trial',
    demo: 'Demo',
    free: 'Free',
    friends_family: 'Friends & Family',
    starter: 'Starter',
    pro: 'Professional',
    professional: 'Professional',
    business: 'Business',
    enterprise: 'Enterprise',
  };
  return displayNames[tier] || tier;
}

/**
 * Get tier features/limits (placeholder for future expansion)
 */
export interface TierLimits {
  maxProjects: number;
  maxAgents: number;
  maxTasksPerMonth: number;
  includesTools: boolean;
  includesSupport: 'community' | 'email' | 'priority';
}

export function getTierLimits(tier: SubscriptionTier): TierLimits {
  const limits: Record<SubscriptionTier, TierLimits> = {
    beta: { maxProjects: 5, maxAgents: 3, maxTasksPerMonth: 100, includesTools: true, includesSupport: 'email' },
    trial: { maxProjects: 3, maxAgents: 2, maxTasksPerMonth: 50, includesTools: true, includesSupport: 'community' },
    demo: { maxProjects: 1, maxAgents: 1, maxTasksPerMonth: 10, includesTools: false, includesSupport: 'community' },
    free: { maxProjects: 2, maxAgents: 1, maxTasksPerMonth: 25, includesTools: false, includesSupport: 'community' },
    friends_family: { maxProjects: 10, maxAgents: 5, maxTasksPerMonth: 500, includesTools: true, includesSupport: 'email' },
    starter: { maxProjects: 10, maxAgents: 5, maxTasksPerMonth: 500, includesTools: true, includesSupport: 'email' },
    pro: { maxProjects: 50, maxAgents: 20, maxTasksPerMonth: 2000, includesTools: true, includesSupport: 'email' },
    professional: { maxProjects: 50, maxAgents: 20, maxTasksPerMonth: 2000, includesTools: true, includesSupport: 'email' },
    business: { maxProjects: 200, maxAgents: 50, maxTasksPerMonth: 10000, includesTools: true, includesSupport: 'priority' },
    enterprise: { maxProjects: -1, maxAgents: -1, maxTasksPerMonth: -1, includesTools: true, includesSupport: 'priority' },
  };
  return limits[tier] || limits.free;
}
