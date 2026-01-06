import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STYLE_GUIDE_PATH = path.join(process.cwd(), 'STYLE_GUIDE.md');

// GET - Read the style guide
export async function GET() {
    try {
        if (!fs.existsSync(STYLE_GUIDE_PATH)) {
            return NextResponse.json({
                success: true,
                content: '',
                message: 'Style guide file not found, starting fresh'
            });
        }

        const content = fs.readFileSync(STYLE_GUIDE_PATH, 'utf-8');

        return NextResponse.json({
            success: true,
            content,
            lastModified: fs.statSync(STYLE_GUIDE_PATH).mtime.toISOString()
        });
    } catch (error) {
        console.error('Error reading style guide:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'READ_ERROR',
                    message: 'Failed to read style guide'
                }
            },
            { status: 500 }
        );
    }
}

// PUT - Update the style guide
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { content } = body;

        if (typeof content !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_CONTENT',
                        message: 'Content must be a string'
                    }
                },
                { status: 400 }
            );
        }

        fs.writeFileSync(STYLE_GUIDE_PATH, content, 'utf-8');

        return NextResponse.json({
            success: true,
            message: 'Style guide updated successfully',
            lastModified: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error writing style guide:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'WRITE_ERROR',
                    message: 'Failed to save style guide'
                }
            },
            { status: 500 }
        );
    }
}
