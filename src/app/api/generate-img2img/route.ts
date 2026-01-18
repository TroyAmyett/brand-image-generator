import { NextResponse } from 'next/server';
import dns from 'dns';
import { BrandTheme } from '@/lib/prompt';

// Force IPv4 first to avoid Cloudflare connection issues
dns.setDefaultResultOrder('ipv4first');

// Stability AI image-to-image endpoint (v1 SDK compatible)
const STABILITY_IMG2IMG_URL = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image';

export type TransformationMode = 'style_transfer' | 'reimagine' | 'enhance_brand';

export interface PreserveOptions {
    preserveText: boolean;
    preserveLayout: boolean;
    preserveColors: boolean;
}

interface Img2ImgRequest {
    sourceImage: string; // Base64 data URL
    transformationMode: TransformationMode;
    styleStrength: number; // 0-100
    preserveOptions: PreserveOptions;
    brandTheme: BrandTheme;
    userApiKey?: string;
}

// Brand theme style prompts - more specific and detailed
const BRAND_STYLE_PROMPTS: Record<BrandTheme, string> = {
    funnelists: 'Transform into Funnelists futuristic tech aesthetic with cyan (#0ea5e9), teal (#14b8a6), and blue (#3b82f6) primary colors, glowing neon lines, circuit board patterns, holographic elements, isometric 3D platforms floating in dark space, cyberpunk data visualization, enterprise AI aesthetic, dark black background with emerald green accents',
    salesforce: 'Transform into Salesforce enterprise aesthetic with bright cyan blue (#00A1E0) color scheme, fluffy white cloud motifs, clean corporate design, professional software interface look, blue gradient backgrounds, modern SaaS visual style',
    general_ai: 'Transform into futuristic AI technology aesthetic with glowing cyan and purple neon accents, abstract neural network patterns, digital data streams, circuit board textures, high-tech sci-fi visualization, dark backgrounds with luminous elements',
    blockchain: 'Transform into blockchain technology aesthetic with interconnected glowing nodes, hexagonal patterns, cryptographic symbols, distributed network visualization, blue and gold metallic accents, decentralized grid patterns',
    neutral: 'Transform into clean professional corporate aesthetic with modern minimalist design, balanced neutral color palette, subtle blue accents, professional business style, polished corporate look',
    minimal: 'Transform into ultra-minimalist design aesthetic with clean geometric lines, generous white space, simple elegant composition, muted sophisticated monochromatic colors, zen-like simplicity',
    photorealistic: 'Enhance with photorealistic quality, natural studio lighting, sharp focus, professional photography post-processing, realistic textures and materials, high dynamic range'
};

// Transformation mode prompts - more directive
const MODE_PROMPTS: Record<TransformationMode, string> = {
    style_transfer: 'Completely restyle this image while keeping the same composition and subjects.',
    reimagine: 'Create a dramatic new artistic interpretation of this image.',
    enhance_brand: 'Apply color grading and subtle stylistic enhancement to this image.'
};

// Generate the full prompt based on settings
function generateImg2ImgPrompt(
    transformationMode: TransformationMode,
    brandTheme: BrandTheme,
    preserveOptions: PreserveOptions
): string {
    let prompt = MODE_PROMPTS[transformationMode];
    prompt += ' ' + BRAND_STYLE_PROMPTS[brandTheme];

    // Add preservation instructions
    const preserveInstructions: string[] = [];
    if (preserveOptions.preserveText) {
        preserveInstructions.push('keep all text and labels readable');
    }
    if (preserveOptions.preserveLayout) {
        preserveInstructions.push('maintain the exact spatial layout');
    }
    if (preserveOptions.preserveColors) {
        preserveInstructions.push('preserve the original color palette');
    }

    if (preserveInstructions.length > 0) {
        prompt += ` Important: ${preserveInstructions.join(', ')}.`;
    }

    // Add quality boosters
    prompt += ' Ultra high quality, sharp details, professional result, masterpiece.';

    return prompt;
}

// Generate negative prompt based on mode
function generateNegativePrompt(transformationMode: TransformationMode): string {
    const baseNegative = 'blurry, low quality, distorted, watermark, jpeg artifacts, noise, grainy, pixelated';

    if (transformationMode === 'enhance_brand') {
        return baseNegative + ', dramatic changes, oversaturated, unnatural colors';
    }

    return baseNegative + ', ugly, deformed, amateur, unprofessional';
}

// Calculate cfg_scale based on transformation mode (higher = more prompt influence)
function getCfgScale(transformationMode: TransformationMode): number {
    switch (transformationMode) {
        case 'reimagine':
            return 15; // Maximum prompt influence for reimagining
        case 'style_transfer':
            return 12; // Strong prompt influence for style transfer
        case 'enhance_brand':
            return 10; // Moderate influence for subtle enhancement
        default:
            return 12;
    }
}

// Calculate steps based on transformation mode
function getSteps(transformationMode: TransformationMode): number {
    switch (transformationMode) {
        case 'reimagine':
            return 40; // More steps for dramatic changes
        case 'style_transfer':
            return 35;
        case 'enhance_brand':
            return 30;
        default:
            return 35;
    }
}

export async function POST(request: Request) {
    try {
        const body: Img2ImgRequest = await request.json();

        const {
            sourceImage,
            transformationMode,
            styleStrength,
            preserveOptions,
            brandTheme,
            userApiKey
        } = body;

        // Validate required fields
        if (!sourceImage) {
            return NextResponse.json({
                success: false,
                error: { code: 'MISSING_SOURCE_IMAGE', message: 'Source image is required' }
            }, { status: 400 });
        }

        if (!transformationMode) {
            return NextResponse.json({
                success: false,
                error: { code: 'MISSING_MODE', message: 'Transformation mode is required' }
            }, { status: 400 });
        }

        if (typeof styleStrength !== 'number' || styleStrength < 0 || styleStrength > 100) {
            return NextResponse.json({
                success: false,
                error: { code: 'INVALID_STRENGTH', message: 'Style strength must be between 0 and 100' }
            }, { status: 400 });
        }

        // Get API key
        const apiKey = userApiKey || process.env.STABILITY_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'NO_API_KEY',
                    message: 'Stability AI API key not configured. Please add your API key in settings.'
                }
            }, { status: 400 });
        }

        // Extract base64 data from data URL
        let imageBase64: string;
        let mimeType: string;

        if (sourceImage.startsWith('data:')) {
            const matches = sourceImage.match(/^data:([^;]+);base64,(.+)$/);
            if (!matches) {
                return NextResponse.json({
                    success: false,
                    error: { code: 'INVALID_IMAGE_FORMAT', message: 'Invalid image data URL format' }
                }, { status: 400 });
            }
            mimeType = matches[1];
            imageBase64 = matches[2];
        } else {
            // Assume raw base64
            imageBase64 = sourceImage;
            mimeType = 'image/png';
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(imageBase64, 'base64');

        // Generate prompt
        const prompt = generateImg2ImgPrompt(transformationMode, brandTheme, preserveOptions);
        const negativePrompt = generateNegativePrompt(transformationMode);

        // CRITICAL: Map style strength (0-100) to image_strength (0.0-1.0, INVERTED)
        // Stability AI image_strength: lower = MORE change, higher = LESS change
        // styleStrength 99% → image_strength 0.01 (maximum style change)
        // styleStrength 50% → image_strength 0.50 (balanced)
        // styleStrength 1%  → image_strength 0.99 (minimal change)
        const imageStrength = Math.max(0.01, Math.min(0.99, 1 - (styleStrength / 100)));

        // Get dynamic cfg_scale and steps based on mode
        const cfgScale = getCfgScale(transformationMode);
        const steps = getSteps(transformationMode);

        // Detailed debug logging
        console.log('='.repeat(60));
        console.log('[Img2Img] API Request Debug Info:');
        console.log('='.repeat(60));
        console.log(`  Mode: ${transformationMode}`);
        console.log(`  Brand Theme: ${brandTheme}`);
        console.log(`  Style Strength: ${styleStrength}%`);
        console.log(`  → image_strength: ${imageStrength.toFixed(3)} (lower = MORE change)`);
        console.log(`  → cfg_scale: ${cfgScale} (higher = more prompt influence)`);
        console.log(`  → steps: ${steps}`);
        console.log(`  Preserve Options: ${JSON.stringify(preserveOptions)}`);
        console.log(`  Image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
        console.log(`  Prompt (${prompt.length} chars):`);
        console.log(`    "${prompt}"`);
        console.log(`  Negative: "${negativePrompt}"`);
        console.log('='.repeat(60));

        // Create the form data
        const formData = new FormData();

        // Append the image as a blob
        const blob = new Blob([imageBuffer], { type: mimeType });
        formData.append('init_image', blob, 'image.png');
        formData.append('init_image_mode', 'IMAGE_STRENGTH');
        formData.append('image_strength', imageStrength.toFixed(3));
        formData.append('text_prompts[0][text]', prompt);
        formData.append('text_prompts[0][weight]', '1');
        formData.append('text_prompts[1][text]', negativePrompt);
        formData.append('text_prompts[1][weight]', '-1');
        formData.append('cfg_scale', cfgScale.toString());
        formData.append('samples', '1');
        formData.append('steps', steps.toString());

        // Call Stability AI API with extended timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        console.log('[Img2Img] Sending request to Stability AI...');
        const startTime = Date.now();

        const response = await fetch(STABILITY_IMG2IMG_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
            },
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = response.statusText;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.name || errorText;
            } catch {
                errorMessage = errorText || response.statusText;
            }

            console.error(`[Img2Img] API Error (${response.status}) after ${elapsed}ms:`, errorMessage);

            return NextResponse.json({
                success: false,
                error: {
                    code: 'API_ERROR',
                    message: `Stability AI error (${response.status}): ${errorMessage}`
                }
            }, { status: response.status >= 400 && response.status < 500 ? 400 : 500 });
        }

        // Parse response
        const responseData = await response.json();

        if (!responseData.artifacts || responseData.artifacts.length === 0) {
            console.error('[Img2Img] No artifacts in response');
            return NextResponse.json({
                success: false,
                error: {
                    code: 'NO_IMAGE_GENERATED',
                    message: 'No image was generated by the API'
                }
            }, { status: 500 });
        }

        // Get the generated image
        const generatedImage = responseData.artifacts[0];
        const resultBase64 = `data:image/png;base64,${generatedImage.base64}`;

        console.log(`[Img2Img] Success in ${elapsed}ms - finish_reason: ${generatedImage.finishReason}`);

        return NextResponse.json({
            success: true,
            styledImage: resultBase64,
            prompt: prompt,
            metadata: {
                transformationMode,
                styleStrength,
                brandTheme,
                preserveOptions,
                imageStrength: imageStrength.toFixed(3),
                cfgScale,
                steps,
                finishReason: generatedImage.finishReason,
                processingTimeMs: elapsed
            }
        });

    } catch (error) {
        console.error('[Img2Img] Error:', error);

        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'TIMEOUT',
                    message: 'Image generation timed out. Please try again.'
                }
            }, { status: 408 });
        }

        return NextResponse.json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            }
        }, { status: 500 });
    }
}
