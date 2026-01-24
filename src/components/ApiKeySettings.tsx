'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageProvider, PROVIDER_CONFIGS } from '@/lib/providers/types';
import {
    getApiKeyStatuses as getLocalApiKeyStatuses,
    saveApiKey,
    deleteApiKey,
    getApiKey as getLocalApiKey,
    ApiKeyStatus
} from '@/lib/apiKeyStorage';
import { useAuth } from '@/contexts/AuthContext';
import { getApiKeyStatuses as getFederatedApiKeyStatuses } from '@/lib/apiKeyManager';
import { ExternalLink } from 'lucide-react';
import AccountLinkingSettings from './AccountLinkingSettings';

const AGENTPM_URL = process.env.NEXT_PUBLIC_AGENTPM_URL || 'https://agentpm.funnelists.com';

interface ApiKeySettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ApiKeySettings({ isOpen, onClose }: ApiKeySettingsProps) {
    const { isFederated, isLinked, user } = useAuth();
    const [keyStatuses, setKeyStatuses] = useState<ApiKeyStatus[]>([]);
    const [editingProvider, setEditingProvider] = useState<ImageProvider | null>(null);
    const [keyInput, setKeyInput] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isLoadingKeys, setIsLoadingKeys] = useState(false);

    const loadKeyStatuses = useCallback(async () => {
        setIsLoadingKeys(true);
        try {
            if (isFederated || isLinked) {
                const statuses = await getFederatedApiKeyStatuses();
                setKeyStatuses(statuses);
            } else {
                setKeyStatuses(getLocalApiKeyStatuses());
            }
        } catch (error) {
            console.error('Failed to load key statuses:', error);
            setKeyStatuses(getLocalApiKeyStatuses());
        } finally {
            setIsLoadingKeys(false);
        }
    }, [isFederated, isLinked]);

    useEffect(() => {
        if (isOpen) {
            loadKeyStatuses();
        }
    }, [isOpen, loadKeyStatuses]);

    const handleEdit = async (provider: ImageProvider) => {
        // Don't allow editing in federated or linked mode
        if (isFederated || isLinked) return;

        setEditingProvider(provider);
        setKeyInput('');
        setValidationError(null);
        setShowKey(false);

        // Load existing key if available
        const existingKey = await getLocalApiKey(provider);
        if (existingKey) {
            setKeyInput(existingKey);
        }
    };

    const handleSave = async () => {
        if (!editingProvider || !keyInput.trim()) {
            setValidationError('Please enter an API key');
            return;
        }

        setIsValidating(true);
        setValidationError(null);

        try {
            // Validate the key with the server
            const response = await fetch('/api/validate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: editingProvider,
                    apiKey: keyInput.trim()
                })
            });

            const data = await response.json();

            if (!data.success) {
                setValidationError(data.error || 'Validation failed');
                return;
            }

            if (!data.valid) {
                setValidationError('Invalid API key. Please check and try again.');
                return;
            }

            // Save the validated key
            await saveApiKey(editingProvider, keyInput.trim(), true);
            loadKeyStatuses();
            setEditingProvider(null);
            setKeyInput('');
        } catch (error) {
            console.error('Save error:', error);
            setValidationError('Failed to validate key. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleDelete = (provider: ImageProvider) => {
        if (confirm(`Remove ${PROVIDER_CONFIGS[provider].name} API key?`)) {
            deleteApiKey(provider);
            loadKeyStatuses();
        }
    };

    const handleCancel = () => {
        setEditingProvider(null);
        setKeyInput('');
        setValidationError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {(isFederated || isLinked) ? (
                        /* Federated/Linked User View */
                        <>
                            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {isLinked ? 'Account Linked' : 'AgentPM Connected'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">
                                    Your API keys are managed through AgentPM. Keys configured in AgentPM are automatically available in Canvas.
                                </p>
                                <a
                                    href={`${AGENTPM_URL}/#settings`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Manage Keys in AgentPM
                                </a>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                {user?.email && <span>Signed in as <strong>{user.email}</strong>. </span>}
                                API keys from your AgentPM account:
                            </p>
                        </>
                    ) : (
                        /* Standalone User View */
                        <>
                            <AccountLinkingSettings />
                            <p className="text-sm text-gray-600 mt-4 mb-4">
                                Or add your own API keys below. Keys are encrypted and stored locally in your browser.
                            </p>
                        </>
                    )}

                    {/* Loading State */}
                    {isLoadingKeys && (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading API keys...</p>
                        </div>
                    )}

                    {/* Provider List */}
                    {!isLoadingKeys && (
                    <div className="space-y-4">
                        {keyStatuses.map((status) => (
                            <div
                                key={status.provider}
                                className="border border-gray-200 rounded-lg p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {status.providerName}
                                        </h3>
                                        {status.isConfigured ? (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex items-center gap-1 text-xs ${status.isValid ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${status.isValid ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                    {status.isValid ? 'Connected' : 'Not validated'}
                                                </span>
                                                <span className="text-xs text-gray-500 font-mono">
                                                    {status.keyHint}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 mt-1 block">Not configured</span>
                                        )}
                                    </div>
                                    {!isFederated && !isLinked && (
                                    <div className="flex gap-2">
                                        {status.isConfigured ? (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(status.provider)}
                                                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(status.provider)}
                                                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                                >
                                                    Remove
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(status.provider)}
                                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Add Key
                                            </button>
                                        )}
                                    </div>
                                    )}
                                </div>

                                {/* Edit Form */}
                                {editingProvider === status.provider && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="relative">
                                            <input
                                                type={showKey ? 'text' : 'password'}
                                                value={keyInput}
                                                onChange={(e) => setKeyInput(e.target.value)}
                                                placeholder={`Enter your ${status.providerName} API key`}
                                                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey(!showKey)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                                            >
                                                {showKey ? 'Hide' : 'Show'}
                                            </button>
                                        </div>

                                        {validationError && (
                                            <p className="mt-2 text-sm text-red-600">
                                                {validationError}
                                            </p>
                                        )}

                                        <div className="mt-3 flex gap-2">
                                            <button
                                                onClick={handleSave}
                                                disabled={isValidating}
                                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isValidating ? 'Validating...' : 'Save Key'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={isValidating}
                                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                                            >
                                                Cancel
                                            </button>
                                        </div>

                                        {/* Help text */}
                                        <p className="mt-2 text-xs text-gray-500">
                                            {getKeyHelpText(status.provider)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    )}

                    {/* Security Notice */}
                    <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">
                            {(isFederated || isLinked) ? (
                                <>
                                    <strong>Security:</strong> Your API keys are securely stored and managed by AgentPM. Canvas retrieves keys on-demand using your authenticated session and never stores them locally.
                                </>
                            ) : (
                                <>
                                    <strong>Security:</strong> Your API keys are encrypted using AES-256-GCM and stored only in your browser&apos;s local storage. They are never sent to our servers except when making API calls to the respective providers.
                                </>
                            )}
                        </p>
                    </div>

                    {/* Account Linking Section for Linked Users */}
                    {isLinked && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Account Settings</h3>
                            <AccountLinkingSettings />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}

function getKeyHelpText(provider: ImageProvider): string {
    switch (provider) {
        case 'openai':
            return 'Get your API key from platform.openai.com/api-keys';
        case 'stability':
            return 'Get your API key from platform.stability.ai/account/keys';
        case 'replicate':
            return 'Get your API key from replicate.com/account/api-tokens';
        default:
            return '';
    }
}
