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
 * GET /api/characters
 * List all characters stored in data/characters/
 */
export async function GET() {
  try {
    const dir = ensureCharactersDir();
    const files = fs.readdirSync(dir).filter(
      (f) => f.endsWith('.json') && !f.startsWith('_')
    );

    const characters: Record<string, unknown>[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        characters.push(JSON.parse(content));
      } catch {
        // Skip malformed files
        console.error(`Failed to read character file: ${file}`);
      }
    }

    return NextResponse.json({ success: true, characters });
  } catch (error) {
    console.error('Error listing characters:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: 'Failed to list characters',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/characters
 * Create a new character from request body.
 * Generates ID from slugified name.
 */
export async function POST(request: Request) {
  try {
    const dir = ensureCharactersDir();
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: 'name is required and must be a non-empty string',
          },
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id =
      body.id ||
      body.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    // Check for duplicate ID
    const filePath = path.join(dir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ID',
            message: `A character with id "${id}" already exists`,
          },
        },
        { status: 409 }
      );
    }

    const character = {
      id,
      name: body.name,
      role: body.role || '',
      product: body.product || '',
      description: body.description || '',
      setting: body.setting || '',
      expression: body.expression || '',
      outfitDescription: body.outfitDescription || '',
      brandAccentColor: body.brandAccentColor || '',
      heroImage: body.heroImage || '',
      referenceImage: body.referenceImage || '',
      provider: body.provider || '',
      createdAt: body.createdAt || now,
      updatedAt: body.updatedAt || now,
    };

    fs.writeFileSync(filePath, JSON.stringify(character, null, 2));

    return NextResponse.json({ success: true, character }, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create character',
        },
      },
      { status: 500 }
    );
  }
}
