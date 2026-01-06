// Prompt generation following the API spec template structure

export type ImageUsage =
    | 'Hero Background' | 'Product/Service Card Image' | 'Icon' | 'Blog Main Image' | 'Social Media Post' | 'Other'
    | 'hero_background' | 'blog_hero' | 'service_hero' | 'card_thumbnail' | 'og_image'
    | 'email_header' | 'presentation' | 'icon_illustration' | 'case_study' | 'team_background';

export type ImageDimension =
    | 'Full screen (16:9)' | 'Square (1:1)' | 'Rectangle (4:3)' | 'Vertical (9:16)'
    | '16:9' | '16:9_blog' | 'og_image' | 'square' | 'card' | 'portrait' | 'wide_banner' | 'icon';

export type StyleVariant =
    | 'abstract_tech' | 'geometric' | 'gradient_mesh' | 'isometric' | 'particle_flow'
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

// Style variant keyword snippets from API spec
const STYLE_SNIPPETS: Record<StyleVariant, string> = {
    abstract_tech: "abstract technology visualization, glowing circuits, data nodes, digital particles, smooth surfaces",
    geometric: "clean geometric shapes, floating polygons, crystalline structures, mathematical precision",
    gradient_mesh: "smooth gradient mesh, flowing color transitions, soft curves, modern minimal",
    isometric: "isometric 3D illustration, floating platforms, connected systems, clean edges",
    particle_flow: "flowing particle streams, energy ribbons, light trails, motion blur, dynamic movement",
    neural_network: "neural network visualization, brain-like structure, synaptic connections, pulsing nodes",
    dashboard: "abstract holographic dashboard, floating UI elements, data charts, futuristic interface",
    connection: "interconnected nodes, network graph, glowing connection lines, hub and spoke",
    funnel: "funnel visualization, layered stages, flowing data, conversion pipeline, inverted pyramid",
    minimal: "ultra minimal, single focal element, vast negative space, subtle accent only"
};

// Mood keyword snippets from API spec
const MOOD_SNIPPETS: Record<Mood, string> = {
    innovative: "cutting-edge, forward-thinking, dynamic energy, transformative",
    professional: "polished, refined, corporate elegance, structured",
    energetic: "high energy, vibrant, bold contrast, electric atmosphere",
    trustworthy: "stable, reliable, grounded, established, secure",
    futuristic: "sci-fi inspired, next-generation, advanced technology, neon accents"
};

// Asset type snippets for layout and composition guidance
const ASSET_TYPE_SNIPPETS: Record<AssetType, string> = {
    hero_image: "featured hero image, bold focal point, cinematic composition, impactful visual",
    infographic: "vertical infographic layout, data visualization, statistics, icons, sectioned layout, information hierarchy",
    process_flow: "horizontal process flow diagram, numbered steps, arrows connecting stages, clear progression, sequential layout",
    comparison: "side-by-side comparison layout, split composition, contrasting elements, versus format, balanced halves",
    checklist: "list format layout, checkmark icons, task-oriented visual, organized rows, completion indicators",
    timeline: "horizontal timeline layout, sequential events, milestone markers, chronological flow, connected points",
    diagram: "technical diagram illustration, architecture visualization, system components, labeled sections, structural layout",
    quote_card: "pull quote card design, testimonial style, quotation marks, centered text area, elegant framing",
    stats_highlight: "big numbers display, KPI metrics, bold statistics, data-driven visual, prominent figures",
    icon_set: "multiple related icons, symbol collection, unified icon style, grid arrangement, consistent visual language"
};

// Subject keyword mappings to enhance visual concepts
const SUBJECT_MAPPINGS: Record<string, string[]> = {
    ai_agents: ["autonomous AI entities", "intelligent automation", "self-operating systems"],
    lead_generation: ["prospect discovery", "data collection", "target identification"],
    lead_qualification: ["filtering process", "scoring system", "decision gates"],
    salesforce: ["CRM platform", "cloud system", "customer records"],
    agentforce: ["AI assistant", "autonomous agent", "intelligent workflow"],
    integration: ["connected systems", "data bridges", "API connections", "unified platform"],
    data_cloud: ["unified data", "customer 360", "centralized information"],
    automation: ["workflow automation", "process streamlining", "efficiency"],
    roi: ["growth visualization", "upward trends", "success metrics", "value creation"],
    speed: ["fast motion", "acceleration", "rapid response"],
    support: ["help desk", "customer service", "assistance"],
    analytics: ["data visualization", "charts and graphs", "insights", "metrics dashboard"]
};

// Composition guidance based on usage context
function getCompositionForUsage(usage: ImageUsage): string {
    const usageLower = String(usage).toLowerCase();

    if (usageLower.includes('hero') || usageLower.includes('blog')) {
        return "clean composition with generous negative space for text overlay";
    }
    if (usageLower.includes('og') || usageLower.includes('social')) {
        return "centered focal point, balanced composition optimized for social sharing";
    }
    if (usageLower.includes('card') || usageLower.includes('thumbnail')) {
        return "compact composition, strong focal point, works at small sizes";
    }
    if (usageLower.includes('icon')) {
        return "simple centered element, minimal detail, clear silhouette";
    }
    if (usageLower.includes('presentation')) {
        return "wide composition with space for presenter content";
    }
    if (usageLower.includes('email') || usageLower.includes('banner')) {
        return "horizontal emphasis, works in wide banner format";
    }

    return "clean minimal composition with clear focal point";
}

// Get aspect ratio description from dimension
function getAspectRatio(dimension: ImageDimension): string {
    const dimStr = String(dimension).toLowerCase();

    if (dimStr.includes('16:9') || dimStr.includes('full screen')) return "16:9 widescreen aspect ratio";
    if (dimStr.includes('square') || dimStr.includes('1:1')) return "1:1 square aspect ratio";
    if (dimStr.includes('4:3') || dimStr.includes('rectangle')) return "4:3 aspect ratio";
    if (dimStr.includes('9:16') || dimStr.includes('vertical') || dimStr.includes('portrait')) return "9:16 vertical aspect ratio";
    if (dimStr.includes('og')) return "1.91:1 social sharing aspect ratio";
    if (dimStr.includes('card')) return "3:2 card aspect ratio";
    if (dimStr.includes('wide') || dimStr.includes('banner')) return "ultra-wide banner aspect ratio";
    if (dimStr.includes('icon')) return "1:1 square icon format";

    return "standard aspect ratio";
}

// Enhance subject with mapped visual concepts
function enhanceSubject(subject: string): string {
    let enhanced = subject;
    const subjectLower = subject.toLowerCase();

    for (const [keyword, visuals] of Object.entries(SUBJECT_MAPPINGS)) {
        const keywordPattern = keyword.replace('_', '[_ ]?');
        if (new RegExp(keywordPattern, 'i').test(subjectLower)) {
            // Add one visual concept enhancement
            const visual = visuals[Math.floor(Math.random() * visuals.length)];
            enhanced += `, ${visual}`;
            break; // Only add one enhancement to avoid over-stuffing
        }
    }

    return enhanced;
}

// Auto-detect best style variant if not provided
function detectStyleVariant(subject: string, usage: ImageUsage): StyleVariant {
    const subjectLower = subject.toLowerCase();
    const usageLower = String(usage).toLowerCase();

    if (/neural|brain|ai|machine learning|ml/i.test(subjectLower)) return 'neural_network';
    if (/connect|integrat|api|bridge/i.test(subjectLower)) return 'connection';
    if (/funnel|pipeline|conversion|sales/i.test(subjectLower)) return 'funnel';
    if (/dashboard|analytic|metric|report/i.test(subjectLower)) return 'dashboard';
    if (/flow|stream|speed|fast/i.test(subjectLower)) return 'particle_flow';
    if (/process|step|workflow|stage/i.test(subjectLower)) return 'isometric';
    if (usageLower.includes('icon')) return 'minimal';

    return 'abstract_tech'; // Default
}

export function generatePrompt(params: GenerateImageParams): string {
    const {
        usage,
        dimension,
        subject,
        additionalDetails,
        mood = 'innovative',
        style_variant,
        asset_type = 'hero_image'
    } = params;

    // Determine style variant (use provided or auto-detect)
    const styleVariant = style_variant || detectStyleVariant(subject, usage);

    // Build prompt components
    const enhancedSubject = enhanceSubject(subject);
    const styleKeywords = STYLE_SNIPPETS[styleVariant];
    const moodKeywords = MOOD_SNIPPETS[mood];
    const assetTypeKeywords = ASSET_TYPE_SNIPPETS[asset_type];
    const composition = getCompositionForUsage(usage);
    const aspectRatio = getAspectRatio(dimension);

    // Color scheme from spec
    const colorScheme = "dark background (#0a0a0a) with cyan (#0ea5e9) and green (#22c55e) accent lighting and glows";

    // Technical specs
    const techSpecs = `${aspectRatio}, 3D render, cinematic lighting, high quality, photorealistic`;

    // Build the prompt following spec template:
    // [NO TEXT PREFIX], [SUBJECT], [ASSET_TYPE], [STYLE_VARIANT keywords], [MOOD keywords],
    // dark background with colors, [COMPOSITION], [TECH_SPECS]

    const noTextPrefix = "Abstract visualization with NO text, words, letters, numbers, or typography. Pure visual elements only.";

    let prompt = `${noTextPrefix} ${enhancedSubject}, ${assetTypeKeywords}, ${styleKeywords}, ${moodKeywords}, ${colorScheme}, ${composition}, ${techSpecs}`;

    // Add user's additional details as priority instructions
    if (additionalDetails && additionalDetails.trim()) {
        prompt += `. IMPORTANT: ${additionalDetails.trim()}`;
    }

    // Add expanded negative prompt guidance to prevent text artifacts
    prompt += `. Avoid: text, words, letters, numbers, labels, captions, titles, typography, writing, signage, logos, watermarks, illegible text, misspelled words, random characters, symbols with text, white backgrounds, cluttered compositions, cartoon style, low quality.`;

    return prompt;
}
