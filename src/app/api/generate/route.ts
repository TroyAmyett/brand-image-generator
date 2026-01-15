import { NextResponse } from 'next/server';
import { generatePrompt, GenerateImageParams, StyleVariant, Mood, AssetType, BrandTheme } from '@/lib/prompt';
import { processAssetSet, bufferToDataUrl, ASSET_VARIANTS } from '@/lib/imageProcessor';
import { generateImage, ImageProvider, PROVIDER_CONFIGS } from '@/lib/providers';
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
    // New asset set dimensions
    'hero_wide', 'card_4x3', 'card_3x2', 'master',
    // Legacy UI values
    'Full screen (16:9)', 'Square (1:1)', 'Rectangle (4:3)', 'Vertical (9:16)',
    'Hero Wide (21:9)', 'Card (4:3)', 'Card (3:2)'
];

// Valid asset set variants
const VALID_ASSET_SET_VARIANTS = ['master', 'hero_wide', 'card_4x3', 'card_3x2', 'square'];

const VALID_STYLE_VARIANTS: StyleVariant[] = [
    'clean_tech', 'abstract_tech', 'geometric', 'gradient_mesh', 'isometric', 'particle_flow',
    'neural_network', 'dashboard', 'connection', 'funnel', 'minimal'
];

const VALID_MOODS: Mood[] = ['innovative', 'professional', 'energetic', 'trustworthy', 'futuristic'];

const VALID_ASSET_TYPES: AssetType[] = [
    'hero_image', 'infographic', 'process_flow', 'comparison', 'checklist',
    'timeline', 'diagram', 'quote_card', 'stats_highlight', 'icon_set'
];

const VALID_BRAND_THEMES: BrandTheme[] = ['salesforce', 'general_ai', 'blockchain', 'neutral', 'minimal', 'photorealistic'];

const VALID_OUTPUT_FORMATS = ['png', 'jpg', 'webp'];

const VALID_IMAGE_PROVIDERS = ['openai', 'anthropic', 'stability', 'replicate'];

// Helper to check API key authentication
function authenticateRequest(request: Request): boolean {
    const apiKey = process.env.GENERATOR_API_KEY;

    // If no API key is configured, allow all requests (dev mode)
    if (!apiKey) {
        return true;
    }

    // Check for API key in header
    const providedKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
    if (providedKey === apiKey) {
        return true;
    }

    // Allow same-origin requests (UI) without API key
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // If request comes from the same host (UI), allow it
    if (host && (origin?.includes(host) || referer?.includes(host))) {
        return true;
    }

    // For Vercel deployments, check if referer matches the deployment URL
    if (referer && (referer.includes('vercel.app') || referer.includes('localhost'))) {
        const refererHost = new URL(referer).host;
        if (host === refererHost) {
            return true;
        }
    }

    return false;
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
        const title = body.title as string | undefined;
        const subject = body.subject;
        const mood = body.mood as Mood | undefined;
        const style_variant = body.style_variant as StyleVariant | undefined;
        const asset_type = body.asset_type as AssetType | undefined;
        const brand_theme = body.brand_theme as BrandTheme | undefined;
        const additional_details = body.additional_details || body.additionalDetails;
        const output_format = body.output_format || 'png';
        const image_provider = body.image_provider || 'openai';

        // Asset Set mode parameters
        const generate_mode = body.generate_mode || 'single'; // 'single' or 'asset_set'
        const asset_set_variants = body.asset_set_variants as string[] || ['master', 'hero_wide', 'card_4x3'];

        // Validate required fields
        const missingFields: string[] = [];
        if (!usage_context) missingFields.push('usage_context');
        if (!dimensions && generate_mode !== 'asset_set') missingFields.push('dimensions');
        if (!title) missingFields.push('title');
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

        // Validate dimensions (skip for asset_set mode)
        if (generate_mode !== 'asset_set' && !VALID_DIMENSIONS.includes(dimensions)) {
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

        // Validate generate_mode
        if (generate_mode !== 'single' && generate_mode !== 'asset_set') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_GENERATE_MODE',
                        message: 'Invalid generate_mode. Must be "single" or "asset_set"'
                    }
                },
                { status: 400 }
            );
        }

        // Validate asset_set_variants
        if (generate_mode === 'asset_set') {
            const invalidVariants = asset_set_variants.filter((v: string) => !VALID_ASSET_SET_VARIANTS.includes(v));
            if (invalidVariants.length > 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'INVALID_ASSET_SET_VARIANTS',
                            message: `Invalid asset_set_variants: ${invalidVariants.join(', ')}. Must be one of: ${VALID_ASSET_SET_VARIANTS.join(', ')}`
                        }
                    },
                    { status: 400 }
                );
            }
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

        // Validate optional asset_type
        if (asset_type && !VALID_ASSET_TYPES.includes(asset_type)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_ASSET_TYPE',
                        message: `Invalid asset_type. Must be one of: ${VALID_ASSET_TYPES.join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Validate optional brand_theme
        if (brand_theme && !VALID_BRAND_THEMES.includes(brand_theme)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_BRAND_THEME',
                        message: `Invalid brand_theme. Must be one of: ${VALID_BRAND_THEMES.join(', ')}`
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

        // Validate image_provider
        if (!VALID_IMAGE_PROVIDERS.includes(image_provider)) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_IMAGE_PROVIDER',
                        message: `Invalid image_provider. Must be one of: ${VALID_IMAGE_PROVIDERS.join(', ')}`
                    }
                },
                { status: 400 }
            );
        }

        // Check provider availability
        const providerConfig = PROVIDER_CONFIGS[image_provider as ImageProvider];
        if (!providerConfig || !providerConfig.available) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'PROVIDER_NOT_AVAILABLE',
                        message: `Image provider '${image_provider}' is not yet available.`
                    }
                },
                { status: 400 }
            );
        }

        // Check API key for selected provider
        const apiKeyEnvVar = providerConfig.envKeyName;
        if (!process.env[apiKeyEnvVar]) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'SERVER_CONFIG_ERROR',
                        message: `${providerConfig.name} API key not configured on server. Set ${apiKeyEnvVar} environment variable.`
                    }
                },
                { status: 500 }
            );
        }

        // Build prompt using the updated prompt generator
        const isAssetSet = generate_mode === 'asset_set';
        const params: GenerateImageParams = {
            usage: usage_context,
            dimension: isAssetSet ? 'master' : dimensions, // Asset set always generates master 16:9
            subject,
            additionalDetails: additional_details,
            mood: mood || 'innovative',
            style_variant,
            asset_type: asset_type || 'hero_image',
            brand_theme: brand_theme || 'salesforce',
            is_asset_set: isAssetSet
        };

        const prompt = generatePrompt(params);
        // Asset set always generates at 1792x1024 (master 16:9)
        const size = isAssetSet ? "1792x1024" : getDalleSize(dimensions);
        const [width, height] = size.split('x').map(Number);

        console.log(`[API] Generating image - Provider: ${image_provider}, Mode: ${generate_mode}, Size: ${size}, Style: ${style_variant || 'auto'}, Mood: ${mood || 'innovative'}`);

        // Generate image using the provider abstraction
        const generationResult = await generateImage({
            provider: image_provider as ImageProvider,
            prompt: prompt,
            width,
            height,
            quality: 'hd',
            style: 'natural'
        });

        if (!generationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: generationResult.error
                },
                { status: 500 }
            );
        }

        // Get image URL or base64 from result
        const masterImageUrl = generationResult.imageUrl || generationResult.imageBase64;
        const usedModel = generationResult.model || providerConfig.defaultModel || 'unknown';

        if (!masterImageUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'GENERATION_FAILED',
                        message: 'No image returned from provider'
                    }
                },
                { status: 500 }
            );
        }

        // Build response metadata
        const timestamp = new Date().toISOString();
        const appliedStyle = style_variant || 'auto-detected';
        const appliedAssetType = asset_type || 'hero_image';
        const appliedBrandTheme = brand_theme || 'salesforce';

        // Handle Asset Set mode - process variants
        if (isAssetSet) {
            console.log(`[API] Processing asset set variants: ${asset_set_variants.join(', ')}`);

            try {
                const processedImages = await processAssetSet(masterImageUrl, asset_set_variants);

                // Build asset set response
                const assetSet: Record<string, { url: string; dimensions: string; width: number; height: number }> = {};

                for (const [key, processed] of Object.entries(processedImages)) {
                    const variant = ASSET_VARIANTS[key];
                    assetSet[key] = {
                        url: bufferToDataUrl(processed.buffer, processed.format),
                        dimensions: `${processed.width}x${processed.height}`,
                        width: processed.width,
                        height: processed.height
                    };
                }

                // Save to history
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
                        dimension: 'asset_set',
                        title,
                        subject,
                        mood: mood || 'innovative',
                        style_variant: appliedStyle,
                        brand_theme: appliedBrandTheme,
                        imageUrl: assetSet.master?.url || masterImageUrl,
                        prompt,
                        is_asset_set: true,
                        variants: Object.keys(assetSet)
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
                    const logEntry = `\n## ${timestamp} - ${usage_context} (Asset Set)\n**Title:** ${title}\n**Subject:** ${subject}\n**Variants:** ${Object.keys(assetSet).join(', ')}\n**Mood:** ${mood || 'innovative'}\n**Style:** ${appliedStyle}\n**Prompt:**\n\`\`\`\n${prompt}\n\`\`\`\n---\n`;
                    const logPath = path.join(process.cwd(), 'generated_history.md');
                    fs.appendFileSync(logPath, logEntry);
                } catch {
                    // Silent fail for logging
                }

                return NextResponse.json({
                    success: true,
                    generate_mode: 'asset_set',
                    asset_set: assetSet,
                    title,
                    prompt_used: prompt,
                    metadata: {
                        title,
                        format: output_format,
                        generated_at: timestamp,
                        image_provider: image_provider,
                        model: usedModel,
                        style_applied: appliedStyle,
                        mood_applied: mood || 'innovative',
                        asset_type_applied: appliedAssetType,
                        brand_theme_applied: appliedBrandTheme,
                        variants_generated: Object.keys(assetSet)
                    },
                    // Legacy fields for backward compatibility
                    imageUrl: assetSet.master?.url || masterImageUrl,
                    prompt: prompt
                });

            } catch (processError) {
                console.error('Failed to process asset set:', processError);
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'ASSET_SET_PROCESSING_FAILED',
                            message: processError instanceof Error ? processError.message : 'Failed to process asset set variants'
                        }
                    },
                    { status: 500 }
                );
            }
        }

        // Single image mode (original behavior)
        const imageUrl = masterImageUrl;

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
                title,
                subject,
                mood: mood || 'innovative',
                style_variant: appliedStyle,
                brand_theme: appliedBrandTheme,
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
            const logEntry = `\n## ${timestamp} - ${usage_context}\n**Title:** ${title}\n**Subject:** ${subject}\n**Dimensions:** ${dimensions}\n**Mood:** ${mood || 'innovative'}\n**Style:** ${appliedStyle}\n**URL:** ${imageUrl}\n**Prompt:**\n\`\`\`\n${prompt}\n\`\`\`\n---\n`;
            const logPath = path.join(process.cwd(), 'generated_history.md');
            fs.appendFileSync(logPath, logEntry);
        } catch {
            // Silent fail for logging
        }

        // Return success response with new format
        return NextResponse.json({
            success: true,
            generate_mode: 'single',
            image_url: imageUrl,
            title,
            prompt_used: prompt,
            metadata: {
                title,
                dimensions: getReadableDimensions(size),
                format: output_format,
                generated_at: timestamp,
                image_provider: image_provider,
                model: usedModel,
                style_applied: appliedStyle,
                mood_applied: mood || 'innovative',
                asset_type_applied: appliedAssetType,
                brand_theme_applied: appliedBrandTheme
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
