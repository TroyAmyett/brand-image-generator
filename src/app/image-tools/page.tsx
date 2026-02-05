'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { Button } from '@/ui/components/Button/Button';
import { UserMenu } from '@/components/UserMenu';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  Download,
  X,
  Image as ImageIcon,
  Scissors,
  Lock,
  Unlock,
  Eraser,
  Expand,
} from 'lucide-react';
import { getApiKey } from '@/lib/apiKeyStorage';
import '@/ui/styles/index.css';

// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------

interface SizePreset {
  label: string;
  w: number;
  h: number;
}

const PRESET_GROUPS: { name: string; presets: SizePreset[] }[] = [
  {
    name: 'Logo Export',
    presets: [
      { label: '2048×440 Wordmark', w: 2048, h: 440 },
      { label: '1024×220 Wordmark', w: 1024, h: 220 },
      { label: '1024×1024 Icon', w: 1024, h: 1024 },
      { label: '512×512 Icon', w: 512, h: 512 },
    ],
  },
  {
    name: 'Favicon / App',
    presets: [
      { label: '16×16', w: 16, h: 16 },
      { label: '32×32', w: 32, h: 32 },
      { label: '48×48', w: 48, h: 48 },
      { label: '64×64', w: 64, h: 64 },
      { label: '128×128', w: 128, h: 128 },
      { label: '180×180', w: 180, h: 180 },
      { label: '192×192', w: 192, h: 192 },
    ],
  },
  {
    name: 'Social / Profile',
    presets: [
      { label: '400×400', w: 400, h: 400 },
      { label: '800×800', w: 800, h: 800 },
    ],
  },
  {
    name: 'Banner / OG',
    presets: [
      { label: '1200×630', w: 1200, h: 630 },
      { label: '1200×675', w: 1200, h: 675 },
      { label: '1500×500', w: 1500, h: 500 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Extend canvas (outpaint) aspect ratio presets
// ---------------------------------------------------------------------------

interface ExtendPreset {
  id: string;
  label: string;
  ratioW: number;
  ratioH: number;
}

const EXTEND_PRESETS: ExtendPreset[] = [
  { id: '16:9', label: '16:9 Landscape', ratioW: 16, ratioH: 9 },
  { id: '4:3', label: '4:3 Landscape', ratioW: 4, ratioH: 3 },
  { id: '1:1', label: '1:1 Square', ratioW: 1, ratioH: 1 },
  { id: '3:4', label: '3:4 Portrait', ratioW: 3, ratioH: 4 },
  { id: '9:16', label: '9:16 Portrait', ratioW: 9, ratioH: 16 },
];

/**
 * Calculate how many pixels to add on each side to reach the target aspect ratio.
 * Keeps the original image fully visible — only adds canvas, never crops.
 */
function calcExtensions(
  srcW: number,
  srcH: number,
  targetRatioW: number,
  targetRatioH: number,
): { left: number; right: number; top: number; bottom: number; newW: number; newH: number } {
  const targetRatio = targetRatioW / targetRatioH;
  const srcRatio = srcW / srcH;

  let newW = srcW;
  let newH = srcH;

  if (srcRatio < targetRatio) {
    // Need to widen (add left+right)
    newW = Math.round(srcH * targetRatio);
    newH = srcH;
  } else if (srcRatio > targetRatio) {
    // Need to heighten (add top+bottom)
    newW = srcW;
    newH = Math.round(srcW / targetRatio);
  }

  const totalHoriz = Math.max(0, newW - srcW);
  const totalVert = Math.max(0, newH - srcH);

  return {
    left: Math.floor(totalHoriz / 2),
    right: Math.ceil(totalHoriz / 2),
    top: Math.floor(totalVert / 2),
    bottom: Math.ceil(totalVert / 2),
    newW,
    newH,
  };
}

// ---------------------------------------------------------------------------
// Image helpers
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Remove a solid-colour background via color-keying.
 * Any pixel within `tolerance` of the target colour becomes fully transparent.
 * Anti-aliased edges get proportional alpha so the result looks clean.
 */
async function removeColorBackground(
  dataUrl: string,
  hexColor: string,
  tolerance: number,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Parse target colour
  const tr = parseInt(hexColor.slice(1, 3), 16);
  const tg = parseInt(hexColor.slice(3, 5), 16);
  const tb = parseInt(hexColor.slice(5, 7), 16);

  for (let i = 0; i < data.length; i += 4) {
    const dr = Math.abs(data[i] - tr);
    const dg = Math.abs(data[i + 1] - tg);
    const db = Math.abs(data[i + 2] - tb);
    const dist = Math.max(dr, dg, db); // channel-max distance

    if (dist <= tolerance) {
      // Fully within tolerance → transparent
      data[i + 3] = 0;
    } else if (dist <= tolerance + 30) {
      // Feather zone — proportional alpha for anti-aliased edges
      const factor = (dist - tolerance) / 30;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Auto-detect the background colour by sampling corner pixels.
 */
async function detectBgColor(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#ffffff';

  ctx.drawImage(img, 0, 0);

  // Sample 4 corners (2px inset)
  const corners = [
    ctx.getImageData(2, 2, 1, 1).data,
    ctx.getImageData(img.width - 3, 2, 1, 1).data,
    ctx.getImageData(2, img.height - 3, 1, 1).data,
    ctx.getImageData(img.width - 3, img.height - 3, 1, 1).data,
  ];

  // Average the corner colours
  let r = 0, g = 0, b = 0;
  for (const c of corners) {
    r += c[0]; g += c[1]; b += c[2];
  }
  r = Math.round(r / 4);
  g = Math.round(g / 4);
  b = Math.round(b / 4);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Resize an image to target dimensions using high-quality Canvas scaling.
 * Preserves transparency (outputs PNG).
 */
async function resizeImage(
  dataUrl: string,
  targetW: number,
  targetH: number,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL('image/png');
}

/**
 * Downscale an image so the resulting outpainted canvas stays under 4 megapixels
 * and no single extension exceeds 2048px.
 */
async function prepareForOutpaint(
  dataUrl: string,
  ext: { left: number; right: number; top: number; bottom: number; newW: number; newH: number },
): Promise<{ dataUrl: string; w: number; h: number; left: number; right: number; top: number; bottom: number }> {
  const img = await loadImage(dataUrl);
  let w = img.width;
  let h = img.height;
  let { left, right, top, bottom, newW, newH } = ext;

  // Scale down if resulting image would exceed 4MP or any extension exceeds 2048
  const maxPixels = 4_000_000;
  const maxExt = 2048;

  let scale = 1;
  if (newW * newH > maxPixels) {
    scale = Math.sqrt(maxPixels / (newW * newH));
  }
  if (left > maxExt) scale = Math.min(scale, maxExt / left);
  if (right > maxExt) scale = Math.min(scale, maxExt / right);
  if (top > maxExt) scale = Math.min(scale, maxExt / top);
  if (bottom > maxExt) scale = Math.min(scale, maxExt / bottom);

  if (scale < 1) {
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    left = Math.round(left * scale);
    right = Math.round(right * scale);
    top = Math.round(top * scale);
    bottom = Math.round(bottom * scale);

    const resized = await resizeImage(dataUrl, w, h);
    return { dataUrl: resized, w, h, left, right, top, bottom };
  }

  return { dataUrl, w, h, left, right, top, bottom };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ImageToolsPage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();

  // Upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalW, setOriginalW] = useState(0);
  const [originalH, setOriginalH] = useState(0);

  // Working image (after bg removal / extend)
  const [workingImage, setWorkingImage] = useState<string | null>(null);
  const [workingW, setWorkingW] = useState(0);
  const [workingH, setWorkingH] = useState(0);
  const [bgRemoved, setBgRemoved] = useState(false);

  // Color-key background removal
  const [bgColor, setBgColor] = useState('#ffffff');
  const [bgTolerance, setBgTolerance] = useState(40);

  // Extend canvas
  const [extendPreset, setExtendPreset] = useState<string>('16:9');
  const [extendCreativity, setExtendCreativity] = useState(0.25);
  const [extending, setExtending] = useState(false);

  // Resize
  const [targetW, setTargetW] = useState(512);
  const [targetH, setTargetH] = useState(512);
  const [lockAspect, setLockAspect] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>('512×512');

  // Result
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultW, setResultW] = useState(0);
  const [resultH, setResultH] = useState(0);

  // UI state
  const [removingBg, setRemovingBg] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Helpers ----

  const updateWorkingDimensions = useCallback(async (dataUrl: string) => {
    try {
      const img = await loadImage(dataUrl);
      setWorkingW(img.width);
      setWorkingH(img.height);
    } catch {
      // non-critical
    }
  }, []);

  // ---- File handling ----

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImage(dataUrl);
      setWorkingImage(dataUrl);
      setBgRemoved(false);
      setResultImage(null);
      setError(null);

      try {
        const img = await loadImage(dataUrl);
        setOriginalW(img.width);
        setOriginalH(img.height);
        setWorkingW(img.width);
        setWorkingH(img.height);
        // Auto-detect background colour from corner pixels
        const detected = await detectBgColor(dataUrl);
        setBgColor(detected);
      } catch {
        // non-critical
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setWorkingImage(null);
    setResultImage(null);
    setBgRemoved(false);
    setError(null);
    setOriginalW(0);
    setOriginalH(0);
    setWorkingW(0);
    setWorkingH(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ---- Remove background (color-key, client-side) ----

  const handleRemoveBg = useCallback(async () => {
    const source = workingImage || uploadedImage;
    if (!source) return;

    setRemovingBg(true);
    setError(null);

    try {
      const result = await removeColorBackground(source, bgColor, bgTolerance);
      setWorkingImage(result);
      setBgRemoved(true);
      setResultImage(null);
      await updateWorkingDimensions(result);
    } catch (err) {
      console.error('Remove bg error:', err);
      setError(err instanceof Error ? err.message : 'Background removal failed');
    } finally {
      setRemovingBg(false);
    }
  }, [workingImage, uploadedImage, bgColor, bgTolerance, updateWorkingDimensions]);

  // Auto-detect background colour when image is loaded
  const handleAutoDetectBg = useCallback(async () => {
    const source = workingImage || uploadedImage;
    if (!source) return;
    try {
      const detected = await detectBgColor(source);
      setBgColor(detected);
    } catch {
      // non-critical
    }
  }, [workingImage, uploadedImage]);

  // ---- Extend canvas (outpaint) ----

  const handleExtendCanvas = useCallback(async () => {
    const source = workingImage || uploadedImage;
    if (!source || workingW === 0 || workingH === 0) return;

    const preset = EXTEND_PRESETS.find((p) => p.id === extendPreset);
    if (!preset) return;

    const ext = calcExtensions(workingW, workingH, preset.ratioW, preset.ratioH);

    if (ext.left === 0 && ext.right === 0 && ext.top === 0 && ext.bottom === 0) {
      setError('Image already matches the selected aspect ratio.');
      return;
    }

    setExtending(true);
    setError(null);

    try {
      // Downscale if needed to stay within API limits
      const prepared = await prepareForOutpaint(source, ext);

      const userKey = await getApiKey('stability');
      const response = await fetch('/api/outpaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: prepared.dataUrl,
          left: prepared.left,
          right: prepared.right,
          top: prepared.top,
          bottom: prepared.bottom,
          creativity: extendCreativity,
          output_format: 'png',
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.imageBase64) {
        setWorkingImage(data.imageBase64);
        setResultImage(null);
        await updateWorkingDimensions(data.imageBase64);
      } else {
        setError(data.error?.message || 'Outpainting failed');
      }
    } catch (err) {
      console.error('Extend canvas error:', err);
      setError(err instanceof Error ? err.message : 'Extend canvas failed');
    } finally {
      setExtending(false);
    }
  }, [workingImage, uploadedImage, workingW, workingH, extendPreset, extendCreativity, updateWorkingDimensions]);

  // ---- Resize ----

  const handleResize = useCallback(async () => {
    const source = workingImage || uploadedImage;
    if (!source) return;

    if (targetW < 1 || targetH < 1 || targetW > 8192 || targetH > 8192) {
      setError('Dimensions must be between 1 and 8192 pixels');
      return;
    }

    setResizing(true);
    setError(null);

    try {
      const result = await resizeImage(source, targetW, targetH);
      setResultImage(result);
      setResultW(targetW);
      setResultH(targetH);
    } catch (err) {
      console.error('Resize error:', err);
      setError(err instanceof Error ? err.message : 'Resize failed');
    } finally {
      setResizing(false);
    }
  }, [workingImage, uploadedImage, targetW, targetH]);

  // ---- Preset click ----

  const handlePresetClick = (preset: SizePreset) => {
    setTargetW(preset.w);
    setTargetH(preset.h);
    setActivePreset(preset.label);
    setLockAspect(false);
  };

  // ---- Dimension change with aspect lock ----

  const handleWidthChange = (w: number) => {
    setTargetW(w);
    setActivePreset(null);
    if (lockAspect && workingW > 0 && workingH > 0) {
      setTargetH(Math.round((w / workingW) * workingH));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetH(h);
    setActivePreset(null);
    if (lockAspect && workingW > 0 && workingH > 0) {
      setTargetW(Math.round((h / workingH) * workingW));
    }
  };

  // ---- Download ----

  const handleDownload = useCallback(
    (dataUrl: string, filename: string) => {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [],
  );

  const handleDownloadWorking = useCallback(() => {
    if (!workingImage) return;
    const suffix = bgRemoved ? 'transparent' : 'original';
    handleDownload(workingImage, `image-${suffix}.png`);
  }, [workingImage, bgRemoved, handleDownload]);

  // ---- Computed: extension preview ----

  const selectedExtend = EXTEND_PRESETS.find((p) => p.id === extendPreset);
  const extPreview =
    selectedExtend && workingW > 0 && workingH > 0
      ? calcExtensions(workingW, workingH, selectedExtend.ratioW, selectedExtend.ratioH)
      : null;

  const needsExtension = extPreview
    ? extPreview.left > 0 || extPreview.right > 0 || extPreview.top > 0 || extPreview.bottom > 0
    : false;

  // ---- Auth guard ----

  if (!authLoading && !isLoggedIn) {
    router.push('/login');
    return null;
  }

  if (authLoading) {
    return (
      <div className={styles.appLayout}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Loading...</span>
        </div>
      </div>
    );
  }

  const hasImage = !!uploadedImage;
  const displayImage = resultImage || workingImage || uploadedImage;
  const isBusy = removingBg || extending || resizing;

  return (
    <div className={styles.appLayout}>
      <AppHeader
        toolSwitcher={<CanvasToolNav />}
        settingsButton={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserMenu />
          </div>
        }
      />

      <div className={styles.mainLayout}>
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              {/* Left: Upload + Controls */}
              <div className={styles.uploadPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>
                    <Scissors size={18} />
                    Image Tools
                  </h2>
                </div>

                <div
                  className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${
                    uploadedImage ? styles.hasImage : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploadedImage && fileInputRef.current?.click()}
                >
                  {uploadedImage ? (
                    <div className={styles.uploadPreviewContainer}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={workingImage || uploadedImage}
                        alt="Uploaded image"
                        className={styles.uploadPreview}
                      />
                      <button
                        className={styles.removeImageButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <ImageIcon size={48} className={styles.uploadIcon} />
                      <p className={styles.uploadText}>
                        Drop your image here or click to browse
                      </p>
                      <p className={styles.uploadHint}>PNG, JPG, WebP, or SVG</p>
                    </>
                  )}
                </div>

                {workingW > 0 && (
                  <div className={styles.imageDimensions}>
                    {workingW} × {workingH}px
                    {bgRemoved && ' · Transparent'}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className={styles.hiddenInput}
                />

                {/* Remove Background */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>1. Remove Background</div>
                  <p className={styles.sectionDesc}>
                    Color-key removal — picks the background colour and makes it transparent.
                    Works best for logos with solid-colour backgrounds.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className={styles.dimInput}
                      style={{ flex: 1, textAlign: 'left' }}
                    />
                    <button
                      className={styles.presetChip}
                      onClick={() => setBgColor('#ffffff')}
                      style={bgColor === '#ffffff' ? { borderColor: '#0ea5e9', color: '#0ea5e9' } : {}}
                    >
                      White
                    </button>
                    <button
                      className={styles.presetChip}
                      onClick={() => setBgColor('#000000')}
                      style={bgColor === '#000000' ? { borderColor: '#0ea5e9', color: '#0ea5e9' } : {}}
                    >
                      Black
                    </button>
                    {hasImage && (
                      <button
                        className={styles.presetChip}
                        onClick={handleAutoDetectBg}
                        title="Auto-detect from corner pixels"
                      >
                        Auto
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      Tolerance: {bgTolerance} (higher = more aggressive)
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={120}
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#0ea5e9', marginTop: '4px' }}
                    />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRemoveBg}
                    disabled={!hasImage || isBusy}
                    isLoading={removingBg}
                    leftIcon={<Eraser size={14} />}
                    style={{ width: '100%' }}
                  >
                    {removingBg
                      ? 'Removing...'
                      : bgRemoved
                        ? 'Re-run with different settings'
                        : 'Remove Background'}
                  </Button>
                </div>

                {/* Extend Canvas */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>2. Extend Canvas</div>
                  <p className={styles.sectionDesc}>
                    AI-fill to reach a target aspect ratio. Keeps the original image intact
                    and generates matching content around it.
                  </p>
                  <div className={styles.presetChips}>
                    {EXTEND_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        className={`${styles.presetChip} ${extendPreset === p.id ? styles.active : ''}`}
                        onClick={() => setExtendPreset(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {extPreview && needsExtension && (
                    <div className={styles.sectionDesc} style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      +{extPreview.left + extPreview.right}px wide, +{extPreview.top + extPreview.bottom}px tall
                      → {extPreview.newW}×{extPreview.newH}
                    </div>
                  )}

                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                      Creativity: {extendCreativity.toFixed(2)} (lower = more faithful)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={extendCreativity}
                      onChange={(e) => setExtendCreativity(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#0ea5e9', marginTop: '4px' }}
                    />
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExtendCanvas}
                    disabled={!hasImage || isBusy || !needsExtension}
                    isLoading={extending}
                    leftIcon={<Expand size={14} />}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {extending
                      ? 'Extending...'
                      : !needsExtension && hasImage
                        ? 'Already matches ratio'
                        : 'Extend Canvas'}
                  </Button>
                </div>

                {/* Resize */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>3. Resize</div>

                  {PRESET_GROUPS.map((group) => (
                    <div key={group.name} className={styles.presetGroup}>
                      <div className={styles.presetGroupLabel}>{group.name}</div>
                      <div className={styles.presetChips}>
                        {group.presets.map((p) => (
                          <button
                            key={p.label}
                            className={`${styles.presetChip} ${activePreset === p.label ? styles.active : ''}`}
                            onClick={() => handlePresetClick(p)}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className={styles.customDimensions}>
                    <input
                      type="number"
                      value={targetW}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className={styles.dimInput}
                      min={1}
                      max={8192}
                    />
                    <span className={styles.dimSeparator}>×</span>
                    <input
                      type="number"
                      value={targetH}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className={styles.dimInput}
                      min={1}
                      max={8192}
                    />
                    <span className={styles.dimSeparator}>px</span>
                    <button
                      className={`${styles.lockButton} ${lockAspect ? styles.active : ''}`}
                      onClick={() => setLockAspect(!lockAspect)}
                      title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                    >
                      {lockAspect ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                </div>

                {/* Resize Button */}
                <div style={{ marginTop: '1.25rem' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleResize}
                    disabled={!hasImage || isBusy}
                    isLoading={resizing}
                    leftIcon={<Scissors size={16} />}
                    style={{ width: '100%' }}
                  >
                    {resizing ? 'Resizing...' : `Resize to ${targetW}×${targetH}`}
                  </Button>
                </div>

                <div className={styles.infoBox}>
                  Upload a logo or image. Each step is optional — remove background, extend the
                  canvas to a new aspect ratio with AI fill, then resize to final dimensions. Output
                  is always PNG with transparency preserved.
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
              </div>

              {/* Right: Preview */}
              <div className={styles.resultsPanel}>
                {(removingBg || extending) ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <span className={styles.loadingText}>
                      {removingBg ? 'Removing background...' : 'Extending canvas...'}
                    </span>
                    {extending && (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                        This may take up to 30 seconds
                      </p>
                    )}
                  </div>
                ) : displayImage ? (
                  <>
                    <div className={styles.resultsHeader}>
                      <h2 className={styles.resultsTitle}>
                        {resultImage ? 'Resized Result' : bgRemoved ? 'Transparent' : 'Preview'}
                      </h2>
                      <div className={styles.headerButtons}>
                        {workingImage && !resultImage && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleDownloadWorking}
                            leftIcon={<Download size={14} />}
                          >
                            Download
                          </Button>
                        )}
                        {resultImage && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                resultImage,
                                `image-${resultW}x${resultH}.png`,
                              )
                            }
                            leftIcon={<Download size={14} />}
                          >
                            Download {resultW}×{resultH}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className={styles.previewArea}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={displayImage} alt="Preview" />
                    </div>

                    {resultImage ? (
                      <div className={styles.resultInfo}>
                        {resultW} × {resultH}px · PNG with transparency
                      </div>
                    ) : workingW > 0 && (
                      <div className={styles.resultInfo}>
                        {workingW} × {workingH}px
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <Scissors size={64} />
                    <p className={styles.emptyStateText}>No image loaded</p>
                    <p className={styles.emptyStateHint}>
                      Upload an image to get started with background removal, canvas extension, and resizing
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
