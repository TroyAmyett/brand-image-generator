/**
 * Stability AI provider handler
 * Uses the v2beta Stable Image Core API
 */

import dns from 'dns';
import {
    ProviderHandler,
    ProviderConfig,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PROVIDER_CONFIGS
} from './types';

// Force IPv4 first to avoid Cloudflare connection issues
dns.setDefaultResultOrder('ipv4first');

// v2beta API endpoint for Stable Image Core
const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';

export class StabilityProvider implements ProviderHandler {
    config: ProviderConfig = PROVIDER_CONFIGS.stability;

    async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
        const apiKey = request.apiKey || process.env.STABILITY_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'Stability AI API key not configured'
                },
                provider: 'stability'
            };
        }

        try {
            // Map dimensions to aspect ratio for v2beta API
            const aspectRatio = this.getAspectRatio(request.width, request.height);

            // Build form data for v2beta API
            const formData = new FormData();
            formData.append('prompt', request.prompt);
            formData.append('output_format', 'png');

            // Image-to-image mode: include source image and strength
            if (request.initImage) {
                const imageBuffer = await this.resolveImageToBuffer(request.initImage);
                formData.append('image', new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' }), 'source.png');
                formData.append('strength', String(request.strength ?? 0.65));
                formData.append('mode', 'image-to-image');
            } else {
                formData.append('aspect_ratio', aspectRatio);
            }

            // Add negative prompt if provided
            if (request.negativePrompt) {
                formData.append('negative_prompt', request.negativePrompt);
            }

            // Map style to Stability's style_preset
            // Use 'photographic' for natural/photorealistic, 'enhance' for vivid
            if (request.style === 'natural') {
                formData.append('style_preset', 'photographic');
            } else if (request.style === 'vivid') {
                formData.append('style_preset', 'enhance');
            }

            // Use AbortController for extended timeout (120 seconds for image generation)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(STABILITY_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'image/*'
                },
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = response.statusText;
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorData.name || errorText;
                } catch {
                    errorMessage = errorText || response.statusText;
                }
                return {
                    success: false,
                    error: {
                        code: 'API_ERROR',
                        message: `Stability API error (${response.status}): ${errorMessage}`
                    },
                    provider: 'stability'
                };
            }

            // v2beta returns raw image bytes when Accept: image/*
            const imageBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString('base64');

            return {
                success: true,
                imageBase64: `data:image/png;base64,${base64}`,
                provider: 'stability',
                model: 'stable-image-core'
            };
        } catch (error) {
            console.error('[Stability] Generation error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: {
                    code: 'GENERATION_FAILED',
                    message: `Stability AI generation failed: ${message}`
                },
                provider: 'stability'
            };
        }
    }

    /**
     * Convert a base64 data URI or URL to a Buffer for the Stability API.
     */
    private async resolveImageToBuffer(imageSource: string): Promise<Buffer> {
        if (imageSource.startsWith('data:')) {
            // Base64 data URI — extract raw bytes
            const base64Data = imageSource.split(',')[1];
            return Buffer.from(base64Data, 'base64');
        }
        // URL — fetch and convert
        const res = await fetch(imageSource);
        if (!res.ok) throw new Error(`Failed to fetch source image: ${res.statusText}`);
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
    }

    private getAspectRatio(width: number, height: number): string {
        // Map common dimensions to Stability's supported aspect ratios
        const ratio = width / height;

        if (ratio >= 1.7) return '16:9';      // Wide landscape
        if (ratio >= 1.4) return '3:2';       // Standard landscape
        if (ratio >= 1.1) return '4:3';       // Slight landscape
        if (ratio >= 0.9) return '1:1';       // Square
        if (ratio >= 0.7) return '3:4';       // Slight portrait
        if (ratio >= 0.55) return '2:3';      // Standard portrait
        return '9:16';                         // Tall portrait
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch('https://api.stability.ai/v1/user/account', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const stabilityProvider = new StabilityProvider();
