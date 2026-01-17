import { NextRequest, NextResponse } from 'next/server';

const AGENTPM_BASE_URL = process.env.NEXT_PUBLIC_AGENTPM_SUPABASE_URL || 'https://ilxgrlnwjtdpikpjocll.supabase.co';

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { provider } = await params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // Fetch decrypted API key for specific provider from AgentPM
    const keyResponse = await fetch(`${AGENTPM_BASE_URL}/functions/v1/api-keys/${encodeURIComponent(provider)}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!keyResponse.ok) {
      const errorData = await keyResponse.json().catch(() => ({}));

      if (keyResponse.status === 404) {
        return NextResponse.json(
          { error: 'API key not found for this provider' },
          { status: 404 }
        );
      }

      console.error('AgentPM key fetch failed:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch API key' },
        { status: keyResponse.status }
      );
    }

    const data = await keyResponse.json();

    // Return the decrypted key
    return NextResponse.json({
      api_key: data.api_key || data.key,
      provider: data.provider || provider,
    });
  } catch (error) {
    console.error('Key fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
