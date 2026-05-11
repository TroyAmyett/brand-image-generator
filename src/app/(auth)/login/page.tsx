'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Palette } from 'lucide-react';
import { signIn } from '@/lib/agentpm-oauth';
import { agentpmClient as supabase } from '@/lib/supabase';
import { LoginScreen } from '@/components/LoginScreen';

export default function LoginPage() {
  const router = useRouter();

  // Auto-redirect if already logged in (cross-app SSO)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  return (
    <LoginScreen
      appName="Canvas"
      tagline="AI image generator"
      Icon={Palette}
      onSignInWithPassword={async (email, password) => {
        const result = await signIn(email, password);
        if (!result.success) return { error: result.error || 'Sign-in failed' };
        router.replace('/');
        return {};
      }}
      onSignInWithGoogle={async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        return { error: error?.message };
      }}
      onSignInWithMicrosoft={async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            scopes: 'email',
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        return { error: error?.message };
      }}
      onResetPassword={async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        return { error: error?.message };
      }}
    />
  );
}
