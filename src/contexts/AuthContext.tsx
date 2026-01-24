'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchUserProfile,
  getCachedUserProfile,
  loginWithAgentPM,
  logout as agentpmLogout,
  isAccountLinked,
  initiateAccountLinking,
  unlinkAccount as agentpmUnlinkAccount,
  getLocalApiKeysForMigration,
  initAuthListener,
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
      // Try cached profile first for faster initial render
      const cached = getCachedUserProfile();
      if (cached) {
        setUser(cached);
        setIsFederated(true);
      }

      // Always try to fetch from Supabase session (not just when localStorage flag is set)
      // This handles cases where user has valid session but localStorage was cleared
      const profile = await fetchUserProfile();
      if (profile) {
        setUser(profile);
        setIsFederated(true);
        setIsLinked(isAccountLinked());
      } else {
        // No valid session - clear everything
        setUser(null);
        setIsFederated(false);
        setIsLinked(false);
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

  // Listen for auth state changes (login/logout events)
  useEffect(() => {
    const unsubscribe = initAuthListener((authUser) => {
      if (authUser) {
        setUser(authUser);
        setIsFederated(true);
        setIsLinked(isAccountLinked());
      } else {
        setUser(null);
        setIsFederated(false);
        setIsLinked(false);
      }
    });
    return unsubscribe;
  }, []);

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
