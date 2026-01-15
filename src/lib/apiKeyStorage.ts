/**
 * API Key Storage Manager
 * Handles encrypted storage and retrieval of user API keys in localStorage
 */

import { ImageProvider, PROVIDER_CONFIGS } from './providers/types';
import { encryptApiKey, decryptApiKey, maskApiKey } from './encryption';

const STORAGE_KEY = 'user_api_keys';

export interface StoredApiKey {
    provider: ImageProvider;
    encryptedKey: string;
    keyHint: string;
    isValid: boolean;
    lastValidatedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiKeyStatus {
    provider: ImageProvider;
    providerName: string;
    isConfigured: boolean;
    keyHint: string | null;
    isValid: boolean;
    lastValidatedAt: Date | null;
}

/**
 * Get all stored API keys metadata (without decrypting)
 */
export function getApiKeyStatuses(): ApiKeyStatus[] {
    const stored = getStoredKeys();

    return Object.values(PROVIDER_CONFIGS)
        .filter(config => config.available)
        .map(config => {
            const key = stored.find(k => k.provider === config.id);
            return {
                provider: config.id,
                providerName: config.name,
                isConfigured: !!key,
                keyHint: key?.keyHint || null,
                isValid: key?.isValid ?? false,
                lastValidatedAt: key?.lastValidatedAt ? new Date(key.lastValidatedAt) : null
            };
        });
}

/**
 * Save an API key (encrypted)
 */
export async function saveApiKey(
    provider: ImageProvider,
    apiKey: string,
    isValid: boolean = true
): Promise<void> {
    const stored = getStoredKeys();
    const now = new Date().toISOString();

    // Remove existing key for this provider
    const filtered = stored.filter(k => k.provider !== provider);

    // Add new key
    const encrypted = await encryptApiKey(apiKey);
    filtered.push({
        provider,
        encryptedKey: encrypted,
        keyHint: maskApiKey(apiKey),
        isValid,
        lastValidatedAt: isValid ? now : null,
        createdAt: now,
        updatedAt: now
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get a decrypted API key for a provider
 */
export async function getApiKey(provider: ImageProvider): Promise<string | null> {
    const stored = getStoredKeys();
    const key = stored.find(k => k.provider === provider);

    if (!key) {
        return null;
    }

    try {
        return await decryptApiKey(key.encryptedKey);
    } catch {
        console.error(`Failed to decrypt API key for ${provider}`);
        return null;
    }
}

/**
 * Delete an API key
 */
export function deleteApiKey(provider: ImageProvider): void {
    const stored = getStoredKeys();
    const filtered = stored.filter(k => k.provider !== provider);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Update key validation status
 */
export function updateKeyValidation(provider: ImageProvider, isValid: boolean): void {
    const stored = getStoredKeys();
    const key = stored.find(k => k.provider === provider);

    if (key) {
        key.isValid = isValid;
        key.lastValidatedAt = isValid ? new Date().toISOString() : key.lastValidatedAt;
        key.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
}

/**
 * Check if a provider has a configured key
 */
export function hasApiKey(provider: ImageProvider): boolean {
    const stored = getStoredKeys();
    return stored.some(k => k.provider === provider);
}

/**
 * Get raw stored keys from localStorage
 */
function getStoredKeys(): StoredApiKey[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Clear all stored API keys
 */
export function clearAllApiKeys(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('_ek'); // Also clear encryption key
}
