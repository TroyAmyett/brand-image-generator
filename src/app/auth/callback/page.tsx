"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { agentpmClient } from "@/lib/supabase";
import { fetchUserProfile } from "@/lib/agentpm-oauth";

function AuthCallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorParam = params.get("error") || hashParams.get("error");
        const errorDesc = params.get("error_description") || hashParams.get("error_description");
        if (errorParam) {
          setStatus("error");
          setError(errorDesc || errorParam);
          return;
        }
        await new Promise(r => setTimeout(r, 500));
        const { data: { session }, error: sessionError } = await agentpmClient.auth.getSession();
        if (sessionError) {
          setStatus("error");
          setError(sessionError.message);
          return;
        }
        if (!session) {
          const code = params.get("code");
          if (code) {
            const { error: exchangeError } = await agentpmClient.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              setStatus("error");
              setError(exchangeError.message);
              return;
            }
          } else {
            setStatus("error");
            setError("No authentication data found");
            return;
          }
        }
        await fetchUserProfile();
        setStatus("success");
        setTimeout(() => router.push("/"), 1500);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to complete authentication");
      }
    };
    handleCallback();
  }, [router]);

  const spinnerStyle = { width: "48px", height: "48px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--color-accent, #7c3aed)", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 1s linear infinite" };
  const containerStyle = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg, #1a1a2e)", color: "var(--color-text, #ffffff)", fontFamily: "system-ui, -apple-system, sans-serif" };
  const contentStyle = { textAlign: "center" as const, padding: "2rem", maxWidth: "400px" };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {status === "processing" && (
          <>
            <div style={spinnerStyle} />
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Signing you in...</h1>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Completing authentication...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div style={{ width: "48px", height: "48px", backgroundColor: "var(--color-success, #22c55e)", borderRadius: "50%", margin: "0 auto 1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
            </div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Welcome!</h1>
            <p style={{ color: "rgba(255,255,255,0.7)" }}>Authentication successful. Redirecting...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div style={{ width: "48px", height: "48px", backgroundColor: "var(--color-danger, #ef4444)", borderRadius: "50%", margin: "0 auto 1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Authentication Failed</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>{error}</p>
            <button onClick={() => router.push("/")} style={{ padding: "0.75rem 1.5rem", backgroundColor: "var(--color-accent, #7c3aed)", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem" }}>Return to Canvas</button>
          </>
        )}
      </div>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function LoadingFallback() {
  const spinnerStyle = { width: "48px", height: "48px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "var(--color-accent, #7c3aed)", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 1s linear infinite" };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--color-bg, #1a1a2e)", color: "var(--color-text, #ffffff)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ textAlign: "center", padding: "2rem", maxWidth: "400px" }}>
        <div style={spinnerStyle} />
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Loading...</h1>
      </div>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
