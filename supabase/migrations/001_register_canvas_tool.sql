-- Canvas-AgentPM Federation Phase 3: Register Canvas as a federated tool
-- This migration registers Canvas in the AgentPM tool_registrations table
-- Run this against the shared Supabase project: https://ilxgrlnwjtdpikpjocll.supabase.co

-- Generate a secure client secret (store this securely in Canvas .env)
-- The secret below should be replaced with a securely generated value
-- Use: SELECT encode(gen_random_bytes(32), 'hex') to generate

-- Insert Canvas tool registration
INSERT INTO tool_registrations (
    name,
    base_url,
    callback_url,
    client_id,
    client_secret_hash,
    scopes,
    created_at,
    updated_at
) VALUES (
    'Canvas Image Generator',
    'https://canvas.funnelists.com',
    'https://canvas.funnelists.com/auth/callback',
    'canvas-funnelists',
    -- Hash of the client secret using SHA-256
    -- The actual secret: 'canvas_secret_REPLACE_WITH_GENERATED_VALUE'
    -- For development, we'll use a placeholder that should be replaced
    encode(sha256('canvas_secret_dev_placeholder'::bytea), 'hex'),
    ARRAY['read:keys', 'read:profile'],
    NOW(),
    NOW()
)
ON CONFLICT (client_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    callback_url = EXCLUDED.callback_url,
    scopes = EXCLUDED.scopes,
    updated_at = NOW();

-- Also add localhost callback for development
INSERT INTO tool_registrations (
    name,
    base_url,
    callback_url,
    client_id,
    client_secret_hash,
    scopes,
    created_at,
    updated_at
) VALUES (
    'Canvas Image Generator (Dev)',
    'http://localhost:3000',
    'http://localhost:3000/auth/callback',
    'canvas-funnelists-dev',
    encode(sha256('canvas_secret_dev_placeholder'::bytea), 'hex'),
    ARRAY['read:keys', 'read:profile'],
    NOW(),
    NOW()
)
ON CONFLICT (client_id) DO UPDATE SET
    name = EXCLUDED.name,
    base_url = EXCLUDED.base_url,
    callback_url = EXCLUDED.callback_url,
    scopes = EXCLUDED.scopes,
    updated_at = NOW();

-- Verify the registration
SELECT client_id, name, callback_url, scopes FROM tool_registrations
WHERE client_id IN ('canvas-funnelists', 'canvas-funnelists-dev');
