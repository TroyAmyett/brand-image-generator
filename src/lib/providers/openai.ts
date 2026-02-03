/**
 * OpenAI image generation provider handler.
 * Supports gpt-image-1 (default) with fall-back to dall-e-3.
 */

import OpenAI from 'openai';
import type { ImagesResponse } from 'openai/resources/images';
import {
    ProviderHandler,
    ProviderConfig,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PROVIDER_CONFIGS,
    mapToProviderSize
} from './types';

type GptImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
type DalleSize = '1024x1024' | '1024x1792' | '1792x1024';

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
            const model = request.model || this.config.defaultModel || 'gpt-image-1';
            const isGptImage = model.startsWith('gpt-image');

            if (isGptImage) {
                return await this.generateWithGptImage(openai, request, model);
            } else {
                return await this.generateWithDalle(openai, request, model);
            }
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

    /**
     * Generate with gpt-image-1 / gpt-image-1-mini / gpt-image-1.5
     * Returns base64 directly (no temporary URLs).
     */
    private async generateWithGptImage(
        openai: OpenAI,
        request: ImageGenerationRequest,
        model: string,
    ): Promise<ImageGenerationResponse> {
        const { width, height } = mapToProviderSize('openai', request.width, request.height);
        const size = `${width}x${height}` as GptImageSize;

        // Map quality: dall-e used 'standard'|'hd', gpt-image uses 'low'|'medium'|'high'
        let quality: 'low' | 'medium' | 'high' = 'high';
        if (request.quality === 'standard') quality = 'medium';

        const params: Record<string, unknown> = {
            model,
            prompt: request.prompt,
            size,
            quality,
            n: request.count || 1,
        };

        if (request.outputFormat) {
            params.output_format = request.outputFormat;
        }

        if (request.background === 'transparent') {
            params.background = 'transparent';
            // transparent requires png output
            params.output_format = 'png';
        }

        const response = await openai.images.generate(params as unknown as Parameters<typeof openai.images.generate>[0]) as ImagesResponse;

        // gpt-image models return base64 in b64_json field
        const first = response.data?.[0];
        const b64 = first?.b64_json;
        const url = first?.url;

        if (b64) {
            const format = (params.output_format as string) || 'png';
            const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
            return {
                success: true,
                imageBase64: `data:${mimeType};base64,${b64}`,
                provider: 'openai',
                model,
            };
        }

        if (url) {
            return {
                success: true,
                imageUrl: url,
                provider: 'openai',
                model,
            };
        }

        return {
            success: false,
            error: {
                code: 'NO_IMAGE_RETURNED',
                message: 'No image data returned from GPT Image API'
            },
            provider: 'openai'
        };
    }

    /**
     * Legacy DALL-E 3 path (kept for backward compat until full deprecation).
     */
    private async generateWithDalle(
        openai: OpenAI,
        request: ImageGenerationRequest,
        model: string,
    ): Promise<ImageGenerationResponse> {
        const { width, height } = mapToProviderSize('openai', request.width, request.height);
        // Map to dall-e-3 sizes (1024x1024, 1024x1792, 1792x1024)
        let size: DalleSize = `${width}x${height}` as DalleSize;
        if (!['1024x1024', '1024x1792', '1792x1024'].includes(size)) {
            // Remap gpt-image sizes to dall-e-3 equivalents
            if (width > height) size = '1792x1024';
            else if (height > width) size = '1024x1792';
            else size = '1024x1024';
        }

        const response = await openai.images.generate({
            model,
            prompt: request.prompt,
            size,
            quality: request.quality || 'hd',
            style: request.style || 'natural',
            n: 1
        }) as ImagesResponse;

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
            model,
        };
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
