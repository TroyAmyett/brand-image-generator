'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { Button } from '@/ui/components/Button/Button';
import { UserMenu } from '@/components/UserMenu';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { useAuth } from '@/contexts/AuthContext';
import { getApiKey } from '@/lib/apiKeyStorage';
import {
  PenTool,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  Save,
  ChevronDown,
} from 'lucide-react';
import { ImageProvider } from '@/lib/providers/types';
import {
  LogoType,
  LogoStyle,
  LOGO_TYPE_LABELS,
  LOGO_STYLE_LABELS,
  LOGO_TYPE_DESCRIPTIONS,
  LOGO_STYLE_DESCRIPTIONS,
} from '@/lib/logoPrompt';
import '@/ui/styles/index.css';

// ---- Types ----

interface LogoVariation {
  imageUrl: string;
  prompt: string;
}

interface StyleGuideOption {
  id: string;
  name: string;
  colors?: {
    primary?: { hex: string }[];
    secondary?: { hex: string }[];
    accent?: { hex: string }[];
  };
}

// ---- Constants ----

const LOGO_TYPES: LogoType[] = [
  'icon_mark',
  'wordmark',
  'combination',
  'lettermark',
  'emblem',
  'abstract',
];

const LOGO_STYLES: LogoStyle[] = [
  'minimal',
  'modern',
  'vintage',
  'playful',
  'corporate',
  'geometric',
  'handdrawn',
];

const PROVIDERS: { id: ImageProvider; label: string }[] = [
  { id: 'openai', label: 'OpenAI DALL-E 3' },
  { id: 'stability', label: 'Stability AI' },
  { id: 'replicate', label: 'Replicate (Flux)' },
];

// ---- Shared inline style fragments ----

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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: 'none',
  colorScheme: 'dark',
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

const sectionGap: React.CSSProperties = {
  marginBottom: '20px',
};

// ---- Component ----

export default function LogosPage() {
  const { user, isFederated, isLoading: authLoading } = useAuth();
  const isLoggedIn = isFederated && user;
  const router = useRouter();

  // Form state
  const [logoType, setLogoType] = useState<LogoType>('combination');
  const [brandName, setBrandName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [logoStyle, setLogoStyle] = useState<LogoStyle>('modern');
  const [colorPrimary, setColorPrimary] = useState('');
  const [colorSecondary, setColorSecondary] = useState('');
  const [colorAccent, setColorAccent] = useState('');
  const [provider, setProvider] = useState<ImageProvider>('openai');

  // Generation state
  const [variations, setVariations] = useState<LogoVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refinement state
  const [refinement, setRefinement] = useState('');
  const [refining, setRefining] = useState(false);

  // Style guides
  const [styleGuides, setStyleGuides] = useState<StyleGuideOption[]>([]);

  // Fetch style guides on mount
  useEffect(() => {
    async function fetchGuides() {
      try {
        const res = await fetch('/api/style-guides');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.guides) {
            setStyleGuides(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.guides.map((g: any) => ({
                id: g.id,
                name: g.name,
                colors: g.colors
                  ? {
                      primary: g.colors.primary,
                      secondary: g.colors.secondary,
                      accent: g.colors.accent,
                    }
                  : undefined,
              }))
            );
          }
        }
      } catch {
        // non-critical - guides just won't be available
      }
    }
    fetchGuides();
  }, []);

  // Auto-populate color overrides when a style guide is selected
  useEffect(() => {
    if (!selectedGuideId) return;
    const guide = styleGuides.find((g) => g.id === selectedGuideId);
    if (!guide?.colors) return;

    if (guide.colors.primary?.[0]?.hex) setColorPrimary(guide.colors.primary[0].hex);
    if (guide.colors.secondary?.[0]?.hex) setColorSecondary(guide.colors.secondary[0].hex);
    if (guide.colors.accent?.[0]?.hex) setColorAccent(guide.colors.accent[0].hex);
  }, [selectedGuideId, styleGuides]);

  // Generate logos
  const handleGenerate = useCallback(async () => {
    if (!brandName.trim()) {
      setError('Please enter a brand name');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a brand description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Resolve API key client-side
      const userKey = await getApiKey(provider);

      const colorOverrides: Record<string, string> = {};
      if (colorPrimary) colorOverrides.primary = colorPrimary;
      if (colorSecondary) colorOverrides.secondary = colorSecondary;
      if (colorAccent) colorOverrides.accent = colorAccent;

      const response = await fetch('/api/generate-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          description: description.trim(),
          logoType,
          style: logoStyle,
          guideId: selectedGuideId || undefined,
          colorOverrides:
            Object.keys(colorOverrides).length > 0 ? colorOverrides : undefined,
          provider,
          count: 4,
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations) {
        setVariations(data.variations);
        setSelectedVariation(0);
      } else {
        setError(data.error?.message || 'Failed to generate logos');
      }
    } catch (err) {
      console.error('Logo generation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [
    brandName,
    description,
    logoType,
    logoStyle,
    selectedGuideId,
    colorPrimary,
    colorSecondary,
    colorAccent,
    provider,
  ]);

  // Refine selected logo
  const handleRefine = useCallback(async () => {
    if (!refinement.trim() || variations.length === 0) return;

    setRefining(true);
    setError(null);

    try {
      const userKey = await getApiKey(provider);

      const colorOverrides: Record<string, string> = {};
      if (colorPrimary) colorOverrides.primary = colorPrimary;
      if (colorSecondary) colorOverrides.secondary = colorSecondary;
      if (colorAccent) colorOverrides.accent = colorAccent;

      const response = await fetch('/api/generate-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          description: description.trim(),
          logoType,
          style: logoStyle,
          guideId: selectedGuideId || undefined,
          colorOverrides:
            Object.keys(colorOverrides).length > 0 ? colorOverrides : undefined,
          provider,
          count: 1,
          refinement: refinement.trim(),
          user_api_key: userKey || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.variations?.[0]) {
        // Replace the selected variation with the refined one
        setVariations((prev) => {
          const next = [...prev];
          next[selectedVariation] = data.variations[0];
          return next;
        });
        setRefinement('');
      } else {
        setError(data.error?.message || 'Refinement failed');
      }
    } catch (err) {
      console.error('Logo refinement error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRefining(false);
    }
  }, [
    refinement,
    variations,
    selectedVariation,
    brandName,
    description,
    logoType,
    logoStyle,
    selectedGuideId,
    colorPrimary,
    colorSecondary,
    colorAccent,
    provider,
  ]);

  // Download the selected logo
  const handleDownload = useCallback(
    (format: 'png') => {
      const v = variations[selectedVariation];
      if (!v) return;

      const link = document.createElement('a');
      link.href = v.imageUrl;
      link.download = `${brandName || 'logo'}-${logoType}-${selectedVariation + 1}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [variations, selectedVariation, brandName, logoType]
  );

  // Copy image to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    const v = variations[selectedVariation];
    if (!v) return;

    try {
      const res = await fetch(v.imageUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [variations, selectedVariation]);

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

  const canGenerate = brandName.trim().length > 0 && description.trim().length > 0;
  const selected = variations[selectedVariation] ?? null;

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
        {/* ---- LEFT SIDEBAR ---- */}
        <aside className={styles.sidebar}>
          {/* Sidebar header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <PenTool style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
              Logo Generator
            </span>
          </div>

          {/* Logo Type */}
          <div style={sectionGap}>
            <div style={labelStyle}>Logo Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {LOGO_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setLogoType(t)}
                  style={chipStyle(logoType === t)}
                  className={styles.chipTooltip}
                  data-tooltip={LOGO_TYPE_DESCRIPTIONS[t]}
                >
                  {LOGO_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Name */}
          <div style={sectionGap}>
            <div style={labelStyle}>Brand Name</div>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={sectionGap}>
            <div style={labelStyle}>Description</div>
            <textarea
              placeholder="Describe your brand, its values, and what the logo should convey..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                resize: 'vertical' as const,
                minHeight: '72px',
              }}
            />
          </div>

          {/* Style Guide */}
          {styleGuides.length > 0 && (
            <div style={sectionGap}>
              <div style={labelStyle}>Style Guide</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">None (use color overrides)</option>
                  {styleGuides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* Style */}
          <div style={sectionGap}>
            <div style={labelStyle}>Style</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {LOGO_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setLogoStyle(s)}
                  style={chipStyle(logoStyle === s)}
                  className={styles.chipTooltip}
                  data-tooltip={LOGO_STYLE_DESCRIPTIONS[s]}
                >
                  {LOGO_STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Color Overrides */}
          <div style={sectionGap}>
            <div style={labelStyle}>Color Overrides (optional)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={colorPrimary || '#0ea5e9'}
                  onChange={(e) => setColorPrimary(e.target.value)}
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
                  placeholder="Primary (#hex)"
                  value={colorPrimary}
                  onChange={(e) => setColorPrimary(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={colorSecondary || '#6366f1'}
                  onChange={(e) => setColorSecondary(e.target.value)}
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
                  placeholder="Secondary (#hex)"
                  value={colorSecondary}
                  onChange={(e) => setColorSecondary(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={colorAccent || '#f59e0b'}
                  onChange={(e) => setColorAccent(e.target.value)}
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
                  placeholder="Accent (#hex)"
                  value={colorAccent}
                  onChange={(e) => setColorAccent(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Provider */}
          <div style={sectionGap}>
            <div style={labelStyle}>Provider</div>
            <div style={{ position: 'relative' }}>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ImageProvider)}
                style={selectStyle}
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.4)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Generate Button */}
          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              isLoading={loading}
              leftIcon={<Sparkles size={16} />}
              style={{ width: '100%' }}
            >
              {loading ? 'Generating...' : 'Generate Logos'}
            </Button>
          </div>
        </aside>

        {/* ---- CENTER GRID ---- */}
        <div className={styles.gridArea}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>
                Generating {brandName ? `"${brandName}"` : ''} logo variations...
              </span>
            </div>
          ) : variations.length > 0 ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}
                >
                  Logo Variations ({variations.length})
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

              <div className={styles.variationsGrid}>
                {variations.map((v, i) => (
                  <div
                    key={i}
                    className={`${styles.variationCard} ${
                      selectedVariation === i ? styles.active : ''
                    }`}
                    onClick={() => setSelectedVariation(i)}
                    title={`Variation ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.imageUrl}
                      alt={`${brandName} logo variation ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <PenTool size={64} />
              <p className={styles.emptyStateText}>No logos generated yet</p>
              <p className={styles.emptyStateHint}>
                Fill in the details on the left and click Generate to create logo variations
              </p>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        {/* ---- RIGHT PREVIEW PANEL ---- */}
        <aside className={styles.previewPanel}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#ffffff',
            }}
          >
            Preview
          </div>

          {selected ? (
            <>
              {/* Large preview */}
              <div className={styles.previewImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selected.imageUrl}
                  alt={`${brandName} logo preview`}
                />
              </div>

              {/* Refine */}
              <div style={{ marginBottom: '20px' }}>
                <div style={labelStyle}>Refine</div>
                <textarea
                  placeholder="Describe changes, e.g. 'make it more minimal' or 'use bolder typography'..."
                  value={refinement}
                  onChange={(e) => setRefinement(e.target.value)}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical' as const,
                    minHeight: '64px',
                    marginBottom: '8px',
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefine}
                  disabled={!refinement.trim() || refining}
                  isLoading={refining}
                  leftIcon={<RefreshCw size={14} />}
                  style={{ width: '100%' }}
                >
                  {refining ? 'Refining...' : 'Refine Selected'}
                </Button>
              </div>

              {/* Export actions */}
              <div style={{ marginBottom: '20px' }}>
                <div style={labelStyle}>Export</div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload('png')}
                    leftIcon={<Download size={14} />}
                    style={{ width: '100%' }}
                  >
                    Download PNG
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    leftIcon={<Copy size={14} />}
                    style={{ width: '100%' }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>

              {/* Save to style guide */}
              {selectedGuideId && (
                <div>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Save size={14} />}
                    style={{ width: '100%' }}
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `/api/style-guides/${selectedGuideId}`,
                          {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              logo: {
                                url: selected.imageUrl,
                                type: logoType,
                                style: logoStyle,
                                generatedAt: new Date().toISOString(),
                              },
                            }),
                          }
                        );
                        if (res.ok) {
                          // Visual feedback handled inline
                        }
                      } catch {
                        // silent
                      }
                    }}
                  >
                    Use as Brand Logo
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '13px',
                textAlign: 'center',
                padding: '2rem',
              }}
            >
              Generate logos and select a variation to preview
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
