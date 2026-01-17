// OAuth Edge Function for AgentPM Identity Service
// Handles both /oauth/authorize and /oauth/token endpoints
// Deploy to: https://ilxgrlnwjtdpikpjocll.supabase.co

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Supabase client for database operations
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to generate secure random tokens
function generateToken(prefix: string): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${hex}`;
}

// Helper to hash secrets for comparison
async function hashSecret(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Validate client registration
async function validateClient(
  clientId: string,
  redirectUri: string,
  clientSecret?: string
): Promise<{ valid: boolean; error?: string; registration?: any }> {
  const { data: registration, error } = await supabase
    .from("tool_registrations")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error || !registration) {
    return { valid: false, error: "Invalid client_id" };
  }

  // Validate redirect URI matches registered callback
  if (registration.callback_url !== redirectUri) {
    // Also check if it's a valid base URL match for flexibility
    const registeredBase = new URL(registration.callback_url).origin;
    const requestedBase = new URL(redirectUri).origin;
    if (registeredBase !== requestedBase) {
      return { valid: false, error: "Invalid redirect_uri" };
    }
  }

  // If client_secret provided, validate it
  if (clientSecret) {
    const secretHash = await hashSecret(clientSecret);
    if (secretHash !== registration.client_secret_hash) {
      return { valid: false, error: "Invalid client_secret" };
    }
  }

  return { valid: true, registration };
}

// Handle GET /oauth/authorize - Show login page or redirect
async function handleAuthorize(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const responseType = url.searchParams.get("response_type");
  const scope = url.searchParams.get("scope");
  const state = url.searchParams.get("state");

  // Validate required params
  if (!clientId || !redirectUri || responseType !== "code") {
    return new Response(
      JSON.stringify({ error: "invalid_request", message: "Missing required parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate client
  const validation = await validateClient(clientId, redirectUri);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: "invalid_client", message: validation.error }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // For now, generate an authorization code directly
  // In production, this would show a login/consent page first
  const authCode = generateToken("flt_ac");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store the authorization code
  const { error: insertError } = await supabase.from("oauth_authorization_codes").insert({
    code: authCode,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope || "read:profile",
    state: state,
    expires_at: expiresAt.toISOString(),
    // In production, this would be the authenticated user's ID
    user_id: null, // Will be set after user authenticates
  });

  if (insertError) {
    console.error("Failed to store auth code:", insertError);
    return new Response(
      JSON.stringify({ error: "server_error", message: "Failed to generate authorization code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Build redirect URL with code
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", authCode);
  if (state) {
    callbackUrl.searchParams.set("state", state);
  }

  // Return HTML page that shows login or redirects
  // For development, auto-redirect with a demo user
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>AgentPM Sign In</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 24px; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    p { color: #666; margin-bottom: 24px; }
    button { width: 100%; padding: 12px; background: #0070f3; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
    button:hover { background: #0060df; }
    .app-name { font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Sign in to AgentPM</h1>
    <p><span class="app-name">${validation.registration?.name || clientId}</span> wants to access your account.</p>
    <p>Requested permissions: ${scope || "read:profile"}</p>
    <button onclick="authorize()">Continue</button>
  </div>
  <script>
    function authorize() {
      window.location.href = "${callbackUrl.toString()}";
    }
    // Auto-redirect for development (remove in production)
    // setTimeout(authorize, 1000);
  </script>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/html" },
  });
}

// Handle POST /oauth/token - Exchange code for tokens
async function handleToken(req: Request): Promise<Response> {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "invalid_request", message: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token } = body;

  // Handle refresh token grant
  if (grant_type === "refresh_token") {
    if (!refresh_token) {
      return new Response(
        JSON.stringify({ error: "invalid_request", message: "refresh_token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up refresh token
    const { data: tokenData, error: tokenError } = await supabase
      .from("oauth_refresh_tokens")
      .select("*")
      .eq("token", refresh_token)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "invalid_grant", message: "Invalid refresh token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new access token
    const accessToken = generateToken("flt_at");
    const expiresIn = 3600; // 1 hour

    // Store access token
    await supabase.from("oauth_access_tokens").insert({
      token: accessToken,
      user_id: tokenData.user_id,
      client_id: tokenData.client_id,
      scope: tokenData.scope,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refresh_token, // Return same refresh token
        token_type: "Bearer",
        expires_in: expiresIn,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Handle authorization code grant
  if (grant_type !== "authorization_code") {
    return new Response(
      JSON.stringify({ error: "unsupported_grant_type", message: "Only authorization_code and refresh_token grants are supported" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!code || !client_id || !client_secret || !redirect_uri) {
    return new Response(
      JSON.stringify({ error: "invalid_request", message: "Missing required parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate client with secret
  const validation = await validateClient(client_id, redirect_uri, client_secret);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: "invalid_client", message: validation.error }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Look up and validate authorization code
  const { data: authCode, error: codeError } = await supabase
    .from("oauth_authorization_codes")
    .select("*")
    .eq("code", code)
    .eq("client_id", client_id)
    .single();

  if (codeError || !authCode) {
    return new Response(
      JSON.stringify({ error: "invalid_grant", message: "Invalid authorization code" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if code is expired
  if (new Date(authCode.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: "invalid_grant", message: "Authorization code expired" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Delete the used authorization code (one-time use)
  await supabase.from("oauth_authorization_codes").delete().eq("code", code);

  // Generate tokens
  const accessToken = generateToken("flt_at");
  const refreshToken = generateToken("flt_rt");
  const expiresIn = 3600; // 1 hour

  // For development, create a demo user if needed
  let userId = authCode.user_id;
  if (!userId) {
    // Create or get demo user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", "demo@agentpm.dev")
      .single();

    userId = user?.id || "demo-user-id";
  }

  // Store tokens
  await supabase.from("oauth_access_tokens").insert({
    token: accessToken,
    user_id: userId,
    client_id: client_id,
    scope: authCode.scope,
    expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });

  await supabase.from("oauth_refresh_tokens").insert({
    token: refreshToken,
    user_id: userId,
    client_id: client_id,
    scope: authCode.scope,
  });

  return new Response(
    JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: expiresIn,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/functions/v1/oauth", "");

  try {
    if (path === "/authorize" || path === "") {
      if (req.method === "GET") {
        return await handleAuthorize(req);
      }
    } else if (path === "/token") {
      if (req.method === "POST") {
        return await handleToken(req);
      }
    }

    return new Response(
      JSON.stringify({ code: "NOT_FOUND", message: "Requested endpoint was not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OAuth error:", error);
    return new Response(
      JSON.stringify({ error: "server_error", message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
