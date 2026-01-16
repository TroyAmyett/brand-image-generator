'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import { APP_VERSION } from '@/lib/version';
import { brand, applyBrandColors } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import {
  Settings,
  X,
  Download,
  Edit,
  Copy,
  Check,
  Clock,
  Key,
  Type,
  ImagePlus,
} from 'lucide-react';
import ApiKeySettings from '@/components/ApiKeySettings';
import { getApiKey, hasApiKey } from '@/lib/apiKeyStorage';
import ImageUpload, { ImageUploadResult } from '@/components/ImageUpload';
import TransformationModeSelector, { TransformationMode } from '@/components/TransformationModeSelector';
import StyleStrengthSlider from '@/components/StyleStrengthSlider';
import PreserveOptions, { PreserveOptionsState } from '@/components/PreserveOptions';
import ComparisonView from '@/components/ComparisonView';

// Funnelists UI Components
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { Button } from '@/ui/components/Button/Button';
import { Panel } from '@/ui/components/Panel/Panel';
import { Input } from '@/ui/components/Input/Input';
import { Select, type SelectOption } from '@/ui/components/Select/Select';
import { Textarea } from '@/ui/components/Textarea/Textarea';
import { ImageOutput } from '@/ui/components/ImageOutput/ImageOutput';
import '@/ui/styles/index.css';

const USAGE_OPTIONS: SelectOption[] = [
  { value: 'Hero Background', label: 'Hero Background' },
  { value: 'Product/Service Card Image', label: 'Product/Service Card Image' },
  { value: 'Icon', label: 'Icon' },
  { value: 'Blog Main Image', label: 'Blog Main Image' },
  { value: 'Social Media Post', label: 'Social Media Post' },
  { value: 'Other', label: 'Other' },
];

const DIMENSION_OPTIONS: SelectOption[] = [
  { value: 'Full screen (16:9)', label: 'Full screen (16:9) - 1792x1024' },
  { value: 'Hero Wide (21:9)', label: 'Hero Wide (21:9) - 1792x768' },
  { value: 'Square (1:1)', label: 'Square (1:1) - 1024x1024' },
  { value: 'Rectangle (4:3)', label: 'Rectangle (4:3) - 1024x768' },
  { value: 'Card (3:2)', label: 'Card (3:2) - 600x400' },
  { value: 'Vertical (9:16)', label: 'Vertical (9:16) - 1024x1792' },
];

const ASSET_SET_VARIANTS = [
  { key: 'master', label: 'Master (16:9)', size: '1792x1024', defaultChecked: true },
  { key: 'hero_wide', label: 'Hero Wide (21:9)', size: '1792x768', defaultChecked: true },
  { key: 'card_4x3', label: 'Card (4:3)', size: '800x600', defaultChecked: true },
  { key: 'card_3x2', label: 'Card (3:2)', size: '600x400', defaultChecked: false },
  { key: 'square', label: 'Square (1:1)', size: '600x600', defaultChecked: false },
];

const ASSET_TYPE_OPTIONS: SelectOption[] = [
  { value: 'hero_image', label: 'Hero Image' },
  { value: 'infographic', label: 'Infographic' },
  { value: 'process_flow', label: 'Process Flow' },
  { value: 'comparison', label: 'Comparison' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'diagram', label: 'Diagram' },
  { value: 'quote_card', label: 'Quote Card' },
  { value: 'stats_highlight', label: 'Stats Highlight' },
  { value: 'icon_set', label: 'Icon Set' },
];

const BRAND_THEME_OPTIONS: SelectOption[] = [
  { value: 'salesforce', label: 'Salesforce' },
  { value: 'general_ai', label: 'General AI' },
  { value: 'blockchain', label: 'Blockchain' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'photorealistic', label: 'Photorealistic' },
];

const IMAGE_PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'openai', label: 'OpenAI DALL-E 3' },
  { value: 'stability', label: 'Stability AI' },
  { value: 'replicate', label: 'Replicate (Flux)' },
  { value: 'anthropic', label: 'Anthropic Claude (Coming soon)', disabled: true },
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

interface Img2ImgResult {
  originalImage: string;
  styledImage: string;
  prompt: string;
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
  // Main mode: text-to-image or image-to-image
  const [mainMode, setMainMode] = useState<'text2img' | 'img2img'>('text2img');

  // Text-to-Image state
  const [usage, setUsage] = useState(USAGE_OPTIONS[0].value);
  const [assetType, setAssetType] = useState(ASSET_TYPE_OPTIONS[0].value);
  const [brandTheme, setBrandTheme] = useState(BRAND_THEME_OPTIONS[0].value);
  const [imageProvider, setImageProvider] = useState(IMAGE_PROVIDER_OPTIONS[0].value);
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
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [styleGuide, setStyleGuide] = useState('');
  const [styleGuideLoading, setStyleGuideLoading] = useState(false);
  const [styleGuideSaved, setStyleGuideSaved] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [userApiKeyConfigured, setUserApiKeyConfigured] = useState<Record<string, boolean>>({});

  // Image-to-Image state
  const [img2imgSourceImage, setImg2imgSourceImage] = useState<ImageUploadResult | null>(null);
  const [img2imgTransformMode, setImg2imgTransformMode] = useState<TransformationMode>('style_transfer');
  const [img2imgStyleStrength, setImg2imgStyleStrength] = useState(50);
  const [img2imgPreserveOptions, setImg2imgPreserveOptions] = useState<PreserveOptionsState>({
    preserveText: false,
    preserveLayout: true,
    preserveColors: false
  });
  const [img2imgBrandTheme, setImg2imgBrandTheme] = useState(BRAND_THEME_OPTIONS[0].value);
  const [img2imgLoading, setImg2imgLoading] = useState(false);
  const [img2imgResult, setImg2imgResult] = useState<Img2ImgResult | null>(null);
  const [img2imgError, setImg2imgError] = useState<string | null>(null);

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

  // Check which providers have user API keys configured
  const checkUserApiKeys = () => {
    const configured: Record<string, boolean> = {};
    IMAGE_PROVIDER_OPTIONS.forEach(opt => {
      configured[opt.value] = hasApiKey(opt.value as 'openai' | 'stability' | 'replicate' | 'anthropic');
    });
    setUserApiKeyConfigured(configured);
  };

  useEffect(() => {
    fetchHistory();
    applyBrandColors(); // Apply white-label brand colors
    checkUserApiKeys(); // Check for user API keys
  }, []);

  // Loading Cycle Logic for Text-to-Image
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

      // For data URLs, download directly
      if (urlToUse.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = urlToUse;
        link.download = seoFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

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
    
    try {
      console.log('[Generate] Calling /api/generate...');

      // Get user's API key for the selected provider if available
      const userApiKey = await getApiKey(imageProvider as 'openai' | 'stability' | 'replicate' | 'anthropic');

      const requestBody: Record<string, unknown> = {
        usage,
        asset_type: assetType,
        brand_theme: brandTheme,
        title,
        subject,
        additionalDetails: details,
        generate_mode: generateMode,
        image_provider: imageProvider,
      };

      // Include user's API key if they have one configured
      if (userApiKey) {
        requestBody.user_api_key = userApiKey;
      }

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Image-to-Image handlers
  const handleImg2ImgGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!img2imgSourceImage) {
      setImg2imgError('Please select a source image');
      return;
    }

    setImg2imgLoading(true);
    setImg2imgError(null);
    setImg2imgResult(null);

    try {
      // Get user's API key for Stability AI
      const userApiKey = await getApiKey('stability');

      // Send the resized image (already resized to Stability AI dimensions)
      const response = await fetch('/api/generate-img2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImage: img2imgSourceImage.resizedDataUrl,
          transformationMode: img2imgTransformMode,
          styleStrength: img2imgStyleStrength,
          preserveOptions: img2imgPreserveOptions,
          brandTheme: img2imgBrandTheme,
          userApiKey
        })
      });

      const data = await response.json();

      if (data.success) {
        setImg2imgResult({
          // Show original (unresized) image in comparison for better UX
          originalImage: img2imgSourceImage.resizedDataUrl,
          styledImage: data.styledImage,
          prompt: data.prompt
        });
      } else {
        setImg2imgError(data.error?.message || 'Failed to style image');
      }
    } catch (error) {
      console.error('Img2Img error:', error);
      setImg2imgError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setImg2imgLoading(false);
    }
  };

  const handleImg2ImgDownload = () => {
    if (!img2imgResult?.styledImage) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `styled-${img2imgTransformMode}-${timestamp}.png`;

    const link = document.createElement('a');
    link.href = img2imgResult.styledImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImg2ImgRegenerate = () => {
    if (img2imgSourceImage) {
      handleImg2ImgGenerate({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <AppHeader
          logo={<BrandLogo height={48} />}
          toolName={brand.product.name}
          settingsButton={
            <Button variant="icon" onClick={openSettings} title="Settings">
              <Settings className="w-5 h-5" />
            </Button>
          }
        />

        {/* Main Mode Tabs */}
        <div className={styles.mainModeTabs}>
          <Button
            variant={mainMode === 'text2img' ? 'primary' : 'ghost'}
            leftIcon={<Type className="w-5 h-5" />}
            onClick={() => setMainMode('text2img')}
          >
            Text to Image
          </Button>
          <Button
            variant={mainMode === 'img2img' ? 'primary' : 'ghost'}
            leftIcon={<ImagePlus className="w-5 h-5" />}
            onClick={() => setMainMode('img2img')}
          >
            Image to Image
          </Button>
        </div>

        {mainMode === 'text2img' ? (
          /* Text-to-Image Mode */
          <div className={styles.grid}>
            {/* Card 1: Configuration */}
            <Panel header={<><span className={styles.stepNumber}>1</span> Configuration</>}>
              <form onSubmit={handleGenerate}>
                <Select
                  label="Usage Context"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  options={USAGE_OPTIONS}
                />

                <Select
                  label="Asset Type"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  options={ASSET_TYPE_OPTIONS}
                />

                <Select
                  label="Brand Theme"
                  value={brandTheme}
                  onChange={(e) => setBrandTheme(e.target.value)}
                  options={BRAND_THEME_OPTIONS}
                />

                <div className={styles.formGroup}>
                  <div className={styles.providerSelectWrapper}>
                    <Select
                      label="Image Provider"
                      value={imageProvider}
                      onChange={(e) => setImageProvider(e.target.value)}
                      options={IMAGE_PROVIDER_OPTIONS.map(opt => ({
                        ...opt,
                        label: opt.label + (userApiKeyConfigured[opt.value] ? ' (Your key)' : '')
                      }))}
                    />
                    <Button
                      variant="icon"
                      type="button"
                      onClick={() => setShowApiKeys(true)}
                      title="Manage API Keys"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Generate Mode</label>
                  <div className={styles.toggleGroup}>
                    <Button
                      type="button"
                      variant={generateMode === 'single' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setGenerateMode('single')}
                    >
                      Single Image
                    </Button>
                    <Button
                      type="button"
                      variant={generateMode === 'asset_set' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => setGenerateMode('asset_set')}
                    >
                      Asset Set
                    </Button>
                  </div>
                </div>

                {generateMode === 'single' ? (
                  <Select
                    label="Dimensions"
                    value={dimension}
                    onChange={(e) => setDimension(e.target.value)}
                    options={DIMENSION_OPTIONS}
                  />
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Asset Set Variants</label>
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

                <Input
                  label="Title (SEO filename)"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 'astronaut-bus-stop-cta'"
                  required
                />

                <Input
                  label="Subject (image description)"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., 'Modern optimization dashboard with AI analytics'"
                  required
                />

                <Textarea
                  label="Additional Details (Optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Lighting, specific elements..."
                  rows={3}
                />

                <div className={styles.stickyButton}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    isLoading={loading}
                  >
                    {loading ? 'Generating...' : 'Generate Asset'}
                  </Button>
                </div>
              </form>
            </Panel>

            {/* Card 2: Image Result */}
            <Panel
              header={
                <>
                  <span className={styles.stepNumber}>2</span> Visual Output
                  {result?.generate_mode === 'asset_set' && (
                    <span className={styles.assetSetBadge}>Asset Set</span>
                  )}
                </>
              }
            >
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
                        <Button
                          variant="icon"
                          onClick={() => handleDownloadDataUrl(asset.url, key)}
                          title={`Download ${variantInfo?.label || key}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Single Image Display */
                <>
                  <div
                    className={styles.imageOutputContainer}
                    onClick={() => result?.imageUrl && setShowPreview(true)}
                    style={{ cursor: result?.imageUrl ? 'pointer' : 'default' }}
                    title={result?.imageUrl ? 'Click to preview full size' : undefined}
                  >
                    <ImageOutput
                      src={result?.imageUrl}
                      alt={subject}
                      variant="fill"
                      isLoading={loading}
                      placeholder={
                        loading ? (
                          <span className={styles.loadingText}>{loadingText}</span>
                        ) : undefined
                      }
                      actions={
                        result?.imageUrl && (
                          <div className={styles.actionButtons}>
                            <Button
                              variant="secondary"
                              leftIcon={<Download className="w-5 h-5" />}
                              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            >
                              Download
                            </Button>
                            <Button
                              variant="secondary"
                              leftIcon={<Edit className="w-5 h-5" />}
                              onClick={(e) => { e.stopPropagation(); setShowRevision(!showRevision); }}
                              disabled={loading}
                            >
                              Revise
                            </Button>
                          </div>
                        )
                      }
                    />
                  </div>

                  {showRevision && result?.imageUrl && (
                    <div className={styles.revisionContainer}>
                      <Textarea
                        value={revisionText}
                        onChange={(e) => setRevisionText(e.target.value)}
                        placeholder="Describe what changes you want... (e.g., 'Make it more blue', 'Add more data streams', 'Remove the cloud logo')"
                        rows={3}
                      />
                      <Button
                        variant="primary"
                        onClick={handleRevision}
                        disabled={loading || !revisionText.trim()}
                        isLoading={loading}
                      >
                        {loading ? 'Generating...' : 'Generate Revision'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Panel>

            {/* Card 3: Exact Prompt */}
            <Panel
              header={<><span className={styles.stepNumber}>3</span> Prompt Data</>}
              actions={
                result?.prompt && (
                  <Button variant="icon" onClick={handleCopyPrompt} title="Copy to Clipboard">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )
              }
            >
              <div className={styles.promptContainer}>
                {result?.prompt ? (
                  <pre className={styles.promptText}>{result.prompt}</pre>
                ) : (
                  <div className={styles.emptyPrompt}>
                    <p>Detailed prompt will appear here.</p>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        ) : (
          /* Image-to-Image Mode */
          <div className={styles.grid}>
            {/* Card 1: Source Image & Settings */}
            <Panel header={<><span className={styles.stepNumber}>1</span> Source & Settings</>}>
              <form onSubmit={handleImg2ImgGenerate}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Source Image</label>
                  <ImageUpload
                    onImageSelect={setImg2imgSourceImage}
                    selectedImage={img2imgSourceImage}
                    disabled={img2imgLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Transformation Mode</label>
                  <TransformationModeSelector
                    value={img2imgTransformMode}
                    onChange={setImg2imgTransformMode}
                    disabled={img2imgLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <StyleStrengthSlider
                    value={img2imgStyleStrength}
                    onChange={setImg2imgStyleStrength}
                    disabled={img2imgLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Preserve Options</label>
                  <PreserveOptions
                    value={img2imgPreserveOptions}
                    onChange={setImg2imgPreserveOptions}
                    disabled={img2imgLoading}
                  />
                </div>

                <Select
                  label="Brand Theme"
                  value={img2imgBrandTheme}
                  onChange={(e) => setImg2imgBrandTheme(e.target.value)}
                  options={BRAND_THEME_OPTIONS}
                  disabled={img2imgLoading}
                />

                <div className={styles.formGroup}>
                  <label className={styles.label}>API Key</label>
                  <div className={styles.providerSelectWrapper}>
                    <div className={styles.apiKeyStatus}>
                      Stability AI {userApiKeyConfigured['stability'] ? '(Your key configured)' : '(Server key)'}
                    </div>
                    <Button
                      variant="icon"
                      type="button"
                      onClick={() => setShowApiKeys(true)}
                      title="Manage API Keys"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {img2imgError && (
                  <div className={styles.errorMessage}>
                    {img2imgError}
                  </div>
                )}

                <div className={styles.stickyButton}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={img2imgLoading || !img2imgSourceImage}
                    isLoading={img2imgLoading}
                  >
                    {img2imgLoading ? 'Styling Image...' : 'Apply Style'}
                  </Button>
                </div>
              </form>
            </Panel>

            {/* Card 2: Comparison View */}
            <Panel
              header={
                <>
                  <span className={styles.stepNumber}>2</span> Comparison
                  {img2imgResult && <span className={styles.img2imgBadge}>Styled</span>}
                </>
              }
            >
              {img2imgResult ? (
                <ComparisonView
                  originalImage={img2imgResult.originalImage}
                  styledImage={img2imgResult.styledImage}
                  onDownload={handleImg2ImgDownload}
                  onRegenerate={handleImg2ImgRegenerate}
                  loading={img2imgLoading}
                />
              ) : (
                <ImageOutput
                  variant="fill"
                  isLoading={img2imgLoading}
                  placeholder={
                    img2imgLoading ? (
                      <span className={styles.loadingText}>Applying style transformation...</span>
                    ) : (
                      <span>Upload an image and click Apply Style to see the comparison.</span>
                    )
                  }
                />
              )}
            </Panel>

            {/* Card 3: Style Info */}
            <Panel header={<><span className={styles.stepNumber}>3</span> Style Details</>}>
              <div className={styles.promptContainer}>
                {img2imgResult?.prompt ? (
                  <pre className={styles.promptText}>{img2imgResult.prompt}</pre>
                ) : (
                  <div className={styles.emptyPrompt}>
                    <p>Style prompt will appear here after transformation.</p>
                  </div>
                )}
              </div>
            </Panel>
          </div>
        )}

        {/* History Section (only for Text-to-Image) */}
        {mainMode === 'text2img' && history.length > 0 && (
          <section className={styles.historySection}>
            <h2 className={styles.historyTitle}>
              <Clock className="w-6 h-6" style={{ color: 'var(--primary)' }} />
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
          <p className={styles.footerBrand}>
            <a href={brand.links.website} target="_blank" rel="noopener noreferrer">
              {brand.footer}
            </a>
          </p>
        </footer>
      </div>

      {/* Image Preview Modal */}
      {showPreview && result?.imageUrl && (
        <div className={styles.modal} onClick={() => setShowPreview(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Button variant="icon" className={styles.modalClose} onClick={() => setShowPreview(false)}>
              <X className="w-6 h-6" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.imageUrl} alt={subject} className={styles.modalImage} />
            <div className={styles.modalActions}>
              <Button variant="primary" leftIcon={<Download className="w-5 h-5" />} onClick={() => handleDownload()}>
                Download .PNG
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Modal */}
      <ApiKeySettings
        isOpen={showApiKeys}
        onClose={() => {
          setShowApiKeys(false);
          checkUserApiKeys(); // Refresh key status when modal closes
        }}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.modal} onClick={() => setShowSettings(false)}>
          <div className={styles.settingsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.settingsHeader}>
              <h2>Settings</h2>
              <Button variant="icon" className={styles.modalClose} onClick={() => setShowSettings(false)}>
                <X className="w-6 h-6" />
              </Button>
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
                  <Textarea
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
              <Button variant="secondary" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={saveStyleGuide}
                disabled={styleGuideLoading}
                isLoading={styleGuideLoading}
              >
                {styleGuideLoading ? 'Saving...' : styleGuideSaved ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
