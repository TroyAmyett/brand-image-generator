'use client';

import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import '@/ui/styles/index.css';

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
  const [mode, setMode] = useState<'auto' | 'square'>('auto');
  const [padding, setPadding] = useState(10);
  const [background, setBackground] = useState<'transparent' | 'white' | 'black'>('transparent');
  const [isDragging, setIsDragging] = useState(false);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IconGenerationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-icons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          mode,
          padding,
          background,
        }),
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImage}
                        alt="Uploaded logo"
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

                {result?.detected_bounds && (
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
