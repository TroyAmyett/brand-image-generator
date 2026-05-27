---
name: canvas-hero-pipeline
description: Turn a product screenshot into a polished hero-video frame sequence — renders a Canvas showcase effect (cascade/spotlight/tilt/isometric) as a motion sequence (Ken Burns pan/zoom or effect animation) in 16:9 + 9:16, and writes a numbered PNG frame sequence + manifest.json ready for a video tool. Trigger when the user wants hero images/frames/a hero video from a screenshot, or mentions the "showcase pipeline".
version: 1.0.0
author: Troy Amyett
category: design
namespace: "@fun"
source_product: canvas
status: active
tags: [hero-video, showcase, screenshots, motion, ken-burns, frame-sequence, landing-page, video]
---

# Canvas Hero Showcase Pipeline

Turns a screenshot into polished, on-brand **hero-video frames** an external
video tool stitches into a clip.

```
screenshot → [optional AI enhance] → showcase effect render
           → motion frame sequence  → numbered frames + manifest.json
                                     → [optional ffmpeg preview]
```

The pipeline is **API-first**: every render goes through the documented
`POST /api/showcase/render` endpoint (the same one the UI/agents can use). The
orchestrator (`pipeline.ts`) just drives that endpoint and does the cheap
frame math locally with `sharp`.

## When to use

- "Make hero frames / a hero video from this screenshot"
- "Run the showcase pipeline on <image>"
- Producing landing-page hero motion shots from app/product screenshots

## Prerequisites

1. **Dev server running** on port 3002: `npm run dev`
2. **A Chromium browser** installed (Chrome or Edge — auto-detected). Override
   with `PUPPETEER_EXECUTABLE_PATH` if needed. On Vercel the endpoint uses
   `@sparticuz/chromium` automatically.
3. **ffmpeg** on PATH — only if you pass `--preview`.
4. `--enhance` additionally needs a Stability AI key configured in the Canvas
   env (it calls `/api/generate-img2img`). The default `--raw`-style run needs
   no AI keys — only the headless renderer.

## Run it

```bash
# 1. start the dev server (separate terminal)
npm run dev

# 2. run the pipeline
npx tsx .claude/skills/canvas-hero-pipeline/pipeline.ts \
  --input ./shot.png \
  --effect tilt \
  --aspects 16:9,9:16 \
  --motion ken-burns \
  --duration 4 --fps 30 \
  --out ./hero-out \
  --preview
```

### Key flags

| Flag | Default | Notes |
|------|---------|-------|
| `--input` | *(required)* | One or more screenshots (comma-separated paths or URLs). cascade/isometric look best with 2–5. |
| `--effect` | `tilt` | `cascade` \| `spotlight` \| `tilt` \| `isometric` |
| `--preset` | – | A showcase preset id (e.g. `tilt-right`, `spotlight-hero`, `linear-hero`) |
| `--aspects` | `16:9,9:16` | Any of `16:9`, `9:16`, `1:1`, `4:5` |
| `--motion` | `ken-burns` | `ken-burns`, `zoom-in`, `zoom-out`, `pan-left/right/up/down`, `still` |
| `--mode` | `kenburns` | `kenburns` = camera move over one render (cheap). `effect` = re-render the effect each frame (the tilt/scale itself animates) |
| `--duration` / `--fps` | `4` / `30` | Clip length & frame rate → `duration×fps` frames |
| `--format` | `png` | `png` \| `webp` \| `jpeg` (`--quality` 1–100 for the latter two) |
| `--enhance [mode]` | off | AI-enhance the screenshot first (`enhance_brand` \| `style_transfer` \| `reimagine`) |
| `--out` | `./hero-out` | Output directory |
| `--preview` | off | Build an `ffmpeg` `preview.mp4` per aspect |

Run with `--help` for the complete list.

## Output

```
hero-out/
├── manifest.json          # effect, motion, fps, dims, frame counts, per aspect
├── 16x9/
│   ├── frame_0001.png … frame_0120.png
│   └── preview.mp4        # only with --preview
└── 9x16/
    ├── frame_0001.png …
    └── preview.mp4
```

- Frame stitchers (Premiere/CapCut/Remotion/`ffmpeg`): import the numbered
  sequence at the manifest's `fps`.
- AI image-to-video tools (Runway/Kling/Sora): use `frame_0001` and the last
  frame as start/end **keyframes**.

## How motion works (two modes)

- **`kenburns` (default):** render the effect ONCE per aspect at an overscanned
  resolution, then sweep a crop window (zoom + pan) across that still with
  `sharp`. One browser render, N cheap crops — fast and deterministic. Math
  lives in `src/lib/showcase/motion.ts` (unit-tested in `__tests__/motion.test.ts`).
- **`effect`:** interpolate the effect's own settings frame-by-frame (e.g. the
  tilt angle sweeps) and re-render each frame via the endpoint's batch mode.
  More expensive; use for animated-effect looks.

## Architecture / files

| File | Role |
|------|------|
| `src/app/api/showcase/render/route.ts` | API primitive — renders 1 frame or a batch via headless Chromium |
| `src/app/showcase/render-frame/page.tsx` | Chromeless page the browser screenshots (reuses the real effect components) |
| `src/lib/showcase/browser.ts` | Headless launcher (local Chrome/Edge · Vercel `@sparticuz/chromium`) |
| `src/lib/showcase/motion.ts` | Easing, Ken Burns crop plan, settings interpolation (pure, tested) |
| `.claude/skills/canvas-hero-pipeline/pipeline.ts` | Orchestrator (this skill) |

## Notes

- Portrait/square aspects auto-bump the subject scale so it fills the taller
  frame (`adaptSettings`). Tune further with `--preset` or a custom effect.
- Output frame dimensions are always exact (sharp resizes the capture), so the
  sequence drops cleanly into any timeline.
