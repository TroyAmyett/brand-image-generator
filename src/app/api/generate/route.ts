import { NextResponse } from 'next/server';
import { generatePrompt, GenerateImageParams } from '@/lib/prompt';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { usage, dimension, subject, additionalDetails } = body;

        if (!usage || !dimension || !subject) {
            return NextResponse.json(
                { error: 'Missing required fields: usage, dimension, subject' },
                { status: 400 }
            );
        }

        const params: GenerateImageParams = {
            usage,
            dimension,
            subject,
            additionalDetails,
        };

        const prompt = generatePrompt(params);

        // DALL-E 3 Integration
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API Key not configured on server' },
                { status: 500 }
            );
        }

        // Map UI dimensions to DALL-E 3 supported sizes
        // DALL-E 3 supports: 1024x1024, 1024x1792 (Vertical), 1792x1024 (Horizontal)
        let size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";

        if (dimension.includes('Vertical') || dimension.includes('9:16')) {
            size = "1024x1792";
        } else if (dimension.includes('Full screen') || dimension.includes('16:9') || dimension.includes('Rectangle')) {
            size = "1792x1024";
        } else {
            size = "1024x1024"; // Square
        }

        // Initialize OpenAI
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        console.log(`Generating image with DALL-E 3. Size: ${size}`);

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            size: size,
            quality: "hd", // High quality for "premium" feel
            n: 1,
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error("No image URL returned from OpenAI");
        }

        // SAVE FOR FUTURE REFERENCE (Note: This only works locally. Move to DB for Vercel)
        const logEntry = `
## ${new Date().toISOString()} - ${usage}
**Subject:** ${subject}
**Dimensions:** ${dimension} (Mapped to: ${size})
**Prompt:**
\`\`\`
${prompt}
\`\`\`
---
`;

        try {
            const historyPath = path.join(process.cwd(), 'generated_history.md');
            fs.appendFileSync(historyPath, logEntry);
        } catch (logError) {
            // Silent fail in production/Vercel
        }

        return NextResponse.json({
            success: true,
            prompt: prompt,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error('Error generating image:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
