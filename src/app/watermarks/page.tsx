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
  Droplets,
} from 'lucide-react';
import '@/ui/styles/index.css';

type WatermarkColor = 'white' | 'black' | 'custom';

interface WatermarkResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Convert all visible (non-transparent) pixels in an image to a target colour,
 * preserving original alpha. Returns a PNG data URL.
 */
function convertToSolidColor(
  sourceDataUrl: string,
  hexColor: string,
): Promise<WatermarkResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Parse hex colour → RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      // Replace every pixel's colour while preserving alpha
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          // alpha stays as-is
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = sourceDataUrl;
  });
}

export default function WatermarksPage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options
  const [colorMode, setColorMode] = useState<WatermarkColor>('white');
  const [customColor, setCustomColor] = useState('#0ea5e9');

  // Result
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<WatermarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveColor =
    colorMode === 'white' ? '#ffffff' : colorMode === 'black' ? '#000000' : customColor;

  // ---- File handling ----

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WebP, SVG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setError(null);
      setResult(null);
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
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ---- Convert ----

  const handleConvert = useCallback(async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await convertToSolidColor(uploadedImage, effectiveColor);
      setResult(res);
    } catch (err) {
      console.error('Watermark conversion error:', err);
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setProcessing(false);
    }
  }, [uploadedImage, effectiveColor]);

  // Auto-convert when image changes or color changes (if we already have an image)
  // We do this explicitly via button click for clarity.

  // ---- Download ----

  const handleDownload = useCallback(() => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = `watermark-${colorMode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result, colorMode]);

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
              {/* Left: Upload + Options */}
              <div className={styles.uploadPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>
                    <Upload size={18} />
                    Upload Image
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
                        src={uploadedImage}
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

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className={styles.hiddenInput}
                />

                {/* Color Selection */}
                <div className={styles.colorSection}>
                  <div className={styles.sectionTitle}>Watermark Color</div>
                  <div className={styles.colorOptions}>
                    <button
                      className={`${styles.colorOption} ${colorMode === 'white' ? styles.active : ''}`}
                      onClick={() => setColorMode('white')}
                    >
                      <span className={styles.colorSwatch} style={{ background: '#ffffff' }} />
                      White
                    </button>
                    <button
                      className={`${styles.colorOption} ${colorMode === 'black' ? styles.active : ''}`}
                      onClick={() => setColorMode('black')}
                    >
                      <span className={styles.colorSwatch} style={{ background: '#000000' }} />
                      Black
                    </button>
                    <button
                      className={`${styles.colorOption} ${colorMode === 'custom' ? styles.active : ''}`}
                      onClick={() => setColorMode('custom')}
                    >
                      <span className={styles.colorSwatch} style={{ background: customColor }} />
                      Custom
                    </button>
                  </div>
                  {colorMode === 'custom' && (
                    <div className={styles.customColorRow}>
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className={styles.customColorInput}
                      />
                      <input
                        type="text"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        className={styles.customColorText}
                      />
                    </div>
                  )}
                </div>

                {/* Convert Button */}
                <div style={{ marginTop: '1.25rem' }}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleConvert}
                    disabled={!uploadedImage || processing}
                    isLoading={processing}
                    leftIcon={<Droplets size={16} />}
                    style={{ width: '100%' }}
                  >
                    {processing ? 'Converting...' : 'Convert to Watermark'}
                  </Button>
                </div>

                {/* Info */}
                <div className={styles.infoBox}>
                  Converts all visible pixels to a solid colour while preserving transparency.
                  For best results, use a PNG or SVG with a transparent background.
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
              </div>

              {/* Right: Results Preview */}
              <div className={styles.resultsPanel}>
                {processing ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <span className={styles.loadingText}>Converting image...</span>
                  </div>
                ) : result ? (
                  <>
                    <div className={styles.resultsHeader}>
                      <h2 className={styles.resultsTitle}>Watermark Preview</h2>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownload}
                        leftIcon={<Download size={14} />}
                      >
                        Download PNG
                      </Button>
                    </div>

                    <div className={styles.previewGrid}>
                      <div className={styles.previewCard}>
                        <div className={`${styles.previewImageArea} ${styles.dark}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={result.dataUrl} alt="Preview on dark" />
                        </div>
                        <div className={styles.previewLabel}>
                          <span className={styles.previewLabelName}>Dark Background</span>
                          <span>#0a0a0f</span>
                        </div>
                      </div>

                      <div className={styles.previewCard}>
                        <div className={`${styles.previewImageArea} ${styles.light}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={result.dataUrl} alt="Preview on light" />
                        </div>
                        <div className={styles.previewLabel}>
                          <span className={styles.previewLabelName}>Light Background</span>
                          <span>#ffffff</span>
                        </div>
                      </div>

                      <div className={styles.previewCard}>
                        <div className={`${styles.previewImageArea} ${styles.checkerboard}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={result.dataUrl} alt="Preview on transparent" />
                        </div>
                        <div className={styles.previewLabel}>
                          <span className={styles.previewLabelName}>Transparent</span>
                          <span>PNG alpha</span>
                        </div>
                      </div>

                      <div className={styles.previewCard}>
                        <div className={`${styles.previewImageArea} ${styles.brand}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={result.dataUrl} alt="Preview on brand" />
                        </div>
                        <div className={styles.previewLabel}>
                          <span className={styles.previewLabelName}>Brand Color</span>
                          <span>#0ea5e9</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.dimensionsInfo}>
                      {result.width} x {result.height}px &middot; PNG with transparency
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <Droplets size={64} />
                    <p className={styles.emptyStateText}>No watermark generated yet</p>
                    <p className={styles.emptyStateHint}>
                      Upload an image and click Convert to create a watermark
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
