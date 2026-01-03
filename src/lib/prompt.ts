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

    // Visual translation guidance - helps DALL-E understand abstract concepts in a cloud-native way
    const symbolLibrary = `
# SYMBOL REFERENCE LIBRARY (Use these to represent concepts):
- "AI Agents" = glowing circular neural nodes, brain-inspired icons, or abstract energetic spheres.
- "Data flows" = flowing streams of glowing blue and green particles or liquid light beams.
- "Salesforce" = the Salesforce cloud logo as a translucent, glowing glass-like hologram.
- "Applications/Apps" = floating obsidian-glass rectangular panels with glowing borders.
- "Integration" = interlinked nodes with high-speed energy connections.
- "Growth" = ascending data streams or expanding glowing horizons.
- "Automation" = pulsating energy cores or orchestrated data movement.
`.trim();

    // Scene Composition Rules
    const compositionRules = `
# COMPOSITION RULES:
- NARRATIVE PRIORITY: The image must first and foremost depict the core subject: "${subject}".
- PLURALITY: If the subject involves a "team", "group", "multiple", or "network", ensure the composition features MANY distinct elements or entities interacting. Do not just center a single object.
- DENSITY: Populating the scene with a rich variety of symbols from the library below is encouraged to show "scale" and "complexity".
`.trim();

    // Build the visual scene description
    let userInstructions = "";
    if (additionalDetails) {
        userInstructions = `\n\n**CRITICAL EXCLUSIONS/DETAILS:** ${additionalDetails}\n(Strictly follow these instructions. If "No robots" is specified, use abstract spheres or nodes only.)`;
    }

    return `
Create a ${dimension} ${usage} digital illustration. 

PREMISE: A high-end, professional visualization of: "${subject}"

${compositionRules}
${userInstructions}

# STYLE CONSTRAINTS (STRICT):
- Environment: Deep infinity-black background.
- Colors: Dominant Electric Cyan/Blue (#00FFFF) and Neon/Lime Green (#39FF14). Purple subtle accents only.
- Aesthetic: Cloud-native, software-focused, holographic, Glassmorphism. 
- Technical: NO hardware (gears, circuits, microchips). NO text/labels.
- Quality: 8K Octane Render, cinematic lighting, sharp focus.

${symbolLibrary}
`;
}
