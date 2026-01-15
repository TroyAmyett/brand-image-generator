/**
 * Multi-provider image generation types
 */

export type ImageProvider = 'openai' | 'stability' | 'replicate' | 'anthropic';

export interface ProviderConfig {
    id: ImageProvider;
    name: string;
    available: boolean;
    requiresApiKey: boolean;
    envKeyName: string;
    defaultModel?: string;
    supportedSizes: string[];
}

export interface ImageGenerationRequest {
    provider: ImageProvider;
    prompt: string;
    negativePrompt?: string;
    width: number;
    height: number;
    style?: 'natural' | 'vivid';
    quality?: 'standard' | 'hd';
    apiKey?: string; // Optional user-provided key
}

export interface ImageGenerationResponse {
    success: boolean;
    imageUrl?: string;
    imageBase64?: string;
    error?: {
        code: string;
        message: string;
    };
    provider: ImageProvider;
    model?: string;
}

export interface ProviderHandler {
    config: ProviderConfig;
    generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    validateApiKey?(apiKey: string): Promise<boolean>;
}

// Provider configurations
export const PROVIDER_CONFIGS: Record<ImageProvider, ProviderConfig> = {
    openai: {
        id: 'openai',
        name: 'OpenAI DALL-E 3',
        available: true,
        requiresApiKey: true,
        envKeyName: 'OPENAI_API_KEY',
        defaultModel: 'dall-e-3',
        supportedSizes: ['1024x1024', '1024x1792', '1792x1024']
    },
    stability: {
        id: 'stability',
        name: 'Stability AI',
        available: true,
        requiresApiKey: true,
        envKeyName: 'STABILITY_API_KEY',
        defaultModel: 'stable-diffusion-xl-1024-v1-0',
        supportedSizes: ['1024x1024', '1152x896', '896x1152', '1216x832', '832x1216']
    },
    replicate: {
        id: 'replicate',
        name: 'Replicate',
        available: false,
        requiresApiKey: true,
        envKeyName: 'REPLICATE_API_KEY',
        defaultModel: 'stability-ai/sdxl',
        supportedSizes: ['1024x1024', '1024x1792', '1792x1024']
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic Claude',
        available: false,
        requiresApiKey: true,
        envKeyName: 'ANTHROPIC_API_KEY',
        supportedSizes: []
    }
};

// Map standard sizes to provider-specific sizes
export function mapToProviderSize(
    provider: ImageProvider,
    width: number,
    height: number
): { width: number; height: number } {
    const config = PROVIDER_CONFIGS[provider];
    const requestedSize = `${width}x${height}`;

    // If exact size is supported, use it
    if (config.supportedSizes.includes(requestedSize)) {
        return { width, height };
    }

    // Map to closest supported size
    const aspectRatio = width / height;

    if (provider === 'stability') {
        // Stability AI size mapping
        if (aspectRatio > 1.5) {
            return { width: 1216, height: 832 }; // Wide
        } else if (aspectRatio < 0.67) {
            return { width: 832, height: 1216 }; // Tall
        } else if (aspectRatio > 1.1) {
            return { width: 1152, height: 896 }; // Slightly wide
        } else if (aspectRatio < 0.9) {
            return { width: 896, height: 1152 }; // Slightly tall
        }
        return { width: 1024, height: 1024 }; // Square
    }

    // Default: return closest standard size
    if (aspectRatio > 1.3) {
        return { width: 1792, height: 1024 };
    } else if (aspectRatio < 0.77) {
        return { width: 1024, height: 1792 };
    }
    return { width: 1024, height: 1024 };
}
