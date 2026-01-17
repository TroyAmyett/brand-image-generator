import { NextRequest, NextResponse } from 'next/server';

const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';
const CLIENT_ID = process.env.NEXT_PUBLIC_AGENTPM_CLIENT_ID || 'canvas-funnelists-dev';
const CLIENT_SECRET = process.env.AGENTPM_CLIENT_SECRET || 'canvas_secret_dev_placeholder';
const REDIRECT_URI = process.env.NEXT_PUBLIC_AGENTPM_REDIRECT_URI || 'http://localhost:3000/auth/callback';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    // Exchange code for tokens with AgentPM OAuth endpoint
    const tokenResponse = await fetch(`${AGENTPM_BASE_URL}/functions/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('AgentPM token exchange failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to exchange authorization code' },
        { status: tokenResponse.status }
      );
    }

    const tokens = await tokenResponse.json();

    // Return tokens to client
    // Token format: flt_at_xxx (access), flt_rt_xxx (refresh)
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600,
      token_type: tokens.token_type || 'Bearer',
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
