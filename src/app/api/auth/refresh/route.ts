import { NextRequest, NextResponse } from 'next/server';

const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';
const CLIENT_ID = process.env.NEXT_PUBLIC_AGENTPM_CLIENT_ID || 'canvas-funnelists-dev';
const CLIENT_SECRET = process.env.AGENTPM_CLIENT_SECRET || 'canvas_secret_dev_placeholder';

export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Refresh tokens with AgentPM OAuth endpoint
    const tokenResponse = await fetch(`${AGENTPM_BASE_URL}/functions/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('AgentPM token refresh failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to refresh token' },
        { status: tokenResponse.status }
      );
    }

    const tokens = await tokenResponse.json();

    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600,
      token_type: tokens.token_type || 'Bearer',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
