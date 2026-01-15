/**
 * API Key Validation Endpoint
 * Validates that an API key works with the specified provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { ImageProvider, PROVIDER_CONFIGS } from '@/lib/providers/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey } = body as { provider: ImageProvider; apiKey: string };

        if (!provider || !apiKey) {
            return NextResponse.json(
                { success: false, error: 'Missing provider or apiKey' },
                { status: 400 }
            );
        }

        const config = PROVIDER_CONFIGS[provider];
        if (!config) {
            return NextResponse.json(
                { success: false, error: 'Invalid provider' },
                { status: 400 }
            );
        }

        const isValid = await validateProviderKey(provider, apiKey);

        return NextResponse.json({
            success: true,
            valid: isValid,
            provider,
            providerName: config.name
        });
    } catch (error) {
        console.error('[Validate Key] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Validation failed' },
            { status: 500 }
        );
    }
}

async function validateProviderKey(provider: ImageProvider, apiKey: string): Promise<boolean> {
    try {
        switch (provider) {
            case 'openai':
                return await validateOpenAIKey(apiKey);
            case 'stability':
                return await validateStabilityKey(apiKey);
            case 'replicate':
                return await validateReplicateKey(apiKey);
            default:
                return false;
        }
    } catch (error) {
        console.error(`[Validate Key] ${provider} validation error:`, error);
        return false;
    }
}

async function validateOpenAIKey(apiKey: string): Promise<boolean> {
    const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });
    return response.ok;
}

async function validateStabilityKey(apiKey: string): Promise<boolean> {
    const response = await fetch('https://api.stability.ai/v1/user/account', {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });
    return response.ok;
}

async function validateReplicateKey(apiKey: string): Promise<boolean> {
    const response = await fetch('https://api.replicate.com/v1/account', {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });
    return response.ok;
}
