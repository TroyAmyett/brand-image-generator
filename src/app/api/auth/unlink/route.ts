import { NextRequest, NextResponse } from 'next/server';
import { logUnlinkAttempt, logUnlinkSuccess, logUnlinkFailure } from '@/lib/auditLog';

export async function POST(request: NextRequest) {
  try {
    const { canvasUserId } = await request.json();

    if (!canvasUserId) {
      return NextResponse.json(
        { error: 'Canvas user ID is required' },
        { status: 400 }
      );
    }

    // Log the unlink attempt
    logUnlinkAttempt(canvasUserId);

    // In a production environment, this would:
    // 1. Update the Canvas user record: set auth_source='standalone', clear agentpm_user_id
    // 2. Revoke any active AgentPM tokens
    // 3. Update audit log

    // Optionally revoke token on AgentPM side
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';

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
        // Log but don't fail - user is unlinking anyway
        console.warn('Token revocation during unlink failed:', revokeError);
      }
    }

    // Log successful unlink
    logUnlinkSuccess(canvasUserId);

    return NextResponse.json({
      success: true,
      message: 'Account unlinked successfully. Your local API keys are preserved.',
    });
  } catch (error) {
    console.error('Account unlinking error:', error);
    const canvasUserId = 'unknown';
    logUnlinkFailure(canvasUserId, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error during account unlinking' },
      { status: 500 }
    );
  }
}
