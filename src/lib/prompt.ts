// Style hints are now inline - full style guide is in styleGuide.ts for reference

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

    // Visual translation guidance - helps DALL-E understand abstract concepts
    const visualGuidance = `
Visual representation guide:
- "AI Agents" = glowing humanoid robot silhouettes or circular node icons with brain symbols
- "Data flows" = flowing streams of glowing particles or light beams connecting elements
- "Salesforce" = the Salesforce cloud logo as a central glowing hologram
- "Applications/Apps" = floating rectangular app icons or window frames
- "Integration" = connected nodes with flowing lines between them
- "Revenue/Growth" = upward trending graphs or ascending arrows
- "Automation" = gears, circuits, or robotic elements
`.trim();

    // Build the visual scene description
    let sceneDescription = `The scene should visually represent: "${subject}"`;
    if (additionalDetails) {
        sceneDescription += `

The user specifically wants to see: "${additionalDetails}"

Translate these concepts into visible elements using the visual guide above.`;
    }

    return `
Create a ${dimension} ${usage} illustration.

${sceneDescription}

${visualGuidance}

Style: Futuristic holographic aesthetic on dark background. Electric cyan and neon green glows. Purple as subtle accent. Ultra-detailed, professional quality.

Critical: NO text, words, or labels anywhere in the image. Use only visual symbols and abstract elements.
`;
}
