import { STYLE_GUIDE } from './styleGuide';

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

    return `
*** IMAGE GENERATION PROMPT ***

**CONTEXT:**
Generate a high-quality website image based on the following specifications.

**STYLE GUIDE (STRICTLY ADHERE):**
${STYLE_GUIDE}

**SPECIFICATIONS:**
- **Usage Context:** ${usage}
- **Dimensions/Aspect Ratio:** ${dimension}
- **Subject/Topic:** ${subject}
${additionalDetails ? `- **Additional Details:** ${additionalDetails}` : ''}

**INSTRUCTIONS:**
1. Create a visually striking image that fits the "Usage Context" and "Subject".
2. Ensure the color palette and mood align perfectly with the "Style Guide".
3. Compose the image to allow for text overlay if applicable (especially for Hero/Background).
4. Do not include text inside the image unless it's a logo or specified.
5. High resolution, photorealistic or high-fidelity 3D render style as per guide.
`;
}
