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

**CRITICAL RULE: NO TEXT. NO LABELS. NO WORDS.**
- The image must differ from a standard marketing slide.
- Do NOT include captions, titles, or descriptions under icons or elements.
- Use ONLY abstract symbols, glowing geometric shapes, and data visualization elements.
- If a "card" or "interface" is shown, it must be purely visual/abstract with NO written content.

**CONTEXT:**
Generate a high-quality website image.

**STYLE GUIDE (STRICTLY ADHERE):**
${STYLE_GUIDE}

**SPECIFICATIONS:**
- **Usage Context:** ${usage}
- **Dimensions/Aspect Ratio:** ${dimension}
- **Subject/Topic:** ${subject}

${additionalDetails ? `
**PRIORITY OVERRIDES & DETAILS (MOST IMPORTANT):**
${additionalDetails}
` : ''}

**INSTRUCTIONS:**
1. Create a visually striking image that fits the "Usage Context" and "Subject".
2. **Prioritize the "PRIORITY OVERRIDES" section above general style guide rules if there is a conflict.**
3. Ensure the color palette and mood align perfectly with the "Style Guide".
4. Compose the image to allow for text overlay if applicable (leave negative space).
5. High resolution, photorealistic or high-fidelity 3D render style.
`;
}
