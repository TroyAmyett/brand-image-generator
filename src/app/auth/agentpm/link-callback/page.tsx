"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { agentpmClient } from "@/lib/supabase";
import {
  completeAccountLinking,
  getLocalApiKeysForMigration,
  migrateKeysToAgentPM,
  fetchUserProfile,
} from "@/lib/agentpm-oauth";

interface LocalKey {
  provider: string;
  keyHint: string;
  selected: boolean;
}

function LinkCallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "migration" | "error">("processing");
  const [error, setError] = useState<string | null>(null);
  const [agentpmEmail, setAgentpmEmail] = useState<string | null>(null);
  const [localKeys, setLocalKeys] = useState<LocalKey[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; count?: number } | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorParam = params.get("error") || hashParams.get("error");
      const errorDesc = params.get("error_description") || hashParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setError(errorDesc || errorParam);
        return;
      }

      try {
        await new Promise(r => setTimeout(r, 500));
        const { data: { session }, error: sessionError } = await agentpmClient.auth.getSession();
        if (sessionError) { setStatus("error"); setError(sessionError.message); return; }
        if (!session) {
          const code = params.get("code");
          if (code) {
            const { error: exchangeError } = await agentpmClient.auth.exchangeCodeForSession(code);
            if (exchangeError) { setStatus("error"); setError(exchangeError.message); return; }
          } else { setStatus("error"); setError("No authentication data found"); return; }
        }
        const result = await completeAccountLinking();
        if (!result.success) { setStatus("error"); setError(result.error || "Failed to link account"); return; }
        setAgentpmEmail(result.agentpmEmail || null);
        await fetchUserProfile();
        const keys = getLocalApiKeysForMigration();
        if (keys.length > 0) { setLocalKeys(keys.map(k => ({ ...k, selected: true }))); setStatus("migration"); }
        else { setStatus("success"); setTimeout(() => router.push("/"), 2000); }
      } catch (err) { setStatus("error"); setError(err instanceof Error ? err.message : "Failed to complete account linking"); }
    };
    handleCallback();
  }, [router]);

  const handleMigrateKeys = async () => {
    setIsMigrating(true);
    const selectedProviders = localKeys.filter(k => k.selected).map(k => k.provider);
    if (selectedProviders.length === 0) { setStatus("success"); setTimeout(() => router.push("/"), 2000); return; }
    const result = await migrateKeysToAgentPM(selectedProviders);
    setMigrationResult({ success: result.success, count: result.migratedCount });
    setIsMigrating(false);
    if (result.success) { setStatus("success"); setTimeout(() => router.push("/"), 2000); }
    else { setError(result.error || "Failed to migrate keys"); }
  };

  const handleSkipMigration = () => { setStatus("success"); setTimeout(() => router.push("/"), 2000); };
  const toggleKeySelection = (provider: string) => { setLocalKeys(prev => prev.map(k => k.provider === provider ? { ...k, selected: !k.selected } : k)); };

  const spinnerStyle = { width: "48px", height: "48px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#7c3aed", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 1s linear infinite" };
  const containerStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1a1a2e", color: "#ffffff", fontFamily: "system-ui, sans-serif" };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: "500px", width: "100%" }}>
        {status === "processing" && (<><div style={spinnerStyle} /><h1 style={{ fontSize: "1.5rem" }}>Linking your account...</h1></>)}
        {status === "migration" && (<><h1>Account Linked!</h1>{agentpmEmail && <p>Connected to {agentpmEmail}</p>}<p>Keys migration UI placeholder</p><button onClick={handleSkipMigration}>Continue</button></>)}
        {status === "success" && (<><h1>Success!</h1><p>Redirecting...</p></>)}
        {status === "error" && (<><h1>Error</h1><p>{error}</p><button onClick={() => router.push("/")}>Return</button></>)}
      </div>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function LoadingFallback() {
  return (<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1a1a2e", color: "#ffffff" }}><h1>Loading...</h1></div>);
}

export default function LinkCallbackPage() {
  return (<Suspense fallback={<LoadingFallback />}><LinkCallbackContent /></Suspense>);
}
