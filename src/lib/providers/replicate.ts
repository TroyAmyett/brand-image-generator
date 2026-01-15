/**
 * Replicate provider handler
 * Supports multiple models including Flux and SDXL
 */

import dns from 'dns';
import {
    ProviderHandler,
    ProviderConfig,
    ImageGenerationRequest,
    ImageGenerationResponse,
    PROVIDER_CONFIGS
} from './types';

// Force IPv4 first to avoid connection issues
dns.setDefaultResultOrder('ipv4first');

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

// Default model: Flux Schnell (fast, high quality)
const DEFAULT_MODEL = 'black-forest-labs/flux-schnell';

interface ReplicatePrediction {
    id: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: string | string[];
    error?: string;
    urls: {
        get: string;
        cancel: string;
    };
}

export class ReplicateProvider implements ProviderHandler {
    config: ProviderConfig = PROVIDER_CONFIGS.replicate;

    async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
        const apiKey = request.apiKey || process.env.REPLICATE_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'Replicate API key not configured'
                },
                provider: 'replicate'
            };
        }

        try {
            const model = this.config.defaultModel || DEFAULT_MODEL;
            const aspectRatio = this.getAspectRatio(request.width, request.height);

            // Create prediction
            const createResponse = await fetch(REPLICATE_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    version: await this.getModelVersion(model, apiKey),
                    input: {
                        prompt: request.prompt,
                        aspect_ratio: aspectRatio,
                        num_outputs: 1,
                        output_format: 'png',
                        output_quality: 90
                    }
                })
            });

            if (!createResponse.ok) {
                const errorData = await createResponse.json().catch(() => ({}));
                return {
                    success: false,
                    error: {
                        code: 'API_ERROR',
                        message: `Replicate API error: ${(errorData as { detail?: string }).detail || createResponse.statusText}`
                    },
                    provider: 'replicate'
                };
            }

            const prediction = await createResponse.json() as ReplicatePrediction;

            // Poll for completion (max 120 seconds)
            const result = await this.pollForCompletion(prediction.urls.get, apiKey, 120000);

            if (!result.success) {
                return result;
            }

            return {
                success: true,
                imageUrl: result.imageUrl,
                provider: 'replicate',
                model: model
            };

        } catch (error) {
            console.error('[Replicate] Generation error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: {
                    code: 'GENERATION_FAILED',
                    message: `Replicate generation failed: ${message}`
                },
                provider: 'replicate'
            };
        }
    }

    private async getModelVersion(model: string, apiKey: string): Promise<string> {
        // Get the latest version of the model
        const response = await fetch(`https://api.replicate.com/v1/models/${model}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get model info: ${response.statusText}`);
        }

        const data = await response.json() as { latest_version?: { id: string } };
        if (!data.latest_version?.id) {
            throw new Error('Model version not found');
        }

        return data.latest_version.id;
    }

    private async pollForCompletion(
        statusUrl: string,
        apiKey: string,
        timeout: number
    ): Promise<ImageGenerationResponse> {
        const startTime = Date.now();
        const pollInterval = 1000; // 1 second

        while (Date.now() - startTime < timeout) {
            const response = await fetch(statusUrl, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        code: 'POLL_ERROR',
                        message: `Failed to check prediction status: ${response.statusText}`
                    },
                    provider: 'replicate'
                };
            }

            const prediction = await response.json() as ReplicatePrediction;

            if (prediction.status === 'succeeded') {
                const output = prediction.output;
                const imageUrl = Array.isArray(output) ? output[0] : output;

                if (!imageUrl) {
                    return {
                        success: false,
                        error: {
                            code: 'NO_OUTPUT',
                            message: 'Prediction succeeded but no output was returned'
                        },
                        provider: 'replicate'
                    };
                }

                return {
                    success: true,
                    imageUrl,
                    provider: 'replicate'
                };
            }

            if (prediction.status === 'failed') {
                return {
                    success: false,
                    error: {
                        code: 'PREDICTION_FAILED',
                        message: prediction.error || 'Prediction failed'
                    },
                    provider: 'replicate'
                };
            }

            if (prediction.status === 'canceled') {
                return {
                    success: false,
                    error: {
                        code: 'PREDICTION_CANCELED',
                        message: 'Prediction was canceled'
                    },
                    provider: 'replicate'
                };
            }

            // Still processing, wait and poll again
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        return {
            success: false,
            error: {
                code: 'TIMEOUT',
                message: 'Prediction timed out'
            },
            provider: 'replicate'
        };
    }

    private getAspectRatio(width: number, height: number): string {
        const ratio = width / height;

        if (ratio >= 1.7) return '16:9';
        if (ratio >= 1.4) return '3:2';
        if (ratio >= 1.1) return '4:3';
        if (ratio >= 0.9) return '1:1';
        if (ratio >= 0.7) return '3:4';
        if (ratio >= 0.55) return '2:3';
        return '9:16';
    }

    async validateApiKey(apiKey: string): Promise<boolean> {
        try {
            const response = await fetch('https://api.replicate.com/v1/account', {
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

export const replicateProvider = new ReplicateProvider();
