/**
 * Provider factory - get the appropriate handler for an image provider
 */

import {
    ImageProvider,
    ProviderHandler,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PROVIDER_CONFIGS
} from './types';
import { openaiProvider } from './openai';
import { stabilityProvider } from './stability';
import { replicateProvider } from './replicate';

// Provider registry
const providers: Partial<Record<ImageProvider, ProviderHandler>> = {
    openai: openaiProvider,
    stability: stabilityProvider,
    replicate: replicateProvider
    // anthropic will be added when available
};

/**
 * Get a provider handler by ID
 */
export function getProvider(providerId: ImageProvider): ProviderHandler | null {
    return providers[providerId] || null;
}

/**
 * Check if a provider is available
 */
export function isProviderAvailable(providerId: ImageProvider): boolean {
    const config = PROVIDER_CONFIGS[providerId];
    if (!config || !config.available) {
        return false;
    }

    // Check if the required API key is configured
    const envKey = process.env[config.envKeyName];
    return !!envKey;
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): ImageProvider[] {
    return (Object.keys(PROVIDER_CONFIGS) as ImageProvider[]).filter(isProviderAvailable);
}

/**
 * Generate an image using the specified provider
 */
export async function generateImage(
    request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
    const provider = getProvider(request.provider);

    if (!provider) {
        return {
            success: false,
            error: {
                code: 'PROVIDER_NOT_FOUND',
                message: `Provider '${request.provider}' is not implemented`
            },
            provider: request.provider
        };
    }

    const config = PROVIDER_CONFIGS[request.provider];
    if (!config.available) {
        return {
            success: false,
            error: {
                code: 'PROVIDER_NOT_AVAILABLE',
                message: `Provider '${request.provider}' is not yet available`
            },
            provider: request.provider
        };
    }

    // Check for API key
    const apiKey = request.apiKey || process.env[config.envKeyName];
    if (!apiKey) {
        return {
            success: false,
            error: {
                code: 'MISSING_API_KEY',
                message: `API key for ${config.name} is not configured. Set ${config.envKeyName} environment variable.`
            },
            provider: request.provider
        };
    }

    return provider.generate({ ...request, apiKey });
}

// Re-export types
export * from './types';
