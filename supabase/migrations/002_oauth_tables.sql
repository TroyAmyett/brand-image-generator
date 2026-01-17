-- OAuth Tables for AgentPM Identity Service
-- Run this against the shared Supabase project: https://ilxgrlnwjtdpikpjocll.supabase.co

-- Authorization Codes (short-lived, single-use)
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    client_id TEXT NOT NULL REFERENCES tool_registrations(client_id),
    redirect_uri TEXT NOT NULL,
    scope TEXT DEFAULT 'read:profile',
    state TEXT,
    user_id UUID REFERENCES auth.users(id),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_code ON oauth_authorization_codes(code);
CREATE INDEX IF NOT EXISTS idx_oauth_auth_codes_expires ON oauth_authorization_codes(expires_at);

-- Access Tokens
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    client_id TEXT NOT NULL REFERENCES tool_registrations(client_id),
    scope TEXT DEFAULT 'read:profile',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_oauth_access_tokens_token ON oauth_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_oauth_access_tokens_expires ON oauth_access_tokens(expires_at);

-- Refresh Tokens (long-lived)
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    client_id TEXT NOT NULL REFERENCES tool_registrations(client_id),
    scope TEXT DEFAULT 'read:profile',
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_oauth_refresh_tokens_token ON oauth_refresh_tokens(token);

-- Cleanup function for expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_tokens()
RETURNS void AS $$
BEGIN
    -- Delete expired authorization codes
    DELETE FROM oauth_authorization_codes WHERE expires_at < NOW();

    -- Delete expired access tokens
    DELETE FROM oauth_access_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can manage OAuth tokens
CREATE POLICY "Service role can manage auth codes" ON oauth_authorization_codes
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage access tokens" ON oauth_access_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage refresh tokens" ON oauth_refresh_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Verify tables created
SELECT 'oauth_authorization_codes' as table_name, COUNT(*) as row_count FROM oauth_authorization_codes
UNION ALL
SELECT 'oauth_access_tokens', COUNT(*) FROM oauth_access_tokens
UNION ALL
SELECT 'oauth_refresh_tokens', COUNT(*) FROM oauth_refresh_tokens;
