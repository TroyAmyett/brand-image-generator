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

    // Minimal style hints - just colors and mood
    const styleHints = `
Style: Futuristic, high-tech, cloud software aesthetic. 
Colors: Electric cyan/blue and neon green as primary, purple as subtle accent. Dark background.
Quality: Ultra-detailed 8K render, professional.
IMPORTANT: NO text, labels, or words in the image.`.trim();

    // Build the main description - user's input is the PRIMARY focus
    let mainDescription = subject;
    if (additionalDetails) {
        mainDescription = `${subject}. 
        
Specific visual requirement: ${additionalDetails}

You MUST incorporate the above specific visual requirement into the image. This is not optional.`;
    }

    return `
Create a ${dimension} ${usage} image.

WHAT TO SHOW: ${mainDescription}

${styleHints}
`;
}
