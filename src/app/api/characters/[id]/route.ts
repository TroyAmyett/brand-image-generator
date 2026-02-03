import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/** Storage directory for character JSON files */
const CHARACTERS_DIR = path.join(process.cwd(), 'data', 'characters');

/**
 * Ensure the characters directory exists.
 * Creates it recursively on first access.
 */
function ensureCharactersDir(): string {
  if (!fs.existsSync(CHARACTERS_DIR)) {
    fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
  }
  return CHARACTERS_DIR;
}

/**
 * PUT /api/characters/[id]
 * Update an existing character. Sets updatedAt to now.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dir = ensureCharactersDir();
    const filePath = path.join(dir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Character "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const body = await request.json();

    const updated = {
      ...existing,
      ...body,
      id, // Prevent ID from being changed
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));

    return NextResponse.json({ success: true, character: updated });
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to update character',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/characters/[id]
 * Delete a character by ID.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dir = ensureCharactersDir();
    const filePath = path.join(dir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Character "${id}" not found`,
          },
        },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: `Character "${id}" deleted`,
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: 'Failed to delete character',
        },
      },
      { status: 500 }
    );
  }
}
