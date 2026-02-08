'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';

import { Button } from '@/ui/components/Button/Button';
import { UserMenu } from '@/components/UserMenu';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { IconGeneratorSidebar } from '@/components/IconGeneratorSidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  Download,
  X,
  Image as ImageIcon,
  Package,
  Crop,
} from 'lucide-react';
import '@/ui/styles/index.css';

interface CropBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GeneratedIcon {
  dataUrl: string;
  width: number;
  height: number;
}

interface IconGenerationResult {
  icons: Record<string, GeneratedIcon>;
  detected_bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: {
    mode: 'auto' | 'square';
    padding: number;
    background: string;
    originalSize: string;
  };
}

export default function IconsPage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();

  // Form state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [mode, setMode] = useState<'auto' | 'square' | 'manual'>('auto');
  const [padding, setPadding] = useState(10);
  const [background, setBackground] = useState<'transparent' | 'white' | 'black'>('transparent');
  const [isDragging, setIsDragging] = useState(false);

  // Crop selection state
  const [cropBounds, setCropBounds] = useState<CropBounds | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IconGenerationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load image dimensions when image is uploaded
  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        // Reset crop when new image is uploaded
        setCropBounds(null);
      };
      img.src = uploadedImage;
    } else {
      setImageSize(null);
      setCropBounds(null);
    }
  }, [uploadedImage]);

  // Handle crop selection
  const handleCropMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'manual' || !cropContainerRef.current) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsCropping(true);
    setCropStart({ x, y });
    setCropBounds({ x, y, width: 0, height: 0 });
  }, [mode]);

  const handleCropMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStart || !cropContainerRef.current) return;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    // Calculate bounds (handle dragging in any direction)
    const x = Math.min(cropStart.x, currentX);
    const y = Math.min(cropStart.y, currentY);
    const width = Math.abs(currentX - cropStart.x);
    const height = Math.abs(currentY - cropStart.y);

    // Make it square (use the smaller dimension)
    const size = Math.min(width, height);

    setCropBounds({ x, y, width: size, height: size });
  }, [isCropping, cropStart]);

  const handleCropMouseUp = useCallback(() => {
    setIsCropping(false);
    setCropStart(null);
  }, []);

  // Convert display bounds to actual image bounds
  const getActualBounds = useCallback((): CropBounds | null => {
    if (!cropBounds || !cropContainerRef.current || !imageSize) return null;

    const rect = cropContainerRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    return {
      x: Math.round(cropBounds.x * scaleX),
      y: Math.round(cropBounds.y * scaleY),
      width: Math.round(cropBounds.width * scaleX),
      height: Math.round(cropBounds.height * scaleY),
    };
  }, [cropBounds, imageSize]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, etc.)');
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

  // Handle drag and drop
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
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Remove uploaded image
  const handleRemoveImage = useCallback(() => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Generate icons
  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    // For manual mode, require a crop selection
    if (mode === 'manual') {
      const actualBounds = getActualBounds();
      if (!actualBounds || actualBounds.width < 10) {
        setError('Please draw a selection box around the icon area first');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Build request body
      const requestBody: Record<string, unknown> = {
        image: uploadedImage,
        mode: mode === 'manual' ? 'square' : mode, // Manual uses square mode with bounds
        padding,
        background,
      };

      // Add bounds for manual mode
      if (mode === 'manual') {
        const actualBounds = getActualBounds();
        if (actualBounds) {
          requestBody.bounds = actualBounds;
        }
      }

      const response = await fetch('/api/generate-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error?.message || 'Failed to generate icons');
      }
    } catch (err) {
      console.error('Icon generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Download single icon
  const handleDownloadIcon = (name: string, dataUrl: string) => {
    const extension = name.includes('ico') ? 'ico' : 'png';
    const filename = `${name}.${extension}`;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all icons as individual files
  const handleDownloadAll = async () => {
    if (!result?.icons) return;

    for (const [name, icon] of Object.entries(result.icons)) {
      handleDownloadIcon(name, icon.dataUrl);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  // Get icon display name
  const getIconDisplayName = (name: string): string => {
    if (name === 'favicon-ico') return 'favicon.ico';
    return `${name}.png`;
  };

  // Check if icon is maskable
  const isMaskable = (name: string): boolean => name.startsWith('maskable');

  // Redirect to login when not authenticated
  if (!authLoading && !isLoggedIn) {
    router.push('/login');
    return null;
  }

  // Show loading state while checking auth
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
        {/* Sidebar */}
        <IconGeneratorSidebar
          mode={mode}
          onModeChange={setMode}
          padding={padding}
          onPaddingChange={setPadding}
          background={background}
          onBackgroundChange={setBackground}
          onGenerate={handleGenerate}
          canGenerate={!!uploadedImage}
          isLoading={loading}
        />

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.contentGrid}>
              {/* Upload Panel */}
              <div className={styles.uploadPanel}>
                <div className={styles.panelHeader}>
                  <h2 className={styles.panelTitle}>
                    <Upload size={18} />
                    Upload Logo
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
                      <div
                        ref={cropContainerRef}
                        style={{
                          position: 'relative',
                          cursor: mode === 'manual' ? 'crosshair' : 'default',
                          userSelect: 'none',
                        }}
                        onMouseDown={handleCropMouseDown}
                        onMouseMove={handleCropMouseMove}
                        onMouseUp={handleCropMouseUp}
                        onMouseLeave={handleCropMouseUp}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={uploadedImage}
                          alt="Uploaded logo"
                          className={styles.uploadPreview}
                          draggable={false}
                        />
                        {/* Crop selection overlay */}
                        {mode === 'manual' && cropBounds && cropBounds.width > 0 && (
                          <>
                            {/* Darkened areas outside selection */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: `${cropBounds.y}px`,
                                background: 'rgba(0, 0, 0, 0.6)',
                                pointerEvents: 'none',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: `${cropBounds.y}px`,
                                left: 0,
                                width: `${cropBounds.x}px`,
                                height: `${cropBounds.height}px`,
                                background: 'rgba(0, 0, 0, 0.6)',
                                pointerEvents: 'none',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: `${cropBounds.y}px`,
                                left: `${cropBounds.x + cropBounds.width}px`,
                                right: 0,
                                height: `${cropBounds.height}px`,
                                background: 'rgba(0, 0, 0, 0.6)',
                                pointerEvents: 'none',
                              }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                top: `${cropBounds.y + cropBounds.height}px`,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0, 0, 0, 0.6)',
                                pointerEvents: 'none',
                              }}
                            />
                            {/* Selection border */}
                            <div
                              style={{
                                position: 'absolute',
                                top: `${cropBounds.y}px`,
                                left: `${cropBounds.x}px`,
                                width: `${cropBounds.width}px`,
                                height: `${cropBounds.height}px`,
                                border: '2px dashed #0ea5e9',
                                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3)',
                                pointerEvents: 'none',
                              }}
                            />
                          </>
                        )}
                        {/* Manual mode hint */}
                        {mode === 'manual' && !cropBounds && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              background: 'rgba(0, 0, 0, 0.7)',
                              padding: '12px 20px',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              pointerEvents: 'none',
                            }}
                          >
                            <Crop size={16} />
                            Click and drag to select icon area
                          </div>
                        )}
                      </div>
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
                        Drop your logo here or click to browse
                      </p>
                      <p className={styles.uploadHint}>PNG, JPG, or SVG (max 10MB)</p>
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

                {error && <div className={styles.errorMessage}>{error}</div>}

                {/* Show manual crop bounds */}
                {mode === 'manual' && cropBounds && cropBounds.width > 0 && (
                  <div className={styles.boundsInfo}>
                    <div className={styles.boundsLabel}>Selected Icon Bounds</div>
                    {(() => {
                      const actual = getActualBounds();
                      return actual
                        ? `x: ${actual.x}, y: ${actual.y}, ${actual.width}x${actual.height}px`
                        : 'Calculating...';
                    })()}
                    <button
                      onClick={() => setCropBounds(null)}
                      style={{
                        marginLeft: '12px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Show detected bounds from auto mode */}
                {result?.detected_bounds && mode === 'auto' && (
                  <div className={styles.boundsInfo}>
                    <div className={styles.boundsLabel}>Detected Icon Bounds</div>
                    x: {result.detected_bounds.x}, y: {result.detected_bounds.y},{' '}
                    {result.detected_bounds.width}x{result.detected_bounds.height}px
                  </div>
                )}
              </div>

              {/* Results Panel */}
              <div className={styles.resultsPanel}>
                {loading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.spinner} />
                    <span className={styles.loadingText}>
                      {mode === 'auto'
                        ? 'Detecting icon and generating sizes...'
                        : 'Generating icon sizes...'}
                    </span>
                  </div>
                ) : result?.icons ? (
                  <>
                    <div className={styles.resultsHeader}>
                      <h2 className={styles.resultsTitle}>
                        Generated Icons ({Object.keys(result.icons).length})
                      </h2>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDownloadAll}
                        leftIcon={<Download size={14} />}
                        className={styles.downloadAllButton}
                      >
                        Download All
                      </Button>
                    </div>

                    <div className={styles.iconsGrid}>
                      {Object.entries(result.icons).map(([name, icon]) => (
                        <div key={name} className={styles.iconCard}>
                          <div className={styles.iconPreview}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={icon.dataUrl} alt={name} />
                          </div>
                          <div className={styles.iconInfo}>
                            <div className={styles.iconName}>{getIconDisplayName(name)}</div>
                            <div className={styles.iconSize}>
                              {icon.width}x{icon.height}
                            </div>
                            {isMaskable(name) && (
                              <span className={styles.maskableBadge}>Maskable</span>
                            )}
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownloadIcon(name, icon.dataUrl)}
                            className={styles.iconDownload}
                          >
                            <Download size={12} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyState}>
                    <Package size={64} />
                    <p className={styles.emptyStateText}>No icons generated yet</p>
                    <p className={styles.emptyStateHint}>
                      Upload a logo and click Generate to create PWA icons
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
