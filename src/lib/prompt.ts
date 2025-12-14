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

    // Build the core visual description
    const coreDescription = additionalDetails
        ? `${subject}. IMPORTANT DETAIL: ${additionalDetails}`
        : subject;

    return `
Create a high-quality ${dimension} image for a ${usage}.

**THE IMAGE MUST SHOW:** ${coreDescription}

**MANDATORY RULES:**
- NO TEXT, LABELS, WORDS, OR LETTERS anywhere in the image.
- Use abstract symbols and data visualization elements only.

**VISUAL STYLE:**
${STYLE_GUIDE}

**REMEMBER: The image MUST depict "${coreDescription}" - this is the primary requirement. Everything else is secondary.**
`;
}
