/**
 * Client-side encryption utilities for API keys
 * Uses Web Crypto API for AES-GCM encryption
 */

// Generate a random encryption key for the session/browser
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem('_ek');

    if (storedKey) {
        const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Export and store
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const keyString = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
    localStorage.setItem('_ek', keyString);

    return key;
}

/**
 * Encrypt an API key for local storage
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
    const key = await getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(apiKey);

    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an API key from local storage
 */
export async function decryptApiKey(encryptedKey: string): Promise<string> {
    const key = await getOrCreateEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decryptedData);
}

/**
 * Mask an API key for display (show last 4 chars)
 */
export function maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
        return '••••••••';
    }
    return '••••••••••••' + apiKey.slice(-4);
}
