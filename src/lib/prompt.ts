// Structured Prompt Architecture - Canvas Prompt Engineering System
// Based on PRD: Predictable output through structured templates and provider optimization

import { ImageProvider } from './providers/types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

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

export type BrandTheme = 'funnelists' | 'salesforce' | 'general_ai' | 'blockchain' | 'neutral' | 'minimal' | 'photorealistic';

// =============================================================================
// PROMPT TEMPLATE INTERFACES
// =============================================================================

interface PromptParts {
    style: string;
    composition: string;
    subject: string;
    details: string;
    brand: BrandThemeDefinition;
    technical: string;
    negative: string[];
}

interface AssetTypeTemplate {
    style: string;
    composition: string;
    technical: string;
    negatives: string[];
}

interface BrandThemeDefinition {
    name: string;
    colors: {
        primary: string[];
        secondary: string[];
        accent: string[];
        forbidden: string[];
        background: string;
    };
    styleKeywords: string[];
    mood: string[];
    visualStyle: string;
    avoidKeywords: string[];
}

export interface GenerateImageParams {
    usage: ImageUsage;
    dimension: ImageDimension;
    subject: string;
    additionalDetails?: string;
    mood?: Mood;
    style_variant?: StyleVariant;
    asset_type?: AssetType;
    brand_theme?: BrandTheme;
    is_asset_set?: boolean;
    provider?: ImageProvider;
}

export interface StructuredPromptResult {
    prompt: string;
    negativePrompt: string;
}

// =============================================================================
// UNIVERSAL NEGATIVE PROMPTS
// =============================================================================

const UNIVERSAL_NEGATIVES = [
    "text", "words", "letters", "numbers", "watermark",
    "signature", "logo", "label", "caption", "title",
    "blurry", "low quality", "pixelated", "distorted",
    "cropped", "out of frame", "duplicate"
];

// =============================================================================
// ASSET TYPE TEMPLATES
// =============================================================================

const ASSET_TYPE_TEMPLATES: Record<string, AssetTypeTemplate> = {
    diagram: {
        style: "Clean technical illustration, isometric 3D, vector-style graphics, flat design elements, infographic style",
        composition: "Centered layout, balanced symmetry, clear visual hierarchy, organized sections without text labels",
        technical: "Sharp edges, crisp lines, high contrast, professional presentation graphic, clean geometric shapes",
        negatives: ["photorealism", "people", "faces", "busy backgrounds", "organic textures", "hand-drawn elements"]
    },
    hero_image: {
        style: "Cinematic, atmospheric, dramatic lighting, professional photography style, stylized illustration",
        composition: "Wide aspect ratio, subject positioned for text overlay space, depth of field, rule of thirds",
        technical: "High resolution, 4K quality, suitable for web hero section, wide cinematic view",
        negatives: ["cluttered composition", "multiple focal points", "small details", "busy patterns"]
    },
    icon_set: {
        style: "Minimal, symbolic, clean iconography, single concept, flat design",
        composition: "Centered single element, simple background, clear silhouette, generous padding",
        technical: "Works at small sizes, high contrast, recognizable at 64px, bold shapes",
        negatives: ["fine detail", "realism", "background elements", "gradients", "complex shapes", "3D effects"]
    },
    infographic: {
        style: "Bold, eye-catching, scroll-stopping, data visualization style",
        composition: "Strong focal point, readable at small size, brand-consistent, clear sections",
        technical: "Platform-specific dimensions, high saturation, strong contrast, clean layout",
        negatives: ["fine details that get lost", "subtle colors", "complex patterns", "photorealism"]
    },
    process_flow: {
        style: "Flowchart visualization, connected nodes, step-by-step visual, clean technical",
        composition: "Left-to-right or top-to-bottom flow, connected elements, clear progression",
        technical: "Clean lines, distinct stages, professional diagram, logical flow",
        negatives: ["organic shapes", "photorealism", "people", "complex backgrounds"]
    },
    comparison: {
        style: "Side-by-side visualization, comparative layout, balanced presentation",
        composition: "Symmetrical split, clear distinction between sides, balanced visual weight",
        technical: "High contrast between options, clear differentiation, professional layout",
        negatives: ["merged elements", "confusing overlap", "unclear boundaries"]
    },
    timeline: {
        style: "Chronological visualization, milestone markers, progressive flow",
        composition: "Linear progression, clear time markers, connected events",
        technical: "Clean connecting lines, distinct markers, readable at scale",
        negatives: ["circular layouts", "complex branching", "dense clustering"]
    },
    stats_highlight: {
        style: "Data visualization, metric-focused, impactful numbers visualization",
        composition: "Central metric focus, supporting visual elements, clean emphasis",
        technical: "Bold visual impact, clear data representation, professional charts",
        negatives: ["complex backgrounds", "distracting elements", "low contrast"]
    },
    quote_card: {
        style: "Elegant, sophisticated, text-friendly background, subtle visual",
        composition: "Large negative space for text overlay, subtle visual interest, balanced",
        technical: "Muted colors, soft focus areas, professional backdrop",
        negatives: ["busy patterns", "high contrast areas", "multiple focal points"]
    },
    checklist: {
        style: "Organized list visualization, checkbox aesthetic, structured layout",
        composition: "Vertical stacking, aligned elements, clear item separation",
        technical: "Clean organization, professional structure, clear visual markers",
        negatives: ["overlapping elements", "complex backgrounds", "distracting details"]
    }
};

// Default template for unknown asset types
const DEFAULT_ASSET_TEMPLATE: AssetTypeTemplate = ASSET_TYPE_TEMPLATES.hero_image;

// =============================================================================
// BRAND THEME DEFINITIONS
// =============================================================================

const BRAND_THEMES: Record<BrandTheme, BrandThemeDefinition> = {
    funnelists: {
        name: "Funnelists",
        colors: {
            primary: ["cyan #0ea5e9", "teal #14b8a6", "blue #3b82f6"],
            secondary: ["emerald green #10b981", "green accent lights"],
            accent: ["subtle purple highlights acceptable"],
            forbidden: ["no red", "no orange", "no yellow", "no pink", "no warm colors"],
            background: "dark black background, navy #0a0a0f, deep space black"
        },
        styleKeywords: [
            "futuristic tech aesthetic",
            "glowing neon lines",
            "circuit board patterns",
            "holographic elements",
            "isometric 3D platforms",
            "floating in dark space",
            "cyberpunk data visualization",
            "enterprise AI aesthetic"
        ],
        mood: ["innovative", "professional", "enterprise-grade", "cutting-edge AI", "powerful"],
        visualStyle: "isometric 3D tech illustration with glowing elements on dark background",
        avoidKeywords: ["cartoon", "hand-drawn", "vintage", "retro", "watercolor", "sketchy", "warm colors", "friendly", "playful"]
    },
    salesforce: {
        name: "Salesforce",
        colors: {
            primary: ["Salesforce blue #00A1E0", "cloud blue", "sky blue #1798c1"],
            secondary: ["white", "light gray #f3f3f3"],
            accent: ["orange #FF6D00 sparingly", "green #2e844a for success"],
            forbidden: ["no dark themes", "no neon", "no purple", "no black backgrounds", "no cyberpunk"],
            background: "white or light blue gradient background, clean bright backdrop"
        },
        styleKeywords: [
            "friendly and approachable",
            "clean corporate illustration",
            "cloud iconography",
            "connected systems",
            "customer-centric imagery",
            "diverse people illustrations",
            "Salesforce Astro style",
            "modern SaaS aesthetic"
        ],
        mood: ["trustworthy", "friendly", "innovative", "connected", "customer-focused", "approachable"],
        visualStyle: "clean modern corporate illustration, Salesforce marketing style, bright and optimistic",
        avoidKeywords: ["dark", "gritty", "cyberpunk", "neon", "futuristic dystopia", "scary", "complex", "technical"]
    },
    general_ai: {
        name: "General AI",
        colors: {
            primary: ["electric blue #0077be", "deep blue #1e3a5f"],
            secondary: ["cyan #0ea5e9", "white highlights"],
            accent: ["purple #8b5cf6", "magenta glow"],
            forbidden: ["no orange", "no yellow", "no warm earth tones"],
            background: "dark gradient background, deep blue to black"
        },
        styleKeywords: [
            "neural network visualization",
            "AI brain patterns",
            "machine learning aesthetic",
            "data streams",
            "algorithmic patterns",
            "digital synapses",
            "abstract AI core"
        ],
        mood: ["intelligent", "advanced", "sophisticated", "cutting-edge", "powerful"],
        visualStyle: "abstract AI visualization with neural network patterns and data flows",
        avoidKeywords: ["cartoon", "childish", "simple", "hand-drawn", "organic"]
    },
    blockchain: {
        name: "Blockchain",
        colors: {
            primary: ["gold #F7931A", "amber #FFA500", "orange-gold"],
            secondary: ["deep blue #1a1a2e", "purple #6B5B95"],
            accent: ["white highlights", "silver metallic"],
            forbidden: ["no pink", "no pastel colors", "no bright green"],
            background: "dark blue or black background with metallic accents"
        },
        styleKeywords: [
            "interconnected nodes",
            "distributed ledger chains",
            "cryptographic patterns",
            "decentralized network",
            "hash chain visualization",
            "digital currency aesthetic",
            "secure transaction flow"
        ],
        mood: ["secure", "decentralized", "transparent", "immutable", "trustless"],
        visualStyle: "interconnected blockchain nodes and distributed ledger visualization",
        avoidKeywords: ["centralized", "single point", "organic", "soft", "rounded"]
    },
    neutral: {
        name: "Neutral",
        colors: {
            primary: ["slate gray #64748b", "neutral gray #6b7280", "charcoal #374151"],
            secondary: ["light gray #e5e7eb", "silver #9ca3af"],
            accent: ["subtle blue #3b82f6 sparingly"],
            forbidden: ["no bright neon", "no saturated colors"],
            background: "neutral gray or off-white background"
        },
        styleKeywords: [
            "professional and clean",
            "corporate neutral",
            "balanced composition",
            "understated elegance",
            "versatile imagery"
        ],
        mood: ["professional", "balanced", "versatile", "understated"],
        visualStyle: "clean professional imagery with neutral color palette",
        avoidKeywords: ["flashy", "neon", "extreme", "dramatic", "bold colors"]
    },
    minimal: {
        name: "Minimal",
        colors: {
            primary: ["white #ffffff", "off-white #fafafa"],
            secondary: ["light gray #e5e7eb", "subtle gray #f3f4f6"],
            accent: ["single accent color sparingly", "black #000000 for contrast"],
            forbidden: ["no multiple bright colors", "no gradients", "no complex patterns"],
            background: "pure white or very light neutral background"
        },
        styleKeywords: [
            "minimal design",
            "generous negative space",
            "single focal point",
            "clean lines",
            "elegant simplicity",
            "modern minimalist"
        ],
        mood: ["calm", "sophisticated", "elegant", "refined", "peaceful"],
        visualStyle: "minimal clean design with generous white space",
        avoidKeywords: ["complex", "busy", "cluttered", "colorful", "detailed", "ornate", "cyberpunk", "neon"]
    },
    photorealistic: {
        name: "Photorealistic",
        colors: {
            primary: ["natural colors", "realistic tones"],
            secondary: ["environmental colors", "natural lighting"],
            accent: ["natural accent colors"],
            forbidden: ["no neon colors", "no unrealistic saturation"],
            background: "natural environment or studio backdrop"
        },
        styleKeywords: [
            "photorealistic",
            "natural photography",
            "real-world setting",
            "authentic lighting",
            "professional photography",
            "natural environment"
        ],
        mood: ["authentic", "realistic", "natural", "genuine", "relatable"],
        visualStyle: "photorealistic professional photography with natural lighting",
        avoidKeywords: ["illustration", "cartoon", "stylized", "abstract", "neon", "cyberpunk", "digital art"]
    }
};

// Legacy theme mapping for backwards compatibility
const LEGACY_THEME_MAP: Record<string, BrandTheme> = {
    'salesforce': 'salesforce',
    'general_ai': 'general_ai',
    'blockchain': 'blockchain',
    'neutral': 'neutral',
    'minimal': 'minimal',
    'photorealistic': 'photorealistic'
};

// =============================================================================
// COMPOSITION INSTRUCTIONS
// =============================================================================

const HERO_WIDE_COMPOSITION = "ultra-wide cinematic composition with key elements centered in the middle third of the image, leaving negative space on left and right sides suitable for dark fade effects";

const ASSET_SET_COMPOSITION = "composition with all key elements concentrated in the center of the image, leaving generous margins on all sides to allow for cropping to various aspect ratios including square, 4:3, and 21:9 without losing important content";

// =============================================================================
// PROVIDER-SPECIFIC FORMATTERS
// =============================================================================

/**
 * Format prompt for DALL-E 3 - uses natural language paragraphs
 */
function formatForDalle(parts: PromptParts): StructuredPromptResult {
    const brand = parts.brand;

    const prompt = `Create a ${parts.style} image showing ${parts.subject}.

The image should have ${parts.composition}.

${parts.details ? `Include these elements: ${parts.details}.` : ''}

Color palette: Use ${brand.colors.primary.join(", ")} as the primary colors. ${brand.colors.secondary.length > 0 ? `Accent with ${brand.colors.secondary.join(", ")}.` : ''} The background should be ${brand.colors.background}.

Visual style: ${brand.visualStyle}. Keywords: ${brand.styleKeywords.slice(0, 5).join(", ")}.

Mood: ${brand.mood.join(", ")}.

Technical quality: ${parts.technical}. Masterpiece quality, highly detailed.

CRITICAL REQUIREMENTS:
- ${brand.colors.forbidden.join(". ")}
- Do NOT include any text, words, letters, numbers, or watermarks in the image
- ${parts.negative.slice(0, 5).join(", ")}
- ${brand.avoidKeywords.slice(0, 5).join(", ")}`;

    // DALL-E 3 doesn't use separate negative prompts, so we include them in main prompt
    return {
        prompt: prompt.trim(),
        negativePrompt: ""
    };
}

/**
 * Format prompt for Stability AI - uses comma-separated keywords with negative prompt parameter
 */
function formatForStability(parts: PromptParts): StructuredPromptResult {
    const brand = parts.brand;

    // Build positive prompt with comma-separated keywords (subject first for priority)
    const positiveElements = [
        parts.subject, // Subject gets highest priority by being first
        parts.style,
        parts.composition,
        parts.details,
        ...brand.styleKeywords,
        ...brand.colors.primary,
        brand.colors.background,
        parts.technical,
        ...brand.mood,
        "masterpiece", "best quality", "highly detailed", "professional"
    ].filter(Boolean);

    const positive = positiveElements.join(", ");

    // Build negative prompt with forbidden elements
    const negativeElements = [
        "text", "words", "letters", "watermark", "signature", "logo",
        ...brand.colors.forbidden.map(f => f.replace('no ', '')),
        ...brand.avoidKeywords,
        ...parts.negative,
        "blurry", "low quality", "distorted", "amateur", "poorly drawn"
    ];

    const negative = [...new Set(negativeElements)].join(", ");

    return {
        prompt: positive,
        negativePrompt: negative
    };
}

/**
 * Format prompt for Replicate/Flux - similar to Stability but with some adjustments
 */
function formatForReplicate(parts: PromptParts): StructuredPromptResult {
    // Flux/Replicate works well with Stability-style formatting
    return formatForStability(parts);
}

// =============================================================================
// MAIN PROMPT GENERATION FUNCTIONS
// =============================================================================

/**
 * Get asset type template, with fallback to default
 */
function getAssetTypeTemplate(assetType?: AssetType): AssetTypeTemplate {
    if (!assetType) return DEFAULT_ASSET_TEMPLATE;

    // Map common asset types to our templates
    const mapping: Record<string, keyof typeof ASSET_TYPE_TEMPLATES> = {
        'hero_image': 'hero_image',
        'infographic': 'infographic',
        'process_flow': 'process_flow',
        'comparison': 'comparison',
        'checklist': 'checklist',
        'timeline': 'timeline',
        'diagram': 'diagram',
        'quote_card': 'quote_card',
        'stats_highlight': 'stats_highlight',
        'icon_set': 'icon_set'
    };

    const templateKey = mapping[assetType];
    return templateKey ? ASSET_TYPE_TEMPLATES[templateKey] : DEFAULT_ASSET_TEMPLATE;
}

/**
 * Get brand theme definition, with legacy mapping support
 */
function getBrandTheme(brandTheme?: BrandTheme | string): BrandThemeDefinition {
    if (!brandTheme) return BRAND_THEMES.funnelists;

    // Check for legacy theme name
    const legacyMapped = LEGACY_THEME_MAP[brandTheme];
    if (legacyMapped) {
        return BRAND_THEMES[legacyMapped];
    }

    // Direct lookup
    if (brandTheme in BRAND_THEMES) {
        return BRAND_THEMES[brandTheme as BrandTheme];
    }

    // Default to funnelists
    return BRAND_THEMES.funnelists;
}

/**
 * Build structured prompt parts with subject priority weighting
 * Subject: 40%, Style/Asset: 25%, Brand: 20%, Details: 15%
 */
function buildPromptParts(params: GenerateImageParams): PromptParts {
    const { subject, additionalDetails, asset_type, brand_theme, dimension, is_asset_set } = params;

    const assetTemplate = getAssetTypeTemplate(asset_type);
    const brand = getBrandTheme(brand_theme);

    // Determine composition based on dimension or asset set mode
    let composition = assetTemplate.composition;
    if (is_asset_set) {
        composition = `${ASSET_SET_COMPOSITION}. ${assetTemplate.composition}`;
    } else if (dimension === 'hero_wide') {
        composition = `${HERO_WIDE_COMPOSITION}. ${assetTemplate.composition}`;
    }

    // Combine negatives from universal, asset type, and brand
    const negatives = [
        ...UNIVERSAL_NEGATIVES,
        ...assetTemplate.negatives,
        ...brand.colors.forbidden.map(f => f.replace('no ', '')),
        ...brand.avoidKeywords
    ];

    return {
        style: assetTemplate.style,
        composition,
        subject, // Subject is the PRIMARY driver
        details: additionalDetails || '',
        brand,
        technical: assetTemplate.technical,
        negative: [...new Set(negatives)] // Deduplicate
    };
}

/**
 * Generate structured prompt with provider-specific formatting
 */
export function generateStructuredPrompt(params: GenerateImageParams): StructuredPromptResult {
    const parts = buildPromptParts(params);
    const provider = params.provider || 'stability';

    switch (provider) {
        case 'openai':
            return formatForDalle(parts);
        case 'stability':
            return formatForStability(parts);
        case 'replicate':
            return formatForReplicate(parts);
        default:
            return formatForStability(parts);
    }
}

/**
 * Main prompt generation function - backwards compatible
 * Returns a single prompt string (negative prompt handled separately for Stability)
 */
export function generatePrompt(params: GenerateImageParams): string {
    const { brand_theme } = params;

    // For minimal and photorealistic, use simplified prompts
    if (brand_theme === 'minimal' || brand_theme === 'photorealistic') {
        return generateSimplifiedPrompt(params);
    }

    // Use new structured prompt system
    const result = generateStructuredPrompt(params);
    return result.prompt;
}

/**
 * Get negative prompt for a generation request (for Stability AI)
 */
export function getNegativePrompt(params: GenerateImageParams): string {
    const result = generateStructuredPrompt(params);
    return result.negativePrompt;
}

/**
 * Generate simplified prompts for minimal and photorealistic themes
 */
function generateSimplifiedPrompt(params: GenerateImageParams): string {
    const { subject, additionalDetails, brand_theme, dimension, is_asset_set } = params;

    const details = additionalDetails?.trim() ? ` ${additionalDetails.trim()}` : '';

    let compositionInstruction = '';
    if (is_asset_set) {
        compositionInstruction = ` ${ASSET_SET_COMPOSITION}`;
    } else if (dimension === 'hero_wide') {
        compositionInstruction = ` ${HERO_WIDE_COMPOSITION}`;
    }

    if (brand_theme === 'photorealistic') {
        return `Single image of ${subject}.${details}${compositionInstruction}

Photorealistic photograph. Natural setting. Professional photography lighting. Golden hour or studio lighting.

8K resolution, sharp focus, shallow depth of field, professional quality.

No text, no words, no letters, no watermarks, no collage, no grid, no multiple images, no illustration, no cartoon.`;
    }

    // Minimal theme
    return `A minimal, clean visualization of ${subject}.${details}${compositionInstruction}

Simple, elegant composition with generous negative space. Abstract geometric shapes or subtle gradients to represent the concept. Single focal point.

Color palette: sophisticated and restrained. Neutral tones, muted colors. Clean white or light gray background.

Style: modern minimalist design, clean lines, professional and sophisticated. No complex machinery, no holograms, no data grids, no neon colors, no cyberpunk elements.

8K quality, crisp, polished.

No text, no words, no letters, no watermarks, no busy patterns, no multiple colors.`;
}

// =============================================================================
// UTILITY EXPORTS FOR TESTING AND DEBUGGING
// =============================================================================

export { BRAND_THEMES, ASSET_TYPE_TEMPLATES, UNIVERSAL_NEGATIVES };
export type { BrandThemeDefinition, AssetTypeTemplate, PromptParts };
