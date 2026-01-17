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

    // Fetch API keys list from AgentPM
    const keysResponse = await fetch(`${AGENTPM_BASE_URL}/functions/v1/api-keys`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!keysResponse.ok) {
      const errorData = await keysResponse.json().catch(() => ({}));
      console.error('AgentPM keys fetch failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch API keys' },
        { status: keysResponse.status }
      );
    }

    const data = await keysResponse.json();

    // Return list of keys with hints (not full keys)
    return NextResponse.json({
      keys: data.keys || data || [],
    });
  } catch (error) {
    console.error('Keys fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
