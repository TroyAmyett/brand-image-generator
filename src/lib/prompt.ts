// Master template prompt generation - brand consistency first

export type ImageUsage =
    | 'Hero Background' | 'Product/Service Card Image' | 'Icon' | 'Blog Main Image' | 'Social Media Post' | 'Other'
    | 'hero_background' | 'blog_hero' | 'service_hero' | 'card_thumbnail' | 'og_image'
    | 'email_header' | 'presentation' | 'icon_illustration' | 'case_study' | 'team_background';

export type ImageDimension =
    | 'Full screen (16:9)' | 'Square (1:1)' | 'Rectangle (4:3)' | 'Vertical (9:16)'
    | '16:9' | '16:9_blog' | 'og_image' | 'square' | 'card' | 'portrait' | 'wide_banner' | 'icon';

export type StyleVariant =
    | 'clean_tech' | 'abstract_tech' | 'geometric' | 'gradient_mesh' | 'isometric' | 'particle_flow'
    | 'neural_network' | 'dashboard' | 'connection' | 'funnel' | 'minimal';

export type Mood = 'innovative' | 'professional' | 'energetic' | 'trustworthy' | 'futuristic';

export type AssetType =
    | 'hero_image' | 'infographic' | 'process_flow' | 'comparison' | 'checklist'
    | 'timeline' | 'diagram' | 'quote_card' | 'stats_highlight' | 'icon_set';

export interface GenerateImageParams {
    usage: ImageUsage;
    dimension: ImageDimension;
    subject: string;
    additionalDetails?: string;
    mood?: Mood;
    style_variant?: StyleVariant;
    asset_type?: AssetType;
}

// Negative prompt - constant for all generations
const NEGATIVE_PROMPT = "no people, no faces, no robots, no humanoids, no text, no words, no letters, no blurry elements, no low resolution, no distortion, no noise, no clutter, no cartoon style, no flat illustration, no watermark, no brains, no abstract blobs";

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

export function generatePrompt(params: GenerateImageParams): string {
    const { subject, additionalDetails } = params;

    // Build focal point: use additional details if provided, otherwise generate from subject
    const focalPointDescription = additionalDetails && additionalDetails.trim()
        ? additionalDetails.trim()
        : generateFocalPoint(subject);

    // Master template - only SUBJECT and FOCAL_POINT_DESCRIPTION change
    const prompt = `A futuristic AI ${subject} visualized as a high-tech cyberpunk data environment. ${focalPointDescription}

Surrounding elements include advanced holographic dashboards, digital control panels displaying analytics and system metrics. Neon circuitry lines run across surfaces like a motherboard, connecting all elements.

Futuristic server structures and glowing tech icons in the background. Floating UI elements, data nodes, and soft glowing orbs distributed throughout.

Color palette: PRIMARY color: deep electric blue (#0077be) and cyan (#0ea5e9) for main elements, glows, and lighting. SECONDARY accent: vibrant green (#22c55e) used sparingly for highlights, small details, and accent points only. DO NOT blend blue and green into teal. Keep colors distinctly separate. Subtle purple highlights for depth, metallic gold and chrome materials. Ultra-clean, glossy surfaces with reflective highlights.

Lighting: dramatic and cinematic, strong neon glow, volumetric light beams, rim lighting, soft bloom, high contrast against dark background.

Style: ultra-detailed 3D render, sci-fi cyberpunk, enterprise AI visualization, holographic interfaces, cinematic lighting. Composition: wide-angle, centered, symmetrical. Mood: powerful, intelligent, cutting-edge innovation.

Hyper-realistic, extremely high detail, crisp focus, 8K resolution, professional concept art, clean and polished.

${NEGATIVE_PROMPT}`;

    return prompt;
}
