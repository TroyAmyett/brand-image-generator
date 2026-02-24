/**
 * Auth Kit - Shared API key resolution for federated users
 * Stub module for Canvas standalone deployment
 */

export type AIProvider = 'openai' | 'stability' | 'replicate' | 'anthropic';

export interface AuthContext {
  userId?: string;
  account: unknown;
  profile: { id: string } | null;
}

export const AGENTPM_URLS = {
  production: 'https://agentpm.funnelists.com',
  staging: 'https://agentpm-staging.funnelists.com',
  local: 'http://localhost:3010',
};

interface ResolveApiKeyParams {
  provider: AIProvider;
  context: AuthContext;
  config: {
    agentpmUrl: string;
    platformKeys: Record<string, string>;
  };
}

interface ResolveApiKeyResult {
  key: string | null;
  source: 'platform' | 'user' | 'none';
}

/**
 * Resolve an API key for a provider via AgentPM federation
 */
export async function resolveApiKey(params: ResolveApiKeyParams): Promise<ResolveApiKeyResult> {
  const { provider, context, config } = params;

  if (!context.userId) {
    return { key: null, source: 'none' };
  }

  try {
    const response = await fetch(`${config.agentpmUrl}/api/keys/${provider}`, {
      headers: {
        'X-User-Id': context.userId,
      },
    });

    if (!response.ok) {
      return { key: null, source: 'none' };
    }

    const data = await response.json();
    return { key: data.key || null, source: data.key ? 'user' : 'none' };
  } catch {
    return { key: null, source: 'none' };
  }
}
