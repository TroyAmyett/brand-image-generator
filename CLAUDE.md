# Canvas - On-Brand Image Generator

AI-powered image generation platform supporting multiple providers. Generate on-brand images with text-to-image, image-to-image, restyle, and asset set workflows.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Port:** 3002 (`npm run dev`)
- **URL:** canvas.funnelists.com
- **Database:** Supabase (shared project `ilxgrlnwjtdpikpjocll`)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## Commands

```bash
npm run dev        # Start dev server on port 3002
npm run build      # Production build
npm run lint       # ESLint
```

## Key Dependencies

- `openai` - DALL-E 3 image generation
- `sharp` - Server-side image processing (resize, format conversion)
- `html2canvas` - Browser-based screenshot/rendering
- `png-to-ico` - Favicon generation
- `@anthropic-ai/sdk` - Claude AI for prompt engineering

## Project Structure

```
canvas/
├── src/
│   ├── app/
│   │   ├── (auth)/        # Auth-protected routes
│   │   ├── api/           # API routes (generate, restyle, etc.)
│   │   ├── characters/    # Character/persona management
│   │   ├── config/        # App configuration
│   │   ├── icons/         # Icon generation
│   │   ├── image-tools/   # Image manipulation tools
│   │   ├── logos/         # Logo generation
│   │   ├── restyle/       # Image restyling
│   │   ├── showcase/      # Generated image gallery
│   │   └── watermarks/    # Watermark management
│   ├── components/        # Shared React components
│   ├── contexts/          # React context providers
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utility libraries
│   └── ui/                # UI primitives
├── data/                  # Static data files
├── supabase/              # Migrations
├── BACKLOG.md             # Feature backlog
└── STYLE_GUIDE.md         # Visual style guide
```

## Key Patterns

- **Multi-provider:** DALL-E 3 (OpenAI), Stability AI, Replicate Flux for image generation
- **Image processing pipeline:** Generate -> Sharp processing -> format conversion
- **Asset set workflow:** Generate consistent branded assets (logos, icons, watermarks, favicons)
- **Restyle:** Upload existing image and regenerate in different styles
- **Character system:** Save character/persona descriptions for consistent generation

## AI Providers

- **DALL-E 3** (via OpenAI SDK) - Primary text-to-image
- **Stability AI** - Alternative provider
- **Replicate Flux** - Additional models
- **Claude AI** - Prompt enhancement and style analysis

## Documentation

- `BACKLOG.md` - Feature backlog (history view, client profiles, style guide ingestion)
- `STYLE_GUIDE.md` - Visual style reference

## MANDATORY: Testing Before Completion

**DO NOT waste the owner's time or tokens.** Before declaring ANY task complete:

1. **Build the project** — run `npm run build` and confirm zero errors
2. **Run the app** — start the dev server (`npm run dev`) and verify it loads in the browser
3. **Test the specific feature you changed** — interact with it, confirm it works end-to-end
4. **Test adjacent features** — confirm you didn't break anything nearby
5. **Check the browser console** — no new errors or warnings

**If deploying to Vercel:** Wait for the deployment to complete, then verify the feature works on the live Vercel URL before telling the owner it's working.

**If you cannot fully test it, say so explicitly.** Do not claim "tested and working" unless you have actually verified it. Untested code is unfinished code. Shipping broken features wastes real human time and is unacceptable.

## Ecosystem

Part of the Funnelists ecosystem. See `../CLAUDE.md` for shared infrastructure.
See `../funnelists-skills/design-system.md` for brand colors and UI patterns.
