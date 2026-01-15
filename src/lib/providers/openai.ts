/**
 * OpenAI DALL-E 3 provider handler
 */

import OpenAI from 'openai';
import {
    ProviderHandler,
    ProviderConfig,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PROVIDER_CONFIGS,
    mapToProviderSize
} from './types';

export class OpenAIProvider implements ProviderHandler {
    config: ProviderConfig = PROVIDER_CONFIGS.openai;

    async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
        const apiKey = request.apiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'OpenAI API key not configured'
                },
                provider: 'openai'
            };
        }

        try {
            const openai = new OpenAI({ apiKey });

            // Map dimensions to DALL-E supported sizes
            const { width, height } = mapToProviderSize('openai', request.width, request.height);
            const size = `${width}x${height}` as '1024x1024' | '1024x1792' | '1792x1024';

            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: request.prompt,
                size: size,
                quality: request.quality || 'hd',
                style: request.style || 'natural',
                n: 1
            });

            const imageUrl = response.data?.[0]?.url;

            if (!imageUrl) {
                return {
                    success: false,
                    error: {
                        code: 'NO_IMAGE_RETURNED',
                        message: 'No image URL returned from DALL-E API'
                    },
                    provider: 'openai'
                };
            }

            return {
                success: true,
                imageUrl,
                provider: 'openai',
                model: 'dall-e-3'
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: {
                    code: 'GENERATION_FAILED',
                    message: `OpenAI generation failed: ${message}`
                },
                provider: 'openai'
            };
        }
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const openai = new OpenAI({ apiKey });
            await openai.models.list();
            return true;
        } catch {
            return false;
        }
    }
}

export const openaiProvider = new OpenAIProvider();
