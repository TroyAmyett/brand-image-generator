import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getPreset, slugify } from '@funnelists/brand';
import type { BrandStyleGuide } from '@funnelists/brand';

/** Storage directory for style guide JSON files */
const GUIDES_DIR = path.join(process.cwd(), 'data', 'style-guides');
const ACTIVE_FILE = path.join(GUIDES_DIR, '_active.json');

/**
 * Ensure the style-guides directory exists and is seeded with defaults.
 * On first access, seeds the funnelists preset and sets it as active.
 */
function ensureStyleGuidesDir(): string {
  if (!fs.existsSync(GUIDES_DIR)) {
    fs.mkdirSync(GUIDES_DIR, { recursive: true });
    // Seed with funnelists preset
    const funnelists = getPreset('funnelists');
    if (funnelists) {
      const seeded = { ...funnelists, accountId: 'default' };
      fs.writeFileSync(
        path.join(GUIDES_DIR, 'funnelists.json'),
        JSON.stringify(seeded, null, 2)
      );
    }
    // Set active guide
    fs.writeFileSync(
      ACTIVE_FILE,
      JSON.stringify({ activeGuideId: 'funnelists' }, null, 2)
    );
  }
  return GUIDES_DIR;
}

/**
 * GET /api/style-guides
 * List all style guides stored in data/style-guides/
 */
export async function GET() {
  try {
    const dir = ensureStyleGuidesDir();
    const files = fs.readdirSync(dir).filter(
      (f) => f.endsWith('.json') && !f.startsWith('_')
    );

    const guides: (BrandStyleGuide & { accountId?: string })[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(dir, file), 'utf-8');
        guides.push(JSON.parse(content));
      } catch {
        // Skip malformed files
        console.error(`Failed to read style guide file: ${file}`);
      }
    }

    return NextResponse.json({ success: true, guides });
  } catch (error) {
    console.error('Error listing style guides:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIST_ERROR',
          message: 'Failed to list style guides',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/style-guides
 * Create a new style guide from request body.
 * Generates ID from slugified name.
 */
export async function POST(request: Request) {
  try {
    const dir = ensureStyleGuidesDir();
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
    const id = body.id || slugify(body.name);

    // Check for duplicate ID
    const filePath = path.join(dir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_ID',
            message: `A style guide with id "${id}" already exists`,
          },
        },
        { status: 409 }
      );
    }

    const guide: BrandStyleGuide & { accountId: string } = {
      id,
      name: body.name,
      description: body.description,
      sourceUrl: body.sourceUrl,
      logo: body.logo,
      colors: body.colors || {
        primary: [],
        secondary: [],
        accent: [],
        forbidden: [],
        background: '#ffffff',
      },
      typography: body.typography || {},
      visualStyle: body.visualStyle || {
        styleKeywords: [],
        mood: [],
        description: '',
        avoidKeywords: [],
      },
      industry: body.industry,
      metadata: body.metadata,
      accountId: body.accountId || 'default',
      createdAt: body.createdAt || now,
      updatedAt: body.updatedAt || now,
    };

    fs.writeFileSync(filePath, JSON.stringify(guide, null, 2));

    return NextResponse.json({ success: true, guide }, { status: 201 });
  } catch (error) {
    console.error('Error creating style guide:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create style guide',
        },
      },
      { status: 500 }
    );
  }
}
