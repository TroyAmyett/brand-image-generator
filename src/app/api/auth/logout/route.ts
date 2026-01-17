import { NextRequest, NextResponse } from 'next/server';

const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);

      // Revoke token on AgentPM side
      try {
        await fetch(`${AGENTPM_BASE_URL}/functions/v1/oauth/revoke`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: accessToken,
            token_type_hint: 'access_token',
          }),
        });
      } catch (revokeError) {
        // Log but don't fail - user is logging out anyway
        console.warn('Token revocation failed:', revokeError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success - user wants to log out
    return NextResponse.json({ success: true });
  }
}
