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
# SYMBOL REFERENCE LIBRARY:
- "Agentforce" = Orchestrated groups of glowing autonomous agent nodes, represented as energetic spheres with internal neural patterns.
- "AI Agents" = Individual glowing circular brain-node icons or abstract energetic spheres.
- "Data flows" = Liquid light beams or streams of glowing blue/green particles.
- "Salesforce" = The iconic Salesforce cloud logo, rendered as a translucent, glowing glass-like hologram.
- "Apps/Tools" = Floating obsidian-glass rectangular panels with glowing neon borders.
- "Process Step" = A vertical or horizontal translucent glass tile with a glowing border.
`.trim();

    // Specific logic for linear/sequential subjects
    const sequentialGuidance = isSequential ? `
# SEQUENTIAL COMPOSITION (MANDATORY):
- The image MUST be a linear progression (Horizontal from Left-to-Right or a winding path).
- DO NOT center the image. Use the full width of the ${dimension} canvas to show progress.
- Represent "Steps" as a series of distinct, connected stages or glowing glass portals.
- The layout should feel like a "Roadmap" or "Path to Success".
` : `
# BROAD COMPOSITION:
- Use a clean, balanced layout focused on: "${subject}".
- If multiple elements are involved, show them interacting in a unified space.
`;

    // Build the visual scene description
    let userInstructions = "";
    if (additionalDetails) {
        userInstructions = `\n\n**USER SPECIFIC INSTRUCTIONS:** ${additionalDetails}\n(Strictly follow these. If "No robots" is specified, use only abstract nodes.)`;
    }

    return `
Create a ${dimension} ${usage} professional digital illustration. 

PRIMARY TOPIC: "${subject}"

${sequentialGuidance}
${userInstructions}

# STYLE CONSTRAINTS (STRICT):
- Perspective: Panoramic or 3/4 isometric view (especially for steps/processes).
- Environment: Clean, deep infinity-black background with subtle mesh/grid ground.
- Colors: Electricity Cyan (#00FFFF) and Neon Green (#39FF14). Very subtle purple for ambient depth.
- Materials: Glassmorphism, translucent panels, glowing edges, holographic light.
- Forbidden: NO hardware, NO circuit boards, NO text, NO labels, NO people.

${symbolLibrary}

Final Requirement: High-fidelity 8K render, cinematic depth of field, sharp icons.
`;
}
