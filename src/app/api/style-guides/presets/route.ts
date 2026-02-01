import { NextResponse } from 'next/server';
import { getAllPresets } from '@funnelists/brand';

/**
 * GET /api/style-guides/presets
 * Returns all available preset style guides from the @funnelists/brand package.
 */
export async function GET() {
  try {
    const presets = getAllPresets();

    return NextResponse.json({
      success: true,
      presets,
    });
  } catch (error) {
    console.error('Error listing presets:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PRESETS_ERROR',
          message: 'Failed to list presets',
        },
      },
      { status: 500 }
    );
  }
}
