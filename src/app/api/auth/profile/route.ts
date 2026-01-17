import { NextRequest, NextResponse } from 'next/server';

const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // Fetch user profile from AgentPM
    const profileResponse = await fetch(`${AGENTPM_BASE_URL}/functions/v1/oauth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json().catch(() => ({}));
      console.error('AgentPM profile fetch failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch profile' },
        { status: profileResponse.status }
      );
    }

    const profile = await profileResponse.json();

    return NextResponse.json({
      id: profile.sub || profile.id,
      email: profile.email,
      name: profile.name || profile.full_name,
      avatar_url: profile.picture || profile.avatar_url,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
