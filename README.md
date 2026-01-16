# Canvas - On-Brand Image Generator

A Next.js application for generating on-brand images using AI. Supports both Text-to-Image and Image-to-Image modes with multiple AI providers.

## Features

### Text-to-Image
- Generate images from text descriptions
- Multiple brand themes (Salesforce, General AI, Blockchain, Neutral, Minimal, Photorealistic)
- Asset set generation with automatic cropping to multiple sizes
- Support for multiple AI providers (OpenAI DALL-E 3, Stability AI, Replicate Flux)

### Image-to-Image
- Upload existing images and apply brand styling
- Three transformation modes:
  - **Style Transfer**: Keep composition, apply brand aesthetic
  - **Reimagine**: Create new interpretation inspired by source
  - **Enhance & Brand**: Subtle color grading and enhancement
- Adjustable style strength (0-100%)
- Preserve options for text, layout, and colors
- Side-by-side comparison view with draggable slider

## Getting Started

### Prerequisites

- Node.js 18+
- API keys for at least one image provider:
  - OpenAI API key (for DALL-E 3)
  - Stability AI API key (required for Image-to-Image)
  - Replicate API key (optional)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with your API keys:

```env
OPENAI_API_KEY=your_openai_key
STABILITY_API_KEY=your_stability_key
REPLICATE_API_KEY=your_replicate_key
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Production Build

```bash
npm run build
npm start
```

## Image-to-Image Usage Guide

The Image-to-Image feature allows you to transform existing images using AI while applying your brand aesthetic.

### Step 1: Upload Source Image

You can upload an image in three ways:
- **Drag & Drop**: Drag an image file directly onto the upload area
- **Browse**: Click the upload area to open a file picker
- **URL**: Click "Load from URL" to fetch an image from the web

Supported formats: PNG, JPG, WEBP (up to 10MB)

### Step 2: Configure Transformation

1. **Transformation Mode**:
   - **Style Transfer**: Maintains the original composition while applying the selected brand's visual style
   - **Reimagine**: Creates a new artistic interpretation inspired by your source image
   - **Enhance & Brand**: Makes subtle adjustments and color grading to match your brand

2. **Style Strength** (0-100%):
   - 0-20%: Subtle changes, preserves most of the original
   - 30-50%: Light to moderate transformation
   - 60-80%: Strong transformation while retaining core elements
   - 90-100%: Maximum artistic reinterpretation

3. **Preserve Options**:
   - Preserve text/labels: Tries to keep text elements legible
   - Preserve layout structure: Maintains spatial arrangement
   - Preserve original colors: Keeps the color palette from source

4. **Brand Theme**: Select the brand aesthetic to apply

### Step 3: Generate and Compare

Click "Apply Style" to generate the styled image. Once complete:
- Use the draggable slider to compare before/after
- Click "Download Styled" to save the result
- Click "Regenerate" to try again with the same settings

### API Usage

The Image-to-Image feature is also available via API:

```bash
POST /api/generate-img2img
Content-Type: application/json

{
  "sourceImage": "data:image/png;base64,...",
  "transformationMode": "style_transfer",
  "styleStrength": 50,
  "preserveOptions": {
    "preserveText": false,
    "preserveLayout": true,
    "preserveColors": false
  },
  "brandTheme": "salesforce"
}
```

Response:
```json
{
  "success": true,
  "styledImage": "data:image/png;base64,...",
  "prompt": "Applied style prompt...",
  "metadata": {
    "transformationMode": "style_transfer",
    "styleStrength": 50,
    "brandTheme": "salesforce",
    "imageStrength": "0.50"
  }
}
```

## Project Structure

```
src/
  app/
    page.tsx              # Main UI component
    api/
      generate/           # Text-to-Image API
      generate-img2img/   # Image-to-Image API
      fetch-image/        # URL image fetcher
      download/           # Image download handler
  components/
    ImageUpload.tsx       # Drag/drop image upload
    TransformationModeSelector.tsx
    StyleStrengthSlider.tsx
    PreserveOptions.tsx
    ComparisonView.tsx    # Before/after comparison
  lib/
    providers/            # AI provider integrations
    prompt.ts             # Prompt generation
    brand.ts              # Brand configuration
```

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Stability AI API (Image-to-Image)
- OpenAI DALL-E 3 API
- Replicate API
- Sharp (image processing)

## License

Private - All rights reserved
