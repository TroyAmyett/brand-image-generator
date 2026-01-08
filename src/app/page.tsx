'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { APP_VERSION } from '@/lib/version';

const USAGE_OPTIONS = [
  'Hero Background',
  'Product/Service Card Image',
  'Icon',
  'Blog Main Image',
  'Social Media Post',
  'Other'
];

const DIMENSION_OPTIONS = [
  { value: 'Full screen (16:9)', label: 'Full screen (16:9)', size: '1792x1024' },
  { value: 'Hero Wide (21:9)', label: 'Hero Wide (21:9)', size: '1792x768' },
  { value: 'Square (1:1)', label: 'Square (1:1)', size: '1024x1024' },
  { value: 'Rectangle (4:3)', label: 'Rectangle (4:3)', size: '1024x768' },
  { value: 'Card (3:2)', label: 'Card (3:2)', size: '600x400' },
  { value: 'Vertical (9:16)', label: 'Vertical (9:16)', size: '1024x1792' },
];

const ASSET_SET_VARIANTS = [
  { key: 'master', label: 'Master (16:9)', size: '1792x1024', defaultChecked: true },
  { key: 'hero_wide', label: 'Hero Wide (21:9)', size: '1792x768', defaultChecked: true },
  { key: 'card_4x3', label: 'Card (4:3)', size: '800x600', defaultChecked: true },
  { key: 'card_3x2', label: 'Card (3:2)', size: '600x400', defaultChecked: false },
  { key: 'square', label: 'Square (1:1)', size: '600x600', defaultChecked: false },
];

const ASSET_TYPE_OPTIONS = [
  { value: 'hero_image', label: 'Hero Image', description: 'Standard featured image' },
  { value: 'infographic', label: 'Infographic', description: 'Data visualization, stats, vertical layout' },
  { value: 'process_flow', label: 'Process Flow', description: 'Step-by-step diagram, horizontal or vertical flow' },
  { value: 'comparison', label: 'Comparison', description: 'Side-by-side, vs layout, before/after' },
  { value: 'checklist', label: 'Checklist', description: 'List format, checkmarks, task-oriented' },
  { value: 'timeline', label: 'Timeline', description: 'Sequential events, milestones' },
  { value: 'diagram', label: 'Diagram', description: 'Technical illustration, architecture' },
  { value: 'quote_card', label: 'Quote Card', description: 'Pull quote, testimonial style' },
  { value: 'stats_highlight', label: 'Stats Highlight', description: 'Big numbers, KPIs, metrics' },
  { value: 'icon_set', label: 'Icon Set', description: 'Multiple related icons/symbols' },
];

const BRAND_THEME_OPTIONS = [
  { value: 'salesforce', label: 'Salesforce', description: 'Glowing cloud icon anchor' },
  { value: 'general_ai', label: 'General AI', description: 'Abstract AI core anchor' },
  { value: 'blockchain', label: 'Blockchain', description: 'Distributed ledger nodes' },
  { value: 'neutral', label: 'Neutral', description: 'No platform-specific anchor' },
];

interface HistoryItem {
  timestamp: string;
  usage: string;
  dimension: string;
  title?: string;
  subject: string;
  imageUrl: string;
  prompt: string;
}

interface AssetSetItem {
  url: string;
  dimensions: string;
  width: number;
  height: number;
}

interface GenerateResult {
  imageUrl: string;
  prompt: string;
  generate_mode?: 'single' | 'asset_set';
  asset_set?: Record<string, AssetSetItem>;
}

// Slugify helper for SEO filenames
const slugify = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export default function Home() {
  const [usage, setUsage] = useState(USAGE_OPTIONS[0]);
  const [assetType, setAssetType] = useState(ASSET_TYPE_OPTIONS[0].value);
  const [brandTheme, setBrandTheme] = useState(BRAND_THEME_OPTIONS[0].value);
  const [dimension, setDimension] = useState(DIMENSION_OPTIONS[0].value);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing...');
  const [result, setResult] = useState<GenerateResult | null>(null);

  // Asset Set mode state
  const [generateMode, setGenerateMode] = useState<'single' | 'asset_set'>('single');
  const [selectedVariants, setSelectedVariants] = useState<string[]>(
    ASSET_SET_VARIANTS.filter(v => v.defaultChecked).map(v => v.key)
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [styleGuide, setStyleGuide] = useState('');
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [styleGuideSaved, setStyleGuideSaved] = useState(false);

  // Fetch History
  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  // Fetch Style Guide
  const fetchStyleGuide = async () => {
    try {
      setStyleGuideLoading(true);
      const response = await fetch('/api/settings/style-guide');
      if (response.ok) {
        const data = await response.json();
        setStyleGuide(data.content || '');
      }
    } catch (error) {
      console.error('Failed to fetch style guide:', error);
    } finally {
      setStyleGuideLoading(false);
    }
  };

  // Save Style Guide
  const saveStyleGuide = async () => {
    try {
      setStyleGuideLoading(true);
      const response = await fetch('/api/settings/style-guide', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: styleGuide }),
      });
      if (response.ok) {
        setStyleGuideSaved(true);
        setTimeout(() => setStyleGuideSaved(false), 2000);
      } else {
        const data = await response.json();
        alert(data.error?.message || 'Failed to save style guide');
      }
    } catch (error) {
      console.error('Failed to save style guide:', error);
      alert('Failed to save style guide');
    } finally {
      setStyleGuideLoading(false);
    }
  };

  // Open settings and load style guide
  const openSettings = () => {
    setShowSettings(true);
    fetchStyleGuide();
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Loading Cycle Logic
  useEffect(() => {
    if (!loading) return;
    const texts = [
      'Reading Style Guide...',
      'Analyzing Brand Colors...',
      'Constructing Prompt...',
      'Optimizing for DALL-E 3...',
      'Painting Pixels...',
      'Finalizing Assets...'
    ];
    let i = 0;
    setLoadingText(texts[0]);
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setLoadingText(texts[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleDownload = async (imageUrl?: string, imageTitle?: string) => {
    const urlToUse = imageUrl || result?.imageUrl;
    if (!urlToUse) return;

    try {
      const titleToUse = imageTitle || title;
      const seoFilename = slugify(titleToUse) + '.png';

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: urlToUse })
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = seoFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(urlToUse, '_blank');
    }
  };

  const handleCopyPrompt = () => {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle variant selection for Asset Set mode
  const toggleVariant = (variantKey: string) => {
    setSelectedVariants(prev => {
      if (prev.includes(variantKey)) {
        // Don't allow deselecting master
        if (variantKey === 'master') return prev;
        return prev.filter(v => v !== variantKey);
      } else {
        return [...prev, variantKey];
      }
    });
  };

  // Download for data URL images (Asset Set)
  const handleDownloadDataUrl = (dataUrl: string, variantKey: string) => {
    const seoFilename = `${slugify(title)}-${variantKey}.png`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = seoFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[Generate] Starting - ${generateMode} mode`);
    setLoading(true);
    setResult(null);
    setImageLoaded(false);

    try {
      console.log('[Generate] Calling /api/generate...');
      const requestBody: Record<string, unknown> = {
        usage,
        asset_type: assetType,
        brand_theme: brandTheme,
        title,
        subject,
        additionalDetails: details,
        generate_mode: generateMode,
      };

      if (generateMode === 'asset_set') {
        requestBody.asset_set_variants = selectedVariants;
      } else {
        requestBody.dimension = dimension;
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('[Generate] Response received:', { success: data.success, generate_mode: data.generate_mode, hasAssetSet: !!data.asset_set });
      if (data.success) {
        // Support both legacy (imageUrl) and new (image_url) response formats
        const imageUrl = data.imageUrl || data.image_url;
        const prompt = data.prompt || data.prompt_used;

        if (data.generate_mode === 'asset_set' && data.asset_set) {
          console.log('[Generate] Asset Set received with variants:', Object.keys(data.asset_set));
          setResult({
            imageUrl: data.asset_set.master?.url || imageUrl,
            prompt,
            generate_mode: 'asset_set',
            asset_set: data.asset_set
          });
        } else {
          console.log('[Generate] Single image received');
          setResult({ imageUrl, prompt, generate_mode: 'single' });
        }
        fetchHistory(); // Refresh history
      } else {
        const errorMsg = data.error?.message || data.error || 'Something went wrong';
        console.error('Generation error:', data.error);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Generation error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate image.';
      alert(errorMsg);
    } finally {
      console.log('[Generate] Complete, setting loading=false');
      setLoading(false);
    }
  };

  const handleRevision = async () => {
    if (!revisionText.trim() || !result?.prompt) return;

    setLoading(true);
    setImageLoaded(false);
    setShowRevision(false);

    try {
      const revisedDetails = details
        ? `${details}\n\n**REVISION REQUEST:** ${revisionText}`
        : `**REVISION REQUEST:** ${revisionText}`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usage,
          asset_type: assetType,
          brand_theme: brandTheme,
          dimension,
          title,
          subject,
          additionalDetails: revisedDetails,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult({ imageUrl: data.imageUrl, prompt: data.prompt });
        setRevisionText('');
        fetchHistory(); // Refresh history
      } else {
        const errorMsg = data.error?.message || data.error || 'Something went wrong';
        console.error('Revision error:', data.error);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Revision error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate revised image.';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const selectFromHistory = (item: HistoryItem) => {
    setResult({ imageUrl: item.imageUrl, prompt: item.prompt });
    setTitle(item.title || item.subject); // Fallback to subject for older history items
    setSubject(item.subject);
    setUsage(item.usage);
    setDimension(item.dimension);
    setImageLoaded(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <h1 className={styles.title}>
              Brand Image Generator
            </h1>
            <button onClick={openSettings} className={styles.settingsButton} title="Settings">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
          </div>
          <p className={styles.subtitle}>
            Generate on-brand website assets aligned with our Style Guide.
          </p>
        </header>

        <div className={styles.grid}>
          {/* Card 1: Configuration */}
          <section className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.stepNumber}>1</span>
              Configuration
            </h2>

            <form onSubmit={handleGenerate}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Usage Context
                </label>
                <select
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  className={styles.select}
                >
                  {USAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Asset Type
                </label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className={styles.select}
                >
                  {ASSET_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} title={opt.description}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Brand Theme
                </label>
                <select
                  value={brandTheme}
                  onChange={(e) => setBrandTheme(e.target.value)}
                  className={styles.select}
                >
                  {BRAND_THEME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} title={opt.description}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Generate Mode
                </label>
                <div className={styles.toggleGroup}>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${generateMode === 'single' ? styles.toggleActive : ''}`}
                    onClick={() => setGenerateMode('single')}
                  >
                    Single Image
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${generateMode === 'asset_set' ? styles.toggleActive : ''}`}
                    onClick={() => setGenerateMode('asset_set')}
                  >
                    Asset Set
                  </button>
                </div>
              </div>

              {generateMode === 'single' ? (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Dimensions
                  </label>
                  <select
                    value={dimension}
                    onChange={(e) => setDimension(e.target.value)}
                    className={styles.select}
                  >
                    {DIMENSION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - {opt.size}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Asset Set Variants
                  </label>
                  <div className={styles.checkboxGroup}>
                    {ASSET_SET_VARIANTS.map((variant) => (
                      <label key={variant.key} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedVariants.includes(variant.key)}
                          onChange={() => toggleVariant(variant.key)}
                          disabled={variant.key === 'master'}
                          className={styles.checkbox}
                        />
                        <span className={styles.checkboxText}>
                          {variant.label}
                          <span className={styles.checkboxSize}>{variant.size}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Title (SEO filename)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 'astronaut-bus-stop-cta'"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Subject (image description)
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., 'Modern optimization dashboard with AI analytics'"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Additional Details (Optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Lighting, specific elements..."
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.button}
              >
                {loading ? 'Generating...' : 'Generate Asset'}
              </button>
            </form>
          </section>

          {/* Card 2: Image Result */}
          <section className={styles.card}>
            <h2 className={styles.cardHeader}>
              <span className={styles.stepNumber}>2</span>
              Visual Output
              {result?.generate_mode === 'asset_set' && (
                <span className={styles.assetSetBadge}>Asset Set</span>
              )}
            </h2>

            {/* Asset Set Display */}
            {result?.generate_mode === 'asset_set' && result.asset_set ? (
              <div className={styles.assetSetGrid}>
                {Object.entries(result.asset_set).map(([key, asset]) => {
                  const variantInfo = ASSET_SET_VARIANTS.find(v => v.key === key);
                  return (
                    <div key={key} className={styles.assetSetItem}>
                      <div className={styles.assetSetImageWrapper}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={`${subject} - ${variantInfo?.label || key}`}
                          className={styles.assetSetImage}
                        />
                      </div>
                      <div className={styles.assetSetInfo}>
                        <span className={styles.assetSetLabel}>{variantInfo?.label || key}</span>
                        <span className={styles.assetSetDimensions}>{asset.dimensions}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadDataUrl(asset.url, key)}
                        className={styles.assetSetDownload}
                        title={`Download ${variantInfo?.label || key}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single Image Display */
              <>
                <div className={styles.resultContainer} style={{ marginBottom: result?.imageUrl ? '1rem' : 0 }}>
                  {result?.imageUrl ? (
                    <>
                      <div
                        className={`${styles.imageWrapper} ${imageLoaded ? styles.loaded : ''}`}
                        onClick={() => setShowPreview(true)}
                        style={{ cursor: 'pointer' }}
                        title="Click to preview full size"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={result.imageUrl}
                          alt={subject}
                          className={styles.imageResult}
                          onLoad={() => setImageLoaded(true)}
                        />
                      </div>
                      {!imageLoaded && (
                        <div className={styles.loadingOverlay}>
                          <div className={styles.spinner}></div>
                          <p>Loading Image...</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.placeholder}>
                      {!loading && (
                        <>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2, marginBottom: '1rem' }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <p>Generated image will appear here.</p>
                        </>
                      )}
                      {loading && (
                        <>
                          <div className={styles.spinner}></div>
                          <p className={styles.loadingText}>{loadingText}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {result?.imageUrl && (
                  <div className={styles.actionButtons}>
                    <button onClick={() => handleDownload()} className={styles.secondaryButton}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Download
                    </button>
                    <button
                      onClick={() => setShowRevision(!showRevision)}
                      className={styles.secondaryButton}
                      disabled={loading}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Revise
                    </button>
                  </div>
                )}

                {showRevision && result?.imageUrl && (
                  <div className={styles.revisionContainer}>
                    <textarea
                      value={revisionText}
                      onChange={(e) => setRevisionText(e.target.value)}
                      placeholder="Describe what changes you want... (e.g., 'Make it more blue', 'Add more data streams', 'Remove the cloud logo')"
                      rows={3}
                      className={styles.textarea}
                    />
                    <button
                      onClick={handleRevision}
                      className={styles.button}
                      disabled={loading || !revisionText.trim()}
                    >
                      {loading ? 'Generating...' : 'Generate Revision'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Card 3: Exact Prompt */}
          <section className={styles.card}>
            <div className={styles.cardHeader} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className={styles.stepNumber}>3</span>
                Prompt Data
              </div>
              {result?.prompt && (
                <button onClick={handleCopyPrompt} className={styles.copyButton} title="Copy to Clipboard">
                  {copied ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  )}
                </button>
              )}
            </div>

            <div className={styles.promptContainer}>
              {result?.prompt ? (
                <pre className={styles.promptText}>
                  {result.prompt}
                </pre>
              ) : (
                <div className={styles.emptyPrompt}>
                  <p>Detailed prompt will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <section className={styles.historySection}>
            <h2 className={styles.historyTitle}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="9"></circle></svg>
              Recent Generations
            </h2>
            <div className={styles.historyGrid}>
              {history.map((item, idx) => (
                <div key={idx} className={styles.historyItem} onClick={() => selectFromHistory(item)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt={item.title || item.subject} className={styles.historyThumb} />
                  <div className={styles.historyInfo}>
                    <p className={styles.historySubject}>{item.title || item.subject}</p>
                    <div className={styles.historyMeta}>
                      <span>{item.usage}</span>
                      <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className={styles.footer}>
          <p>API Endpoint for Automations (Make.com): <code className={styles.code}>POST /api/generate</code></p>
          <p className={styles.versionTag}>{APP_VERSION}</p>
        </footer>
      </div>

      {/* Image Preview Modal */}
      {showPreview && result?.imageUrl && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowPreview(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.imageUrl} alt={subject} className={styles.modalImage} />
            <div className={styles.modalActions}>
              <button onClick={() => handleDownload()} className={styles.button}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download .PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.modal} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsHeader}>
              <h2>Settings</h2>
              <button className={styles.modalClose} onClick={() => setShowSettings(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.settingsContent}>
              <div className={styles.settingsSection}>
                <h3>Style Guide</h3>
                <p className={styles.settingsDescription}>
                  Customize the visual style guide used for generating images. This defines colors, themes, and visual elements.
                </p>
                {styleGuideLoading && !styleGuide ? (
                  <div className={styles.settingsLoading}>Loading...</div>
                ) : (
                  <textarea
                    value={styleGuide}
                    onChange={(e) => setStyleGuide(e.target.value)}
                    className={styles.styleGuideEditor}
                    placeholder="Enter your style guide here..."
                    rows={20}
                  />
                )}
              </div>
            </div>

            <div className={styles.settingsFooter}>
              <button
                onClick={() => setShowSettings(false)}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={saveStyleGuide}
                disabled={styleGuideLoading}
                className={styles.button}
              >
                {styleGuideLoading ? 'Saving...' : styleGuideSaved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
