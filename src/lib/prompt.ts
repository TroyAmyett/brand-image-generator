// Style hints are now strictly aligned with the style guide
// Full style guide is in styleGuide.ts for reference

export type ImageUsage = 'Hero Background' | 'Product/Service Card Image' | 'Icon' | 'Blog Main Image' | 'Social Media Post' | 'Other';
export type ImageDimension = 'Full screen (16:9)' | 'Square (1:1)' | 'Rectangle (4:3)' | 'Vertical (9:16)';

export interface GenerateImageParams {
    usage: ImageUsage;
    dimension: ImageDimension;
    subject: string;
    additionalDetails?: string;
}

export function generatePrompt(params: GenerateImageParams): string {
    const { usage, dimension, subject, additionalDetails } = params;

    // Detection for sequential topics
    const isSequential = /step|process|flow|workflow|stage|roadmap|journey/i.test(subject);

    // Visual translation guidance - helps DALL-E understand abstract concepts in a cloud-native way
    const symbolLibrary = `
# VISUAL SYMBOLS (STRICT ADHERENCE):
- "Agentforce" = Orchestrated clusters of autonomous glowing spheres floating in an infinite void.
- "AI Agents" = Spherical nodes of liquid energy with internal neural filaments.
- "Data flows" = Sinuous, organic streams of liquid light and glowing particles connecting elements.
- "Architecture/Platform" = A high-speed network of floating translucent glass panels and energetic nodes.
- "Salesforce" = A glowing, semi-transparent prism-like cloud logo floating in the center.
- "Steps/Process" = A sequence of glass portals or floating stage panels arranged in a clear path.
`.trim();

    // Specific logic for linear/sequential subjects
    const sequentialGuidance = isSequential ? `
# COMPOSITION: SEQUENTIAL FLOW
- The layout is a linear, directional progression (typically Left-to-Right).
- Avoid centered, circular, or pedestal-based compositions.
- Use a wide, panoramic view to show a "Data Journey" through multiple stages.
` : `
# COMPOSITION: NETWORK ECOSYSTEM
- A dynamic, three-dimensional network of floating elements.
- Avoid physical structures, pedestals, or bases.
- Everything should feel weightless and suspended in deep space.
`;

    // Build the visual scene description
    let userInstructions = "";
    if (additionalDetails) {
        userInstructions = `\n\n**USER SPECIFIC INSTRUCTIONS:** ${additionalDetails}\n(Strictly follow these. If "No robots" is specified, use only abstract nodes.)`;
    }

    return `
Create a ${dimension} ${usage} professional digital illustration. 

CONCEPT: A high-end visualization of: "${subject}"

${sequentialGuidance}
${userInstructions}

# STYLE CONSTRAINTS (MANDATORY):
- VOID ENVIRONMENT: Deep, pitch-black infinite background. No ground, No floor, No grid, No mesh. 
- FLUID AESTHETIC: Use liquid light, glowing nebulae, and organic energy flows. 
- FORBIDDEN - NO PHYSICAL HARDWARE: No circuit boards, No PCB patterns, No motherboards, No soldering, No metal, No industrial parts.
- FORBIDDEN - NO BASES: No pedestals, No blocks, No literal platforms or floors.
- COLORS: High-contrast Electric Cyan (#00FFFF) and Vibrant Lime Green (#39FF14). Subtle violet ambient glows.
- MATERIALS: Glassmorphism (frosted, translucent glass), liquid light, bokeh particles.

${symbolLibrary}

Final Requirement: 8K Octane Render, sharp crystalline focus, ZERO text/labels.
`;
}
