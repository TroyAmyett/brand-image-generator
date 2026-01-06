import { NextResponse } from 'next/server';
import { generatePrompt, GenerateImageParams, StyleVariant, Mood } from '@/lib/prompt';
import fs from 'fs';
import path from 'path';

// Valid options for validation
const VALID_USAGE_CONTEXTS = [
    'hero_background', 'blog_hero', 'service_hero', 'card_thumbnail', 'og_image',
    'email_header', 'presentation', 'icon_illustration', 'case_study', 'team_background',
    // Legacy UI values
    'Hero Background', 'Product/Service Card Image', 'Icon', 'Blog Main Image', 'Social Media Post', 'Other'
];

const VALID_DIMENSIONS = [
    '16:9', '16:9_blog', 'og_image', 'square', 'card', 'portrait', 'wide_banner', 'icon',
    // Legacy UI values
    'Full screen (16:9)', 'Square (1:1)', 'Rectangle (4:3)', 'Vertical (9:16)'
];

const VALID_STYLE_VARIANTS: StyleVariant[] = [
    'abstract_tech', 'geometric', 'gradient_mesh', 'isometric', 'particle_flow',
    'neural_network', 'dashboard', 'connection', 'funnel', 'minimal'
];

const VALID_MOODS: Mood[] = ['innovative', 'professional', 'energetic', 'trustworthy', 'futuristic'];

const VALID_OUTPUT_FORMATS = ['png', 'jpg', 'webp'];

// Helper to check API key authentication
function authenticateRequest(request: Request): boolean {
    const apiKey = process.env.GENERATOR_API_KEY;

    // If no API key is configured, allow all requests (dev mode)
    if (!apiKey) {
        return true;
    }

    const providedKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
    return providedKey === apiKey;
}

// Map dimensions to DALL-E 3 supported sizes
function getDalleSize(dimension: string): "1024x1024" | "1024x1792" | "1792x1024" {
    const dimLower = dimension.toLowerCase();

    if (dimLower.includes('vertical') || dimLower.includes('9:16') || dimLower.includes('portrait')) {
        return "1024x1792";
    }
    if (dimLower.includes('16:9') || dimLower.includes('full screen') ||
        dimLower.includes('rectangle') || dimLower.includes('wide') ||
        dimLower.includes('banner') || dimLower.includes('og')) {
        return "1792x1024";
    }
    return "1024x1024"; // Square, icon, card, etc.
}

// Get human-readable dimensions string
function getReadableDimensions(size: string): string {
    switch (size) {
        case "1792x1024": return "1792x1024";
        case "1024x1792": return "1024x1792";
        default: return "1024x1024";
    }
}

export async function POST(request: Request) {
    try {
        // Authentication check
        if (!authenticateRequest(request)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Invalid or missing API key. Provide X-API-Key header.'
                    }
                },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Support both new API format (snake_case) and legacy UI format (camelCase)
        const usage_context = body.usage_context || body.usage;
        const dimensions = body.dimensions || body.dimension;
        const subject = body.subject;
        const mood = body.mood as Mood | undefined;
        const style_variant = body.style_variant as StyleVariant | undefined;
        const additional_details = body.additional_details || body.additionalDetails;
        const output_format = body.output_format || 'png';

        // Validate required fields
        const missingFields: string[] = [];
        if (!usage_context) missingFields.push('usage_context');
        if (!dimensions) missingFields.push('dimensions');
        if (!subject) missingFields.push('subject');

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'MISSING_REQUIRED_FIELDS',
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Validate usage_context
        if (!VALID_USAGE_CONTEXTS.includes(usage_context)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_USAGE_CONTEXT',
                        message: `Invalid usage_context. Must be one of: ${VALID_USAGE_CONTEXTS.slice(0, 10).join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Validate dimensions
        if (!VALID_DIMENSIONS.includes(dimensions)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_DIMENSIONS',
                        message: `Invalid dimensions. Must be one of: ${VALID_DIMENSIONS.slice(0, 8).join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Validate optional mood
        if (mood && !VALID_MOODS.includes(mood)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_MOOD',
                        message: `Invalid mood. Must be one of: ${VALID_MOODS.join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Validate optional style_variant
        if (style_variant && !VALID_STYLE_VARIANTS.includes(style_variant)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_STYLE_VARIANT',
                        message: `Invalid style_variant. Must be one of: ${VALID_STYLE_VARIANTS.join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Validate output_format
        if (!VALID_OUTPUT_FORMATS.includes(output_format)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_OUTPUT_FORMAT',
                        message: `Invalid output_format. Must be one of: ${VALID_OUTPUT_FORMATS.join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Check OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SERVER_CONFIG_ERROR',
                        message: 'OpenAI API key not configured on server'
                    }
                },
                { status: 500 }
            );
        }

        // Build prompt using the updated prompt generator
        const params: GenerateImageParams = {
            usage: usage_context,
            dimension: dimensions,
            subject,
            additionalDetails: additional_details,
            mood: mood || 'innovative',
            style_variant
        };

        const prompt = generatePrompt(params);
        const size = getDalleSize(dimensions);

        // Initialize OpenAI and generate image
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        console.log(`[API] Generating image - Size: ${size}, Style: ${style_variant || 'auto'}, Mood: ${mood || 'innovative'}`);

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            size: size,
            quality: "hd",
            n: 1,
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'GENERATION_FAILED',
                        message: 'No image URL returned from DALL-E API'
                    }
                },
                { status: 500 }
            );
        }

        // Build response metadata
        const timestamp = new Date().toISOString();
        const appliedStyle = style_variant || 'auto-detected';

        // Save to history (local JSON)
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const historyPath = path.join(dataDir, 'history.json');

            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }

            let history = [];
            if (fs.existsSync(historyPath)) {
                const fileContent = fs.readFileSync(historyPath, 'utf-8');
                history = JSON.parse(fileContent);
            }

            history.unshift({
                id: timestamp,
                timestamp,
                usage: usage_context,
                dimension: dimensions,
                subject,
                mood: mood || 'innovative',
                style_variant: appliedStyle,
                imageUrl,
                prompt
            });

            if (history.length > 50) {
                history = history.slice(0, 50);
            }

            fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        } catch (err) {
            console.error('Failed to save to JSON history:', err);
        }

        // Append to markdown log
        try {
            const logEntry = `\n## ${timestamp} - ${usage_context}\n**Subject:** ${subject}\n**Dimensions:** ${dimensions}\n**Mood:** ${mood || 'innovative'}\n**Style:** ${appliedStyle}\n**URL:** ${imageUrl}\n**Prompt:**\n\`\`\`\n${prompt}\n\`\`\`\n---\n`;
            const logPath = path.join(process.cwd(), 'generated_history.md');
            fs.appendFileSync(logPath, logEntry);
        } catch {
            // Silent fail for logging
        }

        // Return success response with new format
        return NextResponse.json({
            success: true,
            image_url: imageUrl,
            prompt_used: prompt,
            metadata: {
                dimensions: getReadableDimensions(size),
                format: output_format,
                generated_at: timestamp,
                model: 'dall-e-3',
                style_applied: appliedStyle,
                mood_applied: mood || 'innovative'
            },
            // Legacy fields for backward compatibility with UI
            imageUrl: imageUrl,
            prompt: prompt
        });

    } catch (error) {
        console.error('Error generating image:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: errorMessage
                }
            },
            { status: 500 }
        );
    }
}
