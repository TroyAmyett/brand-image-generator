'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  isFederatedUser,
  fetchUserProfile,
  getCachedUserProfile,
  loginWithAgentPM,
  logout as agentpmLogout,
  isAccountLinked,
  initiateAccountLinking,
  unlinkAccount as agentpmUnlinkAccount,
  getLocalApiKeysForMigration,
  AgentPMUser,
} from '@/lib/agentpm-oauth';

interface AuthContextType {
  user: AgentPMUser | null;
  isFederated: boolean;
  isLinked: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  linkAccount: (canvasUserId: string, canvasEmail?: string) => void;
  unlinkAccount: () => Promise<{ success: boolean; error?: string }>;
  localKeysForMigration: { provider: string; keyHint: string }[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AgentPMUser | null>(null);
  const [isFederated, setIsFederated] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localKeysForMigration, setLocalKeysForMigration] = useState<{ provider: string; keyHint: string }[]>([]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const federated = isFederatedUser();
      const linked = isAccountLinked();
      setIsFederated(federated);
      setIsLinked(linked);

      if (federated || linked) {
        // Try cached profile first
        const cached = getCachedUserProfile();
        if (cached) {
          setUser(cached);
        }

        // Fetch fresh profile
        const profile = await fetchUserProfile();
        if (profile) {
          setUser(profile);
        } else if (!cached) {
          // No cached profile and failed to fetch - session may be invalid
          setIsFederated(false);
          setIsLinked(false);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      // Get local keys for potential migration
      setLocalKeysForMigration(getLocalApiKeysForMigration());
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setIsFederated(false);
      setIsLinked(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(() => {
    loginWithAgentPM();
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await agentpmLogout();
      setUser(null);
      setIsFederated(false);
      setIsLinked(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkAccount = useCallback((canvasUserId: string, canvasEmail?: string) => {
    initiateAccountLinking(canvasUserId, canvasEmail);
  }, []);

  const unlinkAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await agentpmUnlinkAccount();
      if (result.success) {
        setUser(null);
        setIsFederated(false);
        setIsLinked(false);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isFederated,
        isLinked,
        isLoading,
        login,
        logout,
        refreshUser,
        linkAccount,
        unlinkAccount,
        localKeysForMigration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
