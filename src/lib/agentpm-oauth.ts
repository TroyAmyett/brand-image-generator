/**
 * Funnelists Auth Service
 * Handles shared authentication across Funnelists ecosystem via Supabase
 *
 * Uses email/password authentication with shared Supabase project
 * All Funnelists apps share the same user tables
 */

import { agentpmClient } from "./supabase";

const STORAGE_KEYS = {
  userProfile: "agentpm_user_profile",
  isFederated: "agentpm_is_federated",
  isLinked: "agentpm_is_linked",
  linkedAgentPMUserId: "agentpm_linked_user_id",
  canvasUserId: "canvas_user_id",
};

export interface AgentPMUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export interface AgentPMTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface ApiKeyInfo {
  id: string;
  provider: string;
  key_hint: string;
  created_at: string;
  last_used_at?: string;
}

export function isFederatedUser(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.isFederated) === "true";
}

export function getCachedUserProfile(): AgentPMUser | null {
  if (typeof window === "undefined") return null;
  const cached = localStorage.getItem(STORAGE_KEYS.userProfile);
  if (!cached) return null;
  try { return JSON.parse(cached); } catch { return null; }
}

export async function fetchUserProfile(): Promise<AgentPMUser | null> {
  try {
    const { data: { session }, error } = await agentpmClient.auth.getSession();
    if (error || !session?.user) { clearSession(); return null; }
    const user: AgentPMUser = {
      id: session.user.id,
      email: session.user.email || "",
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
      avatar_url: session.user.user_metadata?.avatar_url,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.isFederated, "true");
    }
    return user;
  } catch { return null; }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await agentpmClient.auth.getSession();
    return session?.access_token || null;
  } catch { return null; }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.userProfile);
  localStorage.removeItem(STORAGE_KEYS.isFederated);
  localStorage.removeItem(STORAGE_KEYS.isLinked);
  localStorage.removeItem(STORAGE_KEYS.linkedAgentPMUserId);
  localStorage.removeItem(STORAGE_KEYS.canvasUserId);
}

// Sign in with email/password using shared Supabase
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await agentpmClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    if (data.user) {
      const user: AgentPMUser = {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
        avatar_url: data.user.user_metadata?.avatar_url,
      };
      localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.isFederated, "true");
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Sign up with email/password using shared Supabase
export async function signUp(email: string, password: string): Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }> {
  try {
    const { data, error } = await agentpmClient.auth.signUp({
      email,
      password,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    // Check if email confirmation is required
    if (data.user && !data.session) {
      return { success: true, needsConfirmation: true };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Reset password
export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await agentpmClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// Legacy function - now just a no-op, login handled via modal
export async function loginWithAgentPM(): Promise<void> {
  // This is now handled by the login modal in Canvas
  // Kept for backward compatibility
}

export async function logout(): Promise<void> {
  try { await agentpmClient.auth.signOut(); } catch {}
  clearSession();
}

export function initAuthListener(onAuthChange: (user: AgentPMUser | null) => void): () => void {
  const { data: { subscription } } = agentpmClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      const user: AgentPMUser = {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        avatar_url: session.user.user_metadata?.avatar_url,
      };
      localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.isFederated, "true");
      onAuthChange(user);
    } else if (event === "SIGNED_OUT") {
      clearSession();
      onAuthChange(null);
    }
  });
  return () => subscription.unsubscribe();
}

export interface LinkingState { canvasUserId: string; canvasEmail?: string; intent: "link_account"; nonce: string; }
export interface LinkResult { success: boolean; agentpmUserId?: string; agentpmEmail?: string; error?: string; emailMismatch?: boolean; }

export function isAccountLinked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.isLinked) === "true";
}

export async function initiateAccountLinking(canvasUserId: string, canvasEmail?: string): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.canvasUserId, canvasUserId);
  }
  await loginWithAgentPM();
}

export async function completeAccountLinking(): Promise<LinkResult> {
  try {
    const { data: { session } } = await agentpmClient.auth.getSession();
    if (!session?.user) return { success: false, error: "Not authenticated" };
    localStorage.setItem(STORAGE_KEYS.isLinked, "true");
    localStorage.setItem(STORAGE_KEYS.linkedAgentPMUserId, session.user.id);
    return { success: true, agentpmUserId: session.user.id, agentpmEmail: session.user.email };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function unlinkAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    await logout();
    localStorage.removeItem(STORAGE_KEYS.isLinked);
    localStorage.removeItem(STORAGE_KEYS.linkedAgentPMUserId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function getLocalApiKeysForMigration(): { provider: string; keyHint: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem("user_api_keys");
    if (!data) return [];
    const keys = JSON.parse(data);
    return keys.map((k: { provider: string; keyHint: string }) => ({ provider: k.provider, keyHint: k.keyHint }));
  } catch { return []; }
}

// Legacy/stub functions for backward compatibility
// These would need to be implemented with actual API calls to AgentPM backend
export const validateOAuthState = (_state?: string) => true;
export const exchangeCodeForTokens = async (_code?: string) => ({ access_token: "", refresh_token: "", expires_in: 0, token_type: "Bearer" });
export const refreshAccessToken = async () => null;
export const getRefreshToken = () => null;
export async function fetchAgentPMApiKeys(): Promise<ApiKeyInfo[]> { return []; }
export async function getAgentPMApiKey(_provider: string): Promise<string | null> { return null; }
export async function migrateKeysToAgentPM(_selectedProviders: string[]): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  return { success: false, migratedCount: 0, error: "Not implemented" };
}
export const validateLinkingState = (_state?: string) => null;
