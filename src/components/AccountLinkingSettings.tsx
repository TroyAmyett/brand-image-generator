'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link2, Unlink, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';

const AGENTPM_URL = process.env.NEXT_PUBLIC_AGENTPM_URL || 'https://agentpm.ai';

interface AccountLinkingSettingsProps {
  canvasUserId?: string;
  canvasEmail?: string;
}

export default function AccountLinkingSettings({
  canvasUserId = 'standalone-user',
  canvasEmail,
}: AccountLinkingSettingsProps) {
  const { user, isFederated, isLinked, isLoading, linkAccount, unlinkAccount, localKeysForMigration } = useAuth();
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);

  const handleLinkAccount = () => {
    linkAccount(canvasUserId, canvasEmail);
  };

  const handleUnlinkAccount = async () => {
    setIsUnlinking(true);
    setUnlinkError(null);

    const result = await unlinkAccount();

    if (!result.success) {
      setUnlinkError(result.error || 'Failed to unlink account');
    } else {
      setShowUnlinkConfirm(false);
    }

    setIsUnlinking(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  // User is federated (signed in via AgentPM SSO) - different from just linked
  if (isFederated && !isLinked) {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-purple-900">Signed in with AgentPM</span>
        </div>
        <p className="text-sm text-gray-700 mb-3">
          You are signed in via AgentPM Single Sign-On. Your account and API keys are managed through AgentPM.
        </p>
        {user && (
          <p className="text-sm text-gray-600">
            Signed in as: <strong>{user.email}</strong>
          </p>
        )}
      </div>
    );
  }

  // User has linked their standalone Canvas account to AgentPM
  if (isLinked) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Account Linked to AgentPM</span>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Your Canvas account is linked to AgentPM. You can manage your API keys in one place and use them across all connected tools.
          </p>
          {user && (
            <p className="text-sm text-gray-600 mb-3">
              Linked to: <strong>{user.email}</strong>
            </p>
          )}
          <a
            href={`${AGENTPM_URL}/settings/api-keys`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-800"
          >
            <ExternalLink className="w-4 h-4" />
            Manage API Keys in AgentPM
          </a>
        </div>

        {/* Unlink Section */}
        {!showUnlinkConfirm ? (
          <button
            onClick={() => setShowUnlinkConfirm(true)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <Unlink className="w-4 h-4" />
            Unlink from AgentPM
          </button>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Confirm Unlink</h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to unlink your Canvas account from AgentPM?
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Your local API keys will be preserved</li>
                  <li>• You will no longer have access to AgentPM-managed keys</li>
                  <li>• You can re-link at any time</li>
                </ul>
              </div>
            </div>

            {unlinkError && (
              <p className="text-sm text-red-600 mb-3">{unlinkError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUnlinkAccount}
                disabled={isUnlinking}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUnlinking ? 'Unlinking...' : 'Yes, Unlink Account'}
              </button>
              <button
                onClick={() => {
                  setShowUnlinkConfirm(false);
                  setUnlinkError(null);
                }}
                disabled={isUnlinking}
                className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standalone user - show Link option
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-900">Link to AgentPM</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Connect your Canvas account to AgentPM for centralized API key management. Use the same keys across all Funnelists tools.
      </p>

      {localKeysForMigration.length > 0 && (
        <p className="text-sm text-gray-500 mb-3">
          You have {localKeysForMigration.length} local API key(s) that can be migrated to AgentPM.
        </p>
      )}

      <button
        onClick={handleLinkAccount}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        <Link2 className="w-4 h-4" />
        Link to AgentPM
      </button>

      <p className="text-xs text-gray-500 mt-3">
        You will be redirected to AgentPM to authorize the connection.
        {canvasEmail && ` Please use the same email (${canvasEmail}) for best experience.`}
      </p>
    </div>
  );
}
