import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from '@/lib/apiKeyManager';
import fs from 'fs';
import path from 'path';
import type { BrandStyleGuide } from '@/lib/brand-kit';

// ---------------------------------------------------------------------------
// Style guide loading (same pattern as other API routes)
// ---------------------------------------------------------------------------

const GUIDES_DIR = path.join(process.cwd(), 'data', 'style-guides');
const ACTIVE_FILE = path.join(GUIDES_DIR, '_active.json');

function loadStyleGuide(guideId?: string): BrandStyleGuide | null {
  try {
    // If a specific guide ID is provided, load it directly
    if (guideId) {
      const guidePath = path.join(GUIDES_DIR, `${guideId}.json`);
      if (fs.existsSync(guidePath)) {
        return JSON.parse(fs.readFileSync(guidePath, 'utf-8'));
      }
      return null;
    }

    // Otherwise load the active guide
    if (!fs.existsSync(ACTIVE_FILE)) return null;
    const { activeGuideId } = JSON.parse(fs.readFileSync(ACTIVE_FILE, 'utf-8'));
    if (!activeGuideId) return null;

    const guidePath = path.join(GUIDES_DIR, `${activeGuideId}.json`);
    if (!fs.existsSync(guidePath)) return null;
    return JSON.parse(fs.readFileSync(guidePath, 'utf-8'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(activeGuide: BrandStyleGuide | null): string {
  const guideContext = activeGuide
    ? `The user's current active style guide:\n\`\`\`json\n${JSON.stringify(activeGuide, null, 2)}\n\`\`\``
    : 'The user has no active style guide yet. Help them create one from scratch.';

  return `You are a brand identity expert and visual designer assistant built into Canvas, an AI image generation tool.

Your role is to help users:
- Discover and define their brand visual identity
- Create style guides with colors, typography, and visual style
- Refine existing style guides through conversation
- Suggest improvements based on industry best practices

${guideContext}

A style guide includes these fields:
- **name**: The brand name
- **description**: Brief brand description
- **colors**: Primary, secondary, accent colors (as hex codes with names), forbidden colors, and background color
- **typography**: Heading font, body font, and font weight preferences (recommend Google Fonts)
- **visualStyle**: Style keywords, mood descriptors, visual description, and keywords to avoid
- **industry**: Industry or vertical the brand belongs to

When suggesting colors, always provide specific hex codes.
Format color suggestions like: **Primary**: #0ea5e9 (Sky Blue)

When suggesting fonts, recommend Google Fonts that are web-safe and widely available.

Keep responses focused, actionable, and conversational. Avoid overly long responses.
When you have enough information, suggest creating or updating a style guide with specific values.
If the user asks something unrelated to branding or design, gently redirect the conversation back to brand identity topics.`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  activeGuideId?: string;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body: ChatRequestBody = await request.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_MESSAGES',
            message: 'messages array is required and must not be empty',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Anthropic API key
    const apiKey = await getApiKey('anthropic');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'NO_API_KEY',
            message:
              'Anthropic API key is not configured. Please add your API key in Settings.',
          },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load active style guide for context
    const activeGuide = loadStyleGuide(body.activeGuideId);
    const systemPrompt = buildSystemPrompt(activeGuide);

    // Create Anthropic client
    const client = new Anthropic({ apiKey });

    // Sanitize messages - ensure proper alternation and valid roles
    const sanitizedMessages = body.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .filter((m) => typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.trim(),
      }));

    if (sanitizedMessages.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_MESSAGES',
            message: 'No valid messages after sanitization',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ensure the conversation starts with a user message
    if (sanitizedMessages[0].role !== 'user') {
      sanitizedMessages.shift();
    }

    // Ensure the conversation ends with a user message
    while (
      sanitizedMessages.length > 0 &&
      sanitizedMessages[sanitizedMessages.length - 1].role !== 'user'
    ) {
      sanitizedMessages.pop();
    }

    if (sanitizedMessages.length === 0) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_MESSAGES',
            message: 'Messages must include at least one user message',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response using the Anthropic SDK
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: sanitizedMessages,
    });

    // Build an SSE ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          // If an error occurs during streaming, send it as an SSE event
          const errorMessage =
            err instanceof Error ? err.message : 'Streaming error occurred';
          const errorChunk = `data: ${JSON.stringify({ error: errorMessage })}\n\n`;
          controller.enqueue(encoder.encode(errorChunk));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat/brand route:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'CHAT_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to process chat request',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
