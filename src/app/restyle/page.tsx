'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { UserMenu } from '@/components/UserMenu';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/ui/components/Button/Button';
import { ImageLightbox } from '@/ui/components/ImageLightbox';
import {
  RefreshCw,
  Upload,
  FolderOpen,
  User,
  Wand2,
  Download,
} from 'lucide-react';
import { SETTING_OPTIONS, ASPECT_RATIO_OPTIONS } from '@/lib/characterPrompt';
import type { AspectRatio } from '@/lib/characterPrompt';
import { getApiKey } from '@/lib/apiKeyStorage';
import '@/ui/styles/index.css';

// ---------------------------------------------------------------------------
// Shared inline styles (same as characters)
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '10px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.9)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
};

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: '6px',
    border: active ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
    background: active ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
    color: active ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
  };
}

const sectionGap: React.CSSProperties = { marginBottom: '20px' };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SavedCharacter {
  id: string;
  name: string;
  role: string;
  heroImage?: string;
  referenceImage?: string;
}

// ---------------------------------------------------------------------------
// Get setting description for background generation
// ---------------------------------------------------------------------------

function getSettingDescription(setting: string, customSettingDescription: string): string {
  const settingOption = SETTING_OPTIONS.find((s) => s.id === setting);
  if (setting === 'custom' && customSettingDescription) {
    return customSettingDescription;
  } else if (settingOption?.promptFragment) {
    return settingOption.promptFragment;
  } else {
    return 'Professional studio background with soft gradient backdrop';
  }
}

// ---------------------------------------------------------------------------
// Composite person onto background using Canvas
// ---------------------------------------------------------------------------

function compositeImages(
  personWithTransparentBg: string,
  background: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const bgImg = new Image();
    const personImg = new Image();
    let bgLoaded = false;
    let personLoaded = false;

    const tryComposite = () => {
      if (!bgLoaded || !personLoaded) return;

      // Use background dimensions as the canvas size
      const canvas = document.createElement('canvas');
      canvas.width = bgImg.width;
      canvas.height = bgImg.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      // Draw background
      ctx.drawImage(bgImg, 0, 0);

      // Calculate person placement - center horizontally, align to bottom
      // Scale person to fit nicely in the frame
      const personAspect = personImg.width / personImg.height;
      let personHeight = canvas.height * 0.9; // Person takes up ~90% of height
      let personWidth = personHeight * personAspect;

      // If person is too wide, scale down
      if (personWidth > canvas.width * 0.8) {
        personWidth = canvas.width * 0.8;
        personHeight = personWidth / personAspect;
      }

      // Center horizontally, align to bottom
      const personX = (canvas.width - personWidth) / 2;
      const personY = canvas.height - personHeight;

      // Draw person
      ctx.drawImage(personImg, personX, personY, personWidth, personHeight);

      resolve(canvas.toDataURL('image/png'));
    };

    bgImg.onload = () => {
      bgLoaded = true;
      tryComposite();
    };
    bgImg.onerror = () => reject(new Error('Failed to load background image'));

    personImg.onload = () => {
      personLoaded = true;
      tryComposite();
    };
    personImg.onerror = () => reject(new Error('Failed to load person image'));

    bgImg.src = background;
    personImg.src = personWithTransparentBg;
  });
}

// ---------------------------------------------------------------------------
// Aspect ratio post-processing (client-side Canvas crop)
// ---------------------------------------------------------------------------

const ASPECT_DIMENSIONS: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 16, h: 9 },
  '9:16': { w: 9, h: 16 },
  '1:1':  { w: 1, h: 1 },
};

/**
 * Crop a base64 image to the target aspect ratio.
 * Centers the crop on the upper-center of the image (where faces typically are).
 */
function cropToAspectRatio(dataUrl: string, ratio: AspectRatio): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { w: rw, h: rh } = ASPECT_DIMENSIONS[ratio];
      const targetRatio = rw / rh;
      const srcRatio = img.width / img.height;

      let cropW: number, cropH: number, cropX: number, cropY: number;

      if (srcRatio > targetRatio) {
        // Source is wider — crop sides
        cropH = img.height;
        cropW = Math.round(cropH * targetRatio);
        cropX = Math.round((img.width - cropW) / 2);
        cropY = 0;
      } else {
        // Source is taller — crop bottom (keep top where face is)
        cropW = img.width;
        cropH = Math.round(cropW / targetRatio);
        cropX = 0;
        cropY = 0; // Anchor to top where face is
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = dataUrl;
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RestylePage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();

  // Reference image
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState('');

  // Settings
  const [setting, setSetting] = useState('studio');
  const [brandAccentColor, setBrandAccentColor] = useState('#0ea5e9');
  const [customSettingDescription, setCustomSettingDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [numberOfOutputs, setNumberOfOutputs] = useState(4);

  // Results
  const [results, setResults] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Library
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Fetch saved characters on mount
  useEffect(() => {
    async function fetchCharacters() {
      try {
        const res = await fetch('/api/characters');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.characters) {
            setSavedCharacters(data.characters);
          }
        }
      } catch {
        // Non-critical
      }
    }
    fetchCharacters();
  }, []);

  // Auth redirect
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

  // Load from library
  const handleLoadCharacter = (char: SavedCharacter) => {
    const imageUrl = char.referenceImage || char.heroImage;
    if (imageUrl) {
      setReferenceImage(imageUrl);
      setReferenceName(char.name);
      setResults([]);
      setSelectedIndex(0);
      setError(null);
    }
  };

  // Upload file
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setReferenceImage(reader.result as string);
        setReferenceName(file.name.replace(/\.[^.]+$/, ''));
        setResults([]);
        setSelectedIndex(0);
        setError(null);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Generate restyled versions using composite approach
  const handleGenerate = async () => {
    if (!referenceImage) return;

    setLoading(true);
    setError(null);
    setLoadingStep('Removing background...');

    try {
      const stabilityKey = await getApiKey('stability');
      const openaiKey = await getApiKey('openai');
      const settingDescription = getSettingDescription(setting, customSettingDescription.trim());

      // Step 1: Remove background from reference image
      const removeBgResponse = await fetch('/api/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: referenceImage,
          user_api_key: stabilityKey || undefined,
        }),
      });

      const removeBgData = await removeBgResponse.json();

      if (!removeBgData.success || !removeBgData.imageBase64) {
        throw new Error(removeBgData.error?.message || 'Failed to remove background');
      }

      const personTransparent = removeBgData.imageBase64;

      // Step 2: Generate background images (one per output requested)
      setLoadingStep(`Generating ${numberOfOutputs} background(s)...`);

      const backgroundPromises = Array.from({ length: numberOfOutputs }, () =>
        fetch('/api/generate-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            setting: settingDescription,
            aspectRatio,
            accentColor: brandAccentColor,
            user_api_key: openaiKey || undefined,
          }),
        }).then(res => res.json())
      );

      const backgroundResults = await Promise.all(backgroundPromises);

      // Filter successful backgrounds
      const backgrounds = backgroundResults
        .filter(r => r.success && r.background)
        .map(r => r.background as string);

      if (backgrounds.length === 0) {
        const firstError = backgroundResults.find(r => !r.success);
        throw new Error(firstError?.error?.message || 'Failed to generate backgrounds');
      }

      // Step 3: Composite person onto each background
      setLoadingStep('Compositing images...');

      const compositePromises = backgrounds.map(bg =>
        compositeImages(personTransparent, bg)
      );

      const composited = await Promise.all(compositePromises);

      // Crop to aspect ratio
      const cropped = await Promise.all(
        composited.map(c => cropToAspectRatio(c, aspectRatio))
      );

      setResults(cropped);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Restyle generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Download
  const handleDownload = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selected = results[selectedIndex] ?? null;
  const canGenerate = !!referenceImage;

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
        {/* LEFT SIDEBAR */}
        <aside className={styles.sidebar}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Wand2 style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
              Restyle Character
            </span>
          </div>

          {/* Load from Library */}
          {savedCharacters.length > 0 && (
            <>
              <div style={sectionGap}>
                <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FolderOpen size={12} style={{ opacity: 0.6 }} />
                  Load from Library
                </div>
                <div className={styles.libraryGrid}>
                  {savedCharacters.map((char) => (
                    <button
                      key={char.id}
                      className={styles.libraryThumb}
                      onClick={() => handleLoadCharacter(char)}
                      title={`Load "${char.name}"`}
                    >
                      {(char.heroImage || char.referenceImage) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={char.heroImage || char.referenceImage} alt={char.name} />
                      ) : (
                        <User size={20} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      )}
                      <span className={styles.libraryThumbName}>{char.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <hr className={styles.sidebarDivider} />
            </>
          )}

          {/* Upload */}
          <div style={sectionGap}>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFileUpload}
              disabled={loading}
              leftIcon={<Upload size={14} />}
              style={{ width: '100%' }}
            >
              Upload Character Photo
            </Button>
          </div>

          {/* Reference thumbnail */}
          {referenceImage && (
            <>
              <div style={sectionGap}>
                <div style={labelStyle}>Reference</div>
                <div className={styles.refThumbnail}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={referenceImage} alt="Reference character" />
                </div>
                {referenceName && (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '6px' }}>
                    {referenceName}
                  </p>
                )}
              </div>
              <hr className={styles.sidebarDivider} />
            </>
          )}

          {/* Setting */}
          <div style={sectionGap}>
            <div style={labelStyle}>Setting</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SETTING_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSetting(s.id)}
                  style={chipStyle(setting === s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {setting === 'custom' && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="Describe the setting..."
                  value={customSettingDescription}
                  onChange={(e) => setCustomSettingDescription(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div style={sectionGap}>
            <div style={labelStyle}>Aspect Ratio</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ASPECT_RATIO_OPTIONS.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  style={chipStyle(aspectRatio === ar.id)}
                  title={ar.desc}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Accent Color */}
          <div style={sectionGap}>
            <div style={labelStyle}>Brand Accent Color</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="color"
                value={brandAccentColor}
                onChange={(e) => setBrandAccentColor(e.target.value)}
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
                value={brandAccentColor}
                onChange={(e) => setBrandAccentColor(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          </div>

          {/* Number of Outputs */}
          <div style={sectionGap}>
            <div style={labelStyle}>Number of Outputs: {numberOfOutputs}</div>
            <input
              type="range"
              min={1}
              max={6}
              value={numberOfOutputs}
              onChange={(e) => setNumberOfOutputs(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#0ea5e9' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
              <span>1</span>
              <span>6</span>
            </div>
          </div>

          {/* Generate */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              isLoading={loading}
              leftIcon={<Wand2 size={16} />}
              style={{ width: '100%' }}
            >
              {loading ? 'Generating...' : 'Restyle Character'}
            </Button>
            {!referenceImage && (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '8px' }}>
                Load or upload a character photo to begin
              </p>
            )}
            <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', marginTop: '8px' }}>
              Removes background, generates new setting, then composites. Uses Stability AI + OpenAI.
            </p>
          </div>
        </aside>

        {/* CENTER GRID */}
        <div className={styles.gridArea}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>
                Restyling character{referenceName ? ` "${referenceName}"` : ''}...
              </span>
              {loadingStep && (
                <p style={{ fontSize: '13px', color: '#0ea5e9', marginTop: '8px' }}>
                  {loadingStep}
                </p>
              )}
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                This may take 30-60 seconds
              </p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                  Restyled Results ({results.length})
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerate}
                  disabled={loading}
                  leftIcon={<RefreshCw size={14} />}
                >
                  Regenerate
                </Button>
              </div>
              <div className={styles.resultsGrid}>
                {results.map((dataUrl, i) => (
                  <div
                    key={i}
                    className={`${styles.resultCard} ${selectedIndex === i ? styles.active : ''}`}
                    onClick={() => setSelectedIndex(i)}
                    onDoubleClick={() => setLightboxSrc(dataUrl)}
                    title={`Result ${i + 1} — double-click to enlarge`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={dataUrl} alt={`Restyled ${i + 1}`} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <Wand2 size={64} />
              <p className={styles.emptyStateText}>No restyled images yet</p>
              <p className={styles.emptyStateHint}>
                {referenceImage
                  ? 'Adjust settings on the left and click Restyle Character'
                  : 'Load a character from your library or upload a photo to start'}
              </p>
            </div>
          )}
          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        {/* RIGHT PREVIEW PANEL */}
        <aside className={styles.previewPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
            Preview
          </div>
          {selected ? (
            <>
              <div className={styles.previewImage} onDoubleClick={() => setLightboxSrc(selected)} style={{ cursor: 'zoom-in' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected} alt="Selected restyled preview" />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginBottom: '20px' }}>
                Result {selectedIndex + 1} of {results.length}
              </p>
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() =>
                    handleDownload(
                      selected,
                      `${referenceName || 'character'}-restyled-${selectedIndex + 1}.png`
                    )
                  }
                  leftIcon={<Download size={16} />}
                  style={{ width: '100%' }}
                >
                  Download PNG
                </Button>
              </div>
            </>
          ) : referenceImage ? (
            <>
              <div className={styles.previewImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={referenceImage} alt="Reference" />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                Reference image
              </p>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
              Load a character to preview
            </div>
          )}
        </aside>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Enlarged" onClose={() => setLightboxSrc(null)} />}
    </div>
  );
}
