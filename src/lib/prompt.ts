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

    // Sub-topic detection for specialized compositions
    const isArchitecture = /architecture|platform|engine|infrastructure|system/i.test(subject);
    const isSequential = /step|process|flow|workflow|stage|roadmap/i.test(subject);

    // 1. Core Visual Metaphor
    let compositionStyle = "";
    if (isArchitecture) {
        compositionStyle = `The composition should be a 3D isometric visualization of software architecture. 
Central focus: A brilliant "Reasoning Core" (Atlas Engine) shown as a glowing holographic brain-like sphere of light. 
Surrounding elements: Floating glass UI panels representing Data Cloud, CRM, and Orchestration, all connected to the core by pulsing channels of neon light.`;
    } else if (isSequential) {
        compositionStyle = `The layout follows a clear horizontal path (Left-to-Right).
It depicts a "Data Journey" where information travels through a series of glowing glass portals, each representing a distinct stage of completion.`;
    } else {
        compositionStyle = `A balanced, elegant 3D composition focused on ${subject}. Everything is suspended in weightless space, interconnected by subtle energy streams.`;
    }

    // 2. Branded Symbol Translation
    const agentforceContext = /agentforce/i.test(subject) ?
        "Visualizing Agentforce: Depict autonomous agents as glowing neural orbs that appear intelligent and reactive, integrated into the Salesforce ecosystem." : "";

    // 3. User Exclusions/Details
    const userExclusions = additionalDetails ? `\n\n**CRITICAL INSTRUCTION:** ${additionalDetails}` : "";

    return `
Generate a professional, high-end ${dimension} ${usage} for a Salesforce consulting website.

SUBJECT: ${subject}

SCENE DESCRIPTION:
${compositionStyle}
${agentforceContext}
Use the Salesforce cloud logo as a subtle, translucent holographic watermark or secondary visual element to ground the brand.

STYLE & AESTHETIC:
- BACKGROUND: Pure infinite black void. No ground, no horizon, no physical floors.
- LIGHTING: Atmospheric volumetric glows. Use Electric Cyan (#00FFFF) and Neon Green (#39FF14) as the light sources.
- MATERIALS: Glassmorphism—frosted glass panels, liquid light beams, and crystalline nodes. 
- VIBE: Modern, cloud-native, sophisticated software. 

FORBIDDEN (DO NOT INCLUDE):
- NO physical hardware, NO circuit boards, NO green PCB textures, No wires, NO robots, NO people, NO text/labels.

${userExclusions}

Final Output: 8K Octane Render, sharp focus, cinematic depth of field.
`;
}
