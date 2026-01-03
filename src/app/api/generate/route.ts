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
            quality: "hd",
            n: 1,
        });

        const imageUrl = response.data?.[0]?.url;

        if (!imageUrl) {
            throw new Error("No image URL returned from OpenAI");
        }

        // Build History Item
        const timestamp = new Date().toISOString();
        const historyItem = {
            id: timestamp,
            timestamp,
            usage,
            dimension,
            subject,
            imageUrl,
            prompt
        };

        // SAVE TO LOCAL JSON (for Local Dev persistency)
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const historyPath = path.join(dataDir, 'history.json');

            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir);
            }

            let history = [];
            if (fs.existsSync(historyPath)) {
                const fileContent = fs.readFileSync(historyPath, 'utf-8');
                history = JSON.parse(fileContent);
            }

            history.unshift(historyItem); // Add to beginning

            // Limit to last 50 entries
            if (history.length > 50) {
                history = history.slice(0, 50);
            }

            fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        } catch (err) {
            console.error('Failed to save to JSON history:', err);
        }

        // ALSO KEEP MARKDOWN LOG
        try {
            const logEntry = `\n## ${timestamp} - ${usage}\n**Subject:** ${subject}\n**Dimensions:** ${dimension}\n**URL:** ${imageUrl}\n**Prompt:**\n\`\`\`\n${prompt}\n\`\`\`\n---\n`;
            const logPath = path.join(process.cwd(), 'generated_history.md');
            fs.appendFileSync(logPath, logEntry);
        } catch (logError) {
            // Silent fail
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
