# Project Backlog

## 🟢 Active (Current Focus)

- [ ] **UI Polish**: enhance the loading states and image display (using the generated image tool for assets if needed).
- [ ] **Error Handling**: Add robust error messages for API failures or credit limits.

## 🟡 Planned (Next Up)

- [ ] **History View**: Show a list of previously generated images.
- [ ] **Client-Specific Prompts & Styles**:
  - Create a toggle/dropdown to select specific Client Profiles.
  - Implement **CRUD** (Upload, Save, Update, Delete) for Client-specific styles and common instructions.
  - Tie instructions to specific Users/Accounts.
  - **Admin Dashboard**: Allow Admins to manage and view all Client Styles across the platform.

## 🧊 Icebox (Ideas/Future)

- [ ] **Ingest Style Guide**: Settings feature to upload an image or URL and automatically generate a custom Style Guide.
- [ ] **Upload Example Image**: Frontend option to upload an image as a base/reference for generation (Image-to-Image).
- [ ] **User Settings (Style Guide)**: Allow users to enter/customize their own style guide for generation.
- [ ] **User Settings (Image Generator APIs)**: Support multiple providers (OpenAI, Midjourney, etc) with a dropdown selector (Default: OpenAI).
- [ ] **User Authentication**: Allow users to save their generated images.

## ✅ Completed

- [x] **Project Initialization**: Next.js app bootstrapped.
- [x] **Integrate OpenAI DALL-E 3 API**: implemented in `src/app/api/generate/route.ts` and connected to UI.
- [x] **Configure Environment Variables**: Created `.env.local`.
- [x] **Deploy to Vercel**: Live and running.
- [x] **Lightbox Preview**: Click image to view full-size before download.
- [x] **Download / Export**: Download button for generated assets.
- [x] **Image Revision**: Revise generated images with text instructions.
