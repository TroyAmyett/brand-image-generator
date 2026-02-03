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
import { SETTING_OPTIONS, EXPRESSION_OPTIONS, ASPECT_RATIO_OPTIONS } from '@/lib/characterPrompt';
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
// Restyle prompt builder
// ---------------------------------------------------------------------------

interface RestylePromptResult {
  prompt: string;
  negativePrompt: string;
}

function buildRestylePrompt(params: {
  setting: string;
  expression: string;
  outfitDescription: string;
  brandAccentColor: string;
  customSettingDescription: string;
  aspectRatio: AspectRatio;
}): RestylePromptResult {
  const { setting, expression, outfitDescription, brandAccentColor, customSettingDescription, aspectRatio } = params;

  // Setting / background
  const settingOption = SETTING_OPTIONS.find((s) => s.id === setting);
  let settingFragment: string;
  if (setting === 'custom' && customSettingDescription) {
    settingFragment = customSettingDescription;
  } else if (settingOption?.promptFragment) {
    settingFragment = settingOption.promptFragment;
  } else {
    settingFragment = 'Professional studio background with soft gradient backdrop';
  }

  // Expression — "same" means don't override, let the reference dictate
  const expressionOption = EXPRESSION_OPTIONS.find((e) => e.id === expression);
  const expressionFragment =
    expression === 'same'
      ? 'same facial expression as the reference photo'
      : expressionOption?.promptFragment || 'same facial expression as the reference photo';

  // Outfit — only mention if explicitly provided
  const outfitLine = outfitDescription ? `Wearing ${outfitDescription}.` : '';

  // Aspect ratio hint for composition — keep it minimal so the model doesn't repose
  let compositionHint: string;
  if (aspectRatio === '16:9') {
    compositionHint = 'Wide landscape composition with extra environment visible on both sides of the subject.';
  } else if (aspectRatio === '1:1') {
    compositionHint = 'Square composition.';
  } else {
    compositionHint = 'Vertical portrait composition.';
  }

  const parts = [
    `CRITICAL: Preserve the EXACT same pose, head angle, head tilt, body position, and camera angle as the reference photo. Do NOT change the subject's pose or orientation in any way.`,
    `This exact person in their exact current pose, placed in a new setting: ${settingFragment}.`,
    `${expressionFragment}.`,
    outfitLine,
    `Subtle ${brandAccentColor} accent lighting. Photorealistic, sharp focus, high resolution.`,
    compositionHint,
    `NO text anywhere.`,
  ].filter(Boolean);

  const negativePrompt = [
    'different pose',
    'changed head angle',
    'altered head tilt',
    'different body position',
    'different camera angle',
    'reposed',
    'mirrored',
    'flipped',
    'text',
    'words',
    'watermark',
    'logo',
    'illustration',
    'cartoon',
    'low quality',
    'blurry',
    'deformed',
    'extra fingers',
    'mutated hands',
    'multiple people',
  ].join(', ');

  return { prompt: parts.join('\n'), negativePrompt };
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
  const [expression, setExpression] = useState('same');
  const [outfitDescription, setOutfitDescription] = useState('');
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

  // Generate restyled versions
  const handleGenerate = async () => {
    if (!referenceImage) return;

    setLoading(true);
    setError(null);

    try {
      const userKey = await getApiKey('replicate');
      const { prompt, negativePrompt } = buildRestylePrompt({
        setting,
        expression,
        outfitDescription: outfitDescription.trim(),
        brandAccentColor,
        customSettingDescription: customSettingDescription.trim(),
        aspectRatio,
      });

      const response = await fetch('/api/character-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: referenceImage,
          prompt,
          negative_prompt: negativePrompt,
          number_of_outputs: numberOfOutputs,
          output_format: 'png',
          output_quality: 95,
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations) {
        // Post-process: crop all results to the selected aspect ratio
        const cropped = await Promise.all(
          (data.variations as string[]).map((v: string) => cropToAspectRatio(v, aspectRatio))
        );
        setResults(cropped);
        setSelectedIndex(0);
      } else {
        setError(data.error?.message || 'Failed to generate restyled images');
      }
    } catch (err) {
      console.error('Restyle generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
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

          {/* Expression */}
          <div style={sectionGap}>
            <div style={labelStyle}>Expression</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => setExpression('same')}
                style={chipStyle(expression === 'same')}
              >
                Same as Reference
              </button>
              {EXPRESSION_OPTIONS.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setExpression(exp.id)}
                  style={chipStyle(expression === exp.id)}
                >
                  {exp.label}
                </button>
              ))}
            </div>
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

          {/* Outfit */}
          <div style={sectionGap}>
            <div style={labelStyle}>Outfit</div>
            <textarea
              placeholder="Describe the outfit: e.g. dark blazer with subtle cyan accent stitching..."
              value={outfitDescription}
              onChange={(e) => setOutfitDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '56px' }}
            />
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
              Uses consistent-character on Replicate. Requires a Replicate API key.
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
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
                This may take up to 60 seconds
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
