import { NextRequest, NextResponse } from 'next/server';
import { logLinkAttempt, logLinkSuccess, logLinkFailure } from '@/lib/auditLog';

const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';
const CLIENT_ID = process.env.NEXT_PUBLIC_AGENTPM_CLIENT_ID || 'canvas-funnelists-dev';
const CLIENT_SECRET = process.env.AGENTPM_CLIENT_SECRET || 'canvas_secret_dev_placeholder';

export async function POST(request: NextRequest) {
  try {
    const { code, canvasUserId, canvasEmail, redirectUri } = await request.json();

    if (!code || !canvasUserId) {
      return NextResponse.json(
        { error: 'Authorization code and canvas user ID are required' },
        { status: 400 }
      );
    }

    // Log the linking attempt
    logLinkAttempt(canvasUserId, canvasEmail);

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
        redirect_uri: redirectUri,
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

    // Fetch user profile from AgentPM to get email
    const profileResponse = await fetch(`${AGENTPM_BASE_URL}/functions/v1/oauth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch AgentPM user profile' },
        { status: 500 }
      );
    }

    const profile = await profileResponse.json();
    const agentpmEmail = profile.email;
    const agentpmUserId = profile.sub || profile.id;

    // Verify email match if canvasEmail was provided
    if (canvasEmail && agentpmEmail && canvasEmail.toLowerCase() !== agentpmEmail.toLowerCase()) {
      logLinkFailure(canvasUserId, 'Email mismatch', { canvasEmail, agentpmEmail });
      return NextResponse.json(
        {
          error: `Email mismatch: Canvas account uses ${canvasEmail} but AgentPM account uses ${agentpmEmail}. Please use the same email for both accounts or contact support.`,
          emailMismatch: true,
          canvasEmail,
          agentpmEmail,
        },
        { status: 400 }
      );
    }

    // Check if AgentPM account is already linked to another Canvas user
    // This would need a database query in production
    // For now, we'll proceed with the linking

    // Log successful link
    logLinkSuccess(canvasUserId, agentpmUserId, agentpmEmail);

    // Return tokens and user info
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in || 3600,
      agentpmUserId,
      agentpmEmail,
      linked: true,
    });
  } catch (error) {
    console.error('Account linking error:', error);
    return NextResponse.json(
      { error: 'Internal server error during account linking' },
      { status: 500 }
    );
  }
}
