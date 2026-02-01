import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPreset } from '@/lib/brand-kit';

/** Storage directory for style guide JSON files */
const GUIDES_DIR = path.join(process.cwd(), 'data', 'style-guides');
const ACTIVE_FILE = path.join(GUIDES_DIR, '_active.json');

/** Ensure the directory exists and is seeded */
function ensureStyleGuidesDir(): string {
  if (!fs.existsSync(GUIDES_DIR)) {
    fs.mkdirSync(GUIDES_DIR, { recursive: true });
    const funnelists = getPreset('funnelists');
    if (funnelists) {
      const seeded = { ...funnelists, accountId: 'default' };
      fs.writeFileSync(
        path.join(GUIDES_DIR, 'funnelists.json'),
        JSON.stringify(seeded, null, 2)
      );
    }
    fs.writeFileSync(
      ACTIVE_FILE,
      JSON.stringify({ activeGuideId: 'funnelists' }, null, 2)
    );
  }
  return GUIDES_DIR;
}

/**
 * GET /api/style-guides/active
 * Returns the currently active style guide's full data.
 */
export async function GET() {
  try {
    const dir = ensureStyleGuidesDir();

    // Read active guide ID
    let activeGuideId = 'funnelists';
    if (fs.existsSync(ACTIVE_FILE)) {
      try {
        const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf-8'));
        activeGuideId = active.activeGuideId || 'funnelists';
      } catch {
        // Corrupted file, use default
      }
    }

    // Read the active guide's data
    const guidePath = path.join(dir, `${activeGuideId}.json`);
    if (!fs.existsSync(guidePath)) {
      // Guide file missing - fall back to funnelists preset
      const fallback = getPreset('funnelists');
      return NextResponse.json({
        success: true,
        activeGuideId: 'funnelists',
        guide: fallback ? { ...fallback, accountId: 'default' } : null,
      });
    }

    const content = fs.readFileSync(guidePath, 'utf-8');
    const guide = JSON.parse(content);

    return NextResponse.json({
      success: true,
      activeGuideId,
      guide,
    });
  } catch (error) {
    console.error('Error reading active style guide:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'READ_ERROR',
          message: 'Failed to read active style guide',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/style-guides/active
 * Set the active style guide by ID.
 * Body: { activeGuideId: string }
 */
export async function PUT(request: Request) {
  try {
    const dir = ensureStyleGuidesDir();
    const body = await request.json();

    const { activeGuideId } = body;
    if (!activeGuideId || typeof activeGuideId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'activeGuideId is required and must be a string',
          },
        },
        { status: 400 }
      );
    }

    // Verify the guide exists
    const guidePath = path.join(dir, `${activeGuideId}.json`);
    if (!fs.existsSync(guidePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Style guide "${activeGuideId}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Write the active file
    fs.writeFileSync(
      ACTIVE_FILE,
      JSON.stringify({ activeGuideId }, null, 2)
    );

    // Return the full guide data
    const content = fs.readFileSync(guidePath, 'utf-8');
    const guide = JSON.parse(content);

    return NextResponse.json({
      success: true,
      activeGuideId,
      guide,
    });
  } catch (error) {
    console.error('Error setting active style guide:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to set active style guide',
        },
      },
      { status: 500 }
    );
  }
}
