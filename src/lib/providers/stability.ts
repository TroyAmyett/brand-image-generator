/**
 * Stability AI provider handler
 */

import {
    ProviderHandler,
    ProviderConfig,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PROVIDER_CONFIGS,
    mapToProviderSize
} from './types';

const STABILITY_API_URL = 'https://api.stability.ai/v1/generation';

interface StabilityTextPrompt {
    text: string;
    weight: number;
}

interface StabilityArtifact {
    base64: string;
    seed: number;
    finishReason: string;
}

interface StabilityResponse {
    artifacts: StabilityArtifact[];
}

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
            // Map dimensions to Stability supported sizes
            const { width, height } = mapToProviderSize('stability', request.width, request.height);

            // Build prompts array
            const textPrompts: StabilityTextPrompt[] = [
                { text: request.prompt, weight: 1 }
            ];

            // Add negative prompt if provided
            if (request.negativePrompt) {
                textPrompts.push({ text: request.negativePrompt, weight: -1 });
            }

            const engineId = this.config.defaultModel || 'stable-diffusion-xl-1024-v1-0';

            const response = await fetch(`${STABILITY_API_URL}/${engineId}/text-to-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    text_prompts: textPrompts,
                    cfg_scale: 7,
                    height,
                    width,
                    samples: 1,
                    steps: 30,
                    style_preset: request.style === 'vivid' ? 'enhance' : 'photographic'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = (errorData as { message?: string }).message || response.statusText;
                return {
                    success: false,
                    error: {
                        code: 'API_ERROR',
                        message: `Stability API error: ${errorMessage}`
                    },
                    provider: 'stability'
                };
            }

            const data = await response.json() as StabilityResponse;

            if (!data.artifacts || data.artifacts.length === 0) {
                return {
                    success: false,
                    error: {
                        code: 'NO_IMAGE_RETURNED',
                        message: 'No image returned from Stability API'
                    },
                    provider: 'stability'
                };
            }

            const artifact = data.artifacts[0];

            // Return base64 image with data URL prefix
            return {
                success: true,
                imageBase64: `data:image/png;base64,${artifact.base64}`,
                provider: 'stability',
                model: engineId
            };
        } catch (error) {
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
