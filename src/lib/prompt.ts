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

**CRITICAL RULES (MUST FOLLOW):**
1. NO TEXT. NO LABELS. NO WORDS. NO LETTERS. The image must be purely visual.
2. Use ONLY abstract symbols, glowing geometric shapes, and data visualization elements.

**WHAT TO CREATE:**
- **Subject:** ${subject}
- **Usage:** ${usage}
- **Aspect Ratio:** ${dimension}

${additionalDetails ? `
**USER'S SPECIFIC REQUIREMENTS (HIGHEST PRIORITY - YOU MUST FOLLOW THESE):**
${additionalDetails}

The above requirements from the user take precedence over all other guidelines below. If the user's requirements conflict with the style guide, FOLLOW THE USER'S REQUIREMENTS.
` : ''}

**VISUAL STYLE REFERENCE:**
${STYLE_GUIDE}

**FINAL CHECKLIST:**
- Did you incorporate the user's specific requirements above? (If provided, this is mandatory)
- No text, labels, or words anywhere in the image?
- High-resolution, professional quality render?
- Dark background with blue/green primary colors, purple as accent?
`;
}
