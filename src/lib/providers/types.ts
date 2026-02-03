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
    initImage?: string; // Base64 data URI or URL of source image for img2img refinement
    strength?: number; // 0-1, how much to change from source (lower = closer to original)
    model?: string; // Override default model (e.g. 'gpt-image-1' for OpenAI)
    outputFormat?: 'png' | 'jpeg' | 'webp';
    background?: 'transparent' | 'opaque'; // gpt-image-1 only
    count?: number; // Number of images to generate (gpt-image-1 supports n>1)
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
        name: 'OpenAI GPT Image',
        available: true,
        requiresApiKey: true,
        envKeyName: 'OPENAI_API_KEY',
        defaultModel: 'gpt-image-1',
        supportedSizes: ['1024x1024', '1536x1024', '1024x1536']
    },
    stability: {
        id: 'stability',
        name: 'Stability AI',
        available: true,
        requiresApiKey: true,
        envKeyName: 'STABILITY_API_KEY',
        defaultModel: 'stable-image-core',
        supportedSizes: ['1:1', '16:9', '21:9', '2:3', '3:2', '4:5', '5:4', '9:16', '9:21']
    },
    replicate: {
        id: 'replicate',
        name: 'Replicate (Flux)',
        available: true,
        requiresApiKey: true,
        envKeyName: 'REPLICATE_API_KEY',
        defaultModel: 'black-forest-labs/flux-schnell',
        supportedSizes: ['1:1', '16:9', '21:9', '2:3', '3:2', '4:3', '3:4', '9:16']
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

    // Default / OpenAI gpt-image-1 sizes
    if (aspectRatio > 1.3) {
        return { width: 1536, height: 1024 };
    } else if (aspectRatio < 0.77) {
        return { width: 1024, height: 1536 };
    }
    return { width: 1024, height: 1024 };
}
