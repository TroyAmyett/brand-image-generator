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

    // 1. Core Visual Metaphor - Anchored in Salesforce 2025 "Cosmos" and "Atlas" branding
    let compositionStyle = "";
    if (isArchitecture) {
        compositionStyle = `The composition is a high-tech 3D software visualization (Salesforce Cosmos Style).
- CENTRAL CORE: A luminous, multi-layered holographic sphere representing the "Atlas Reasoning Engine". It is made of pure light and neural energy filaments.
- FLOATING INTERFACE: Surrounding the core are floating, semi-transparent (Glassmorphism) UI panels with smooth rounded corners.
- DATA CONNECTIVITY: These panels are connected to the core by flowing "liquid light" streams and glowing fiber-optic paths.
- DEFINITELY NO hardware, NO circuit boards, NO chips, NO pedestals. All elements are weightless and suspended.`;
    } else if (isSequential) {
        compositionStyle = `The layout is a linear, Left-to-Right "Data Journey".
- STAGES: Represent steps as a series of glowing glass "Stage Portals" or "UI Tiles" with rounded corners.
- PROGRESSION: A single, continuous stream of liquid light flows through each stage, representing a smooth business process.
- Avoid branching or chaotic paths. Clear, professional workflow visualization.`;
    } else {
        compositionStyle = `A sleek, modern 3D visualization focused on ${subject}.
- Use floating glass panels and glowing spherical nodes to represent data and people.
- Everything is clean, uncluttered, and professional.`;
    }

    // 2. Branded Symbol Translation (Agentforce Era)
    const agentContext = /agentforce|agent/i.test(subject) ?
        "Visualizing Agents: Depict autonomous agents as elegant, glowing energy nodes (circular, no robots) that orbit the central architecture like intelligent satellites." : "";

    // 3. User Exclusions/Details
    const userExclusions = additionalDetails ? `\n\n**CRITICAL USER INSTRUCTION:** ${additionalDetails}` : "";

    return `
Create a professional ${dimension} ${usage} for a Salesforce high-end technical website.

PRIMARY TOPIC: "${subject}"

SCENE DESCRIPTION:
${compositionStyle}
${agentContext}

# VISUAL AESTHETIC (STRICT):
- THEME: Salesforce 2025 "Cosmos" UI design. Clean, rounded, elegant, cloud-native.
- BACKGROUND: Deep, absolute infinite black void. No ground, no floors, no physical bases.
- COLORS: High-contrast Electric Cyan (#00FFFF) and Vibrant Lime Green (#39FF14). Ambient violet glows for depth.
- MATERIALS: Frosted glass, translucent panels, liquid light, bokeh particles. 

# FORBIDDEN (CRITICAL):
- NO TEXT: Do not include ANY words, letters, labels, or gibberish characters in the image.
- NO HARDWARE: Absolutely no circuit boards, no motherboards, no computer chips, no wires, no metal, no pedestals.
- NO ROBOTS: No humanoid shapes or robotic elements unless specifically requested.

${userExclusions}

Quality: 8K Octane Render, sharp crystalline focus, clean professional finish.
`;
}
