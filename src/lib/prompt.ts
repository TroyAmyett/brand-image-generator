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
    // Strictly follows STYLE_GUIDE.md (e.g., no hardware, gears, or circuits)
    const visualGuidance = `
Visual representation guide:
- "AI Agents" = glowing circular neural nodes, brain-inspired icons, or abstract energetic spheres
- "Data flows" = flowing streams of glowing blue and green particles or liquid light beams
- "Salesforce" = the Salesforce cloud logo as a translucent, glowing glass-like hologram
- "Applications/Apps" = floating obsidian-glass rectangular panels with glowing borders
- "Integration" = interlinked nodes with high-speed energy connections
- "Growth" = ascending data streams or expanding glowing horizons
- "Automation" = pulsating energy cores or orchestrated data movement
`.trim();

    // Build the visual scene description
    let sceneDescription = `The scene should visually represent: "${subject}"`;

    // Explicitly handle "No [thing]" instructions and emphasize them
    if (additionalDetails) {
        sceneDescription += `\n\n**CRITICAL USER INSTRUCTIONS:** ${additionalDetails}\n(Strictly adhere to these exclusions. If "No robots" is specified, do not include any humanoid shapes.)`;
    }

    return `
Create a ${dimension} ${usage} illustration. 

Subject: ${subject}

${sceneDescription}

${visualGuidance}

# STYLE CONSTRAINTS (STRICT):
- Base: Deep navy/black background for maximum contrast.
- Colors: Dominant Electric Cyan/Blue and Neon/Lime Green. Subtle purple accents only.
- Feeling: Cloud-native, digital, software-focused, holographic.
- FORBIDDEN: No robots (unless asked), No hardware, No circuit boards, No gears, No microchips, No PCB traces.
- FORBIDDEN COLORS: No pink, No orange, No yellow, No red as primary colors.

Final Requirement: NO text, NO labels, NO words. Use only visual symbols. Professional 8K Octane Render style.
`;
}
