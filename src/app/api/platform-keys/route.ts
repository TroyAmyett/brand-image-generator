import { NextResponse } from 'next/server';

/**
 * GET /api/platform-keys
 * Returns which platform API keys are available (configured in environment)
 * This allows the UI to know if platform keys exist server-side
 */
export async function GET() {
  const platformKeys = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    stability: !!process.env.STABILITY_API_KEY,
    replicate: !!process.env.REPLICATE_API_KEY,
  };

  return NextResponse.json({
    success: true,
    platformKeys,
  });
}
