import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPreset } from '@/lib/brand-kit';
import type { BrandStyleGuide } from '@/lib/brand-kit';

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
 * GET /api/style-guides/[id]
 * Read a single style guide by ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dir = ensureStyleGuidesDir();
    const filePath = path.join(dir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Style guide "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const guide = JSON.parse(content);

    return NextResponse.json({ success: true, guide });
  } catch (error) {
    console.error('Error reading style guide:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'READ_ERROR',
          message: 'Failed to read style guide',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/style-guides/[id]
 * Update an existing style guide. Sets updatedAt to now.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dir = ensureStyleGuidesDir();
    const filePath = path.join(dir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Style guide "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const body = await request.json();

    const updated: BrandStyleGuide & { accountId: string } = {
      ...existing,
      ...body,
      id, // Prevent ID from being changed
      accountId: body.accountId || existing.accountId || 'default',
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

    return NextResponse.json({ success: true, guide: updated });
  } catch (error) {
    console.error('Error updating style guide:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update style guide',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/style-guides/[id]
 * Delete a style guide. If it was the active guide, revert to 'funnelists'.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dir = ensureStyleGuidesDir();
    const filePath = path.join(dir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Style guide "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    // Delete the file
    fs.unlinkSync(filePath);

    // If deleted guide was active, revert to funnelists
    if (fs.existsSync(ACTIVE_FILE)) {
      try {
        const active = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf-8'));
        if (active.activeGuideId === id) {
          fs.writeFileSync(
            ACTIVE_FILE,
            JSON.stringify({ activeGuideId: 'funnelists' }, null, 2)
          );
        }
      } catch {
        // If active file is corrupted, reset it
        fs.writeFileSync(
          ACTIVE_FILE,
          JSON.stringify({ activeGuideId: 'funnelists' }, null, 2)
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Style guide "${id}" deleted`,
    });
  } catch (error) {
    console.error('Error deleting style guide:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete style guide',
        },
      },
      { status: 500 }
    );
  }
}
