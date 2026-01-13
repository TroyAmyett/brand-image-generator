// Master template prompt generation - brand consistency first

export type ImageUsage =
    | 'Hero Background' | 'Product/Service Card Image' | 'Icon' | 'Blog Main Image' | 'Social Media Post' | 'Other'
    | 'hero_background' | 'blog_hero' | 'service_hero' | 'card_thumbnail' | 'og_image'
    | 'email_header' | 'presentation' | 'icon_illustration' | 'case_study' | 'team_background';

export type ImageDimension =
    | 'Full screen (16:9)' | 'Square (1:1)' | 'Rectangle (4:3)' | 'Vertical (9:16)'
    | '16:9' | '16:9_blog' | 'og_image' | 'square' | 'card' | 'portrait' | 'wide_banner' | 'icon'
    | 'hero_wide' | 'card_4x3' | 'card_3x2' | 'master';

export type StyleVariant =
    | 'clean_tech' | 'abstract_tech' | 'geometric' | 'gradient_mesh' | 'isometric' | 'particle_flow'
    | 'neural_network' | 'dashboard' | 'connection' | 'funnel' | 'minimal';

export type Mood = 'innovative' | 'professional' | 'energetic' | 'trustworthy' | 'futuristic';

export type AssetType =
    | 'hero_image' | 'infographic' | 'process_flow' | 'comparison' | 'checklist'
    | 'timeline' | 'diagram' | 'quote_card' | 'stats_highlight' | 'icon_set';

export type BrandTheme = 'salesforce' | 'general_ai' | 'blockchain' | 'neutral' | 'minimal' | 'photorealistic';

export interface GenerateImageParams {
    usage: ImageUsage;
    dimension: ImageDimension;
    subject: string;
    additionalDetails?: string;
    mood?: Mood;
    style_variant?: StyleVariant;
    asset_type?: AssetType;
    brand_theme?: BrandTheme;
    is_asset_set?: boolean; // When true, generates master optimized for cropping
}

// Brand theme anchor text (for tech themes)
const BRAND_THEME_ANCHORS: Record<BrandTheme, string> = {
    salesforce: "with a glowing Salesforce-style cloud icon as the central anchoring element",
    general_ai: "with an abstract glowing AI core as the central element",
    blockchain: "with interconnected blockchain nodes and distributed ledger chains as the central anchoring element",
    neutral: "",
    minimal: "",
    photorealistic: ""
};

// Themes that use simplified non-tech templates
const SIMPLIFIED_THEMES: BrandTheme[] = ['minimal', 'photorealistic'];

// Negative prompt - for tech/cyberpunk themes
const NEGATIVE_PROMPT_TECH = "no people, no faces, no robots, no humanoids, no text, no words, no letters, no blurry elements, no low resolution, no distortion, no noise, no clutter, no cartoon style, no flat illustration, no watermark, no brains, no abstract blobs";

// Negative prompt - for photorealistic/minimal themes (simpler, no tech assumptions)
const NEGATIVE_PROMPT_CLEAN = "no text, no words, no letters, no watermarks, no blurry elements, no low resolution, no distortion";

// Generate a subject-specific focal point description
function generateFocalPoint(subject: string): string {
    const subjectLower = subject.toLowerCase();

    // Generate contextual focal point based on subject keywords
    if (/agent|development|approach|build/i.test(subjectLower)) {
        return `A central glowing AI development pipeline showing stages from concept to deployment, with agent nodes being constructed and activated. The ${subject} is visualized as an evolving system of interconnected components.`;
    }
    if (/automation|workflow|process/i.test(subjectLower)) {
        return `A flowing automated pipeline where data streams through processing stages. The ${subject} is represented as a seamless flow of glowing data packets moving through connected nodes.`;
    }
    if (/integration|connect|api/i.test(subjectLower)) {
        return `Multiple systems connected by glowing data bridges and API pathways. The ${subject} shows distinct platforms linked by streaming data connections.`;
    }
    if (/analytics|dashboard|metrics|report/i.test(subjectLower)) {
        return `A central holographic display showing real-time data visualizations, charts, and KPI metrics. The ${subject} is presented through floating analytical interfaces.`;
    }
    if (/cloud|data|storage/i.test(subjectLower)) {
        return `A massive cloud infrastructure visualization with data flowing between storage nodes. The ${subject} appears as interconnected cloud systems with glowing data streams.`;
    }
    if (/security|protect|shield/i.test(subjectLower)) {
        return `A protective digital shield surrounding core systems with security layers visible. The ${subject} is visualized as layered defense mechanisms with scanning elements.`;
    }
    if (/sales|lead|crm|customer/i.test(subjectLower)) {
        return `A sales pipeline funnel with leads flowing through qualification stages. The ${subject} shows prospect data transforming as it moves through the conversion process.`;
    }
    if (/support|service|help/i.test(subjectLower)) {
        return `A service hub with multiple support channels connecting to a central resolution center. The ${subject} displays ticket flows and resolution pathways.`;
    }

    // Default: create a subject-specific focal point
    return `A central visualization representing ${subject}, with glowing elements that embody the core concept. The main focus shows the essence of ${subject} through interconnected technological components.`;
}

// Hero wide composition instruction for 21:9 crops
const HERO_WIDE_COMPOSITION = `ultra-wide cinematic composition with key elements centered in the middle third of the image, leaving negative space on left and right sides suitable for dark fade effects`;

// Asset set composition instruction - optimized for center-cropping to multiple ratios
const ASSET_SET_COMPOSITION = `composition with all key elements concentrated in the center of the image, leaving generous margins on all sides to allow for cropping to various aspect ratios including square, 4:3, and 21:9 without losing important content`;

export function generatePrompt(params: GenerateImageParams): string {
    const { subject, additionalDetails, brand_theme = 'salesforce', dimension, is_asset_set } = params;

    // Add composition instructions based on dimension or asset set mode
    let compositionInstruction = '';
    if (is_asset_set) {
        compositionInstruction = ` ${ASSET_SET_COMPOSITION}`;
    } else if (dimension === 'hero_wide') {
        compositionInstruction = ` ${HERO_WIDE_COMPOSITION}`;
    }

    // Use simplified templates for minimal/photorealistic themes
    if (SIMPLIFIED_THEMES.includes(brand_theme)) {
        return generateSimplifiedPrompt(params, compositionInstruction);
    }

    // Build focal point: use additional details if provided, otherwise generate from subject
    const focalPointDescription = additionalDetails && additionalDetails.trim()
        ? additionalDetails.trim()
        : generateFocalPoint(subject);

    // Get brand theme anchor text
    const themeAnchor = BRAND_THEME_ANCHORS[brand_theme];
    const themeText = themeAnchor ? ` ${themeAnchor}` : '';

    // Master template - SUBJECT, FOCAL_POINT_DESCRIPTION, and THEME_ANCHOR change
    const prompt = `A futuristic AI ${subject}${themeText} visualized as a high-tech cyberpunk data environment.${compositionInstruction} ${focalPointDescription}

Surrounding elements include advanced holographic dashboards, digital control panels displaying analytics and system metrics. Neon circuitry lines run across surfaces like a motherboard, connecting all elements.

Futuristic server structures and glowing tech icons in the background. Floating UI elements, data nodes, and soft glowing orbs distributed throughout.

Color palette: PRIMARY color: deep electric blue (#0077be) and cyan (#0ea5e9) for main elements, glows, and lighting. SECONDARY accent: vibrant green (#22c55e) used sparingly for highlights, small details, and accent points only. DO NOT blend blue and green into teal. Keep colors distinctly separate. Subtle purple highlights for depth, metallic gold and chrome materials. Ultra-clean, glossy surfaces with reflective highlights.

Lighting: dramatic and cinematic, strong neon glow, volumetric light beams, rim lighting, soft bloom, high contrast against dark background.

Style: ultra-detailed 3D render, sci-fi cyberpunk, enterprise AI visualization, holographic interfaces, cinematic lighting. Composition: wide-angle, centered, symmetrical. Mood: powerful, intelligent, cutting-edge innovation.

Hyper-realistic, extremely high detail, crisp focus, 8K resolution, professional concept art, clean and polished.

${NEGATIVE_PROMPT_TECH}`;

    return prompt;
}

/**
 * Generate simplified prompts for minimal and photorealistic themes
 * These avoid cyberpunk/tech visualization elements completely
 */
function generateSimplifiedPrompt(params: GenerateImageParams, compositionInstruction: string): string {
    const { subject, additionalDetails, brand_theme } = params;

    const details = additionalDetails && additionalDetails.trim()
        ? ` ${additionalDetails.trim()}`
        : '';

    if (brand_theme === 'photorealistic') {
        // Photorealistic: pure real-world photography style
        return `Single image of ${subject}.${details}${compositionInstruction}

Photorealistic photograph. Natural outdoor setting. Golden hour lighting.

8K, sharp focus, shallow depth of field.

${NEGATIVE_PROMPT_CLEAN}, no collage, no grid, no multiple images`;
    }

    // Minimal: clean abstract/conceptual style
    return `A minimal, clean visualization of ${subject}.${details}${compositionInstruction}

Simple, elegant composition with generous negative space. Abstract geometric shapes or subtle gradients to represent the concept. No complex machinery, no holograms, no data grids, no neon colors, no cyberpunk elements.

Color palette: sophisticated and restrained. Neutral tones, muted colors. Clean white or dark backgrounds.

Style: modern minimalist design, clean lines, professional and sophisticated.

8K quality, crisp, polished.

${NEGATIVE_PROMPT_CLEAN}`;
}
