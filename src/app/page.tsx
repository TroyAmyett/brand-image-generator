'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { APP_VERSION } from '@/lib/version';
import { brand, applyBrandColors } from '@/lib/brand';
import { BrandLogo } from '@/components/BrandLogo';
import { CanvasSidebar, type CanvasTab } from '@/components/CanvasSidebar';
import {
  Settings,
  X,
  Download,
  Edit,
  Copy,
  Check,
  Key,
  Type,
  ImagePlus,
  Image as ImageIcon,
  Sparkles,
  FileText,
  Grid,
} from 'lucide-react';
import ApiKeySettings from '@/components/ApiKeySettings';
import { UserMenu } from '@/components/UserMenu';
import { ToolSwitcher } from '@/components/ToolSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { getApiKey, hasApiKey } from '@/lib/apiKeyManager';
import ImageUpload, { ImageUploadResult } from '@/components/ImageUpload';
import TransformationModeSelector, { TransformationMode } from '@/components/TransformationModeSelector';
import StyleStrengthSlider from '@/components/StyleStrengthSlider';
import PreserveOptions, { PreserveOptionsState } from '@/components/PreserveOptions';
import ComparisonView from '@/components/ComparisonView';

// Funnelists UI Components
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { Button } from '@/ui/components/Button/Button';
import { Input } from '@/ui/components/Input/Input';
import { Select, type SelectOption } from '@/ui/components/Select/Select';
import { Textarea } from '@/ui/components/Textarea/Textarea';
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

// New Style dropdown options
const STYLE_OPTIONS: SelectOption[] = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustration', label: 'Illustration' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: '3d_render', label: '3D Render' },
  { value: 'cinematic', label: 'Cinematic' },
];

// Updated Brand Theme options (removed Funnelists and Photorealistic)
const BRAND_THEME_OPTIONS: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'my_brand', label: 'My Brand' },
  { value: 'salesforce', label: 'Salesforce' },
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
  style?: string;
  brandTheme?: string;
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
  // Auth state
  const { user, isFederated, isLoading, refreshUser } = useAuth();
  const isLoggedIn = isFederated && user;

  // Sidebar tab state
  const [activeTab, setActiveTab] = useState<CanvasTab>('generate');

  // Main mode: text-to-image or image-to-image
  const [mainMode, setMainMode] = useState<'text2img' | 'img2img'>('text2img');

  // Text-to-Image state
  const [usage, setUsage] = useState(USAGE_OPTIONS[0].value);
  const [assetType, setAssetType] = useState(ASSET_TYPE_OPTIONS[0].value);
  const [style, setStyle] = useState(STYLE_OPTIONS[0].value);
  const [brandTheme, setBrandTheme] = useState(BRAND_THEME_OPTIONS[0].value);
  const [applyBrandColorsToImage, setApplyBrandColorsToImage] = useState(false);
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
  const checkUserApiKeys = async () => {
    const configured: Record<string, boolean> = {};
    for (const opt of IMAGE_PROVIDER_OPTIONS) {
      configured[opt.value] = await hasApiKey(opt.value as 'openai' | 'stability' | 'replicate' | 'anthropic');
    }
    setUserApiKeyConfigured(configured);
  };

  useEffect(() => {
    fetchHistory();
    applyBrandColors();
    checkUserApiKeys();
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

  const toggleVariant = (variantKey: string) => {
    setSelectedVariants(prev => {
      if (prev.includes(variantKey)) {
        if (variantKey === 'master') return prev;
        return prev.filter(v => v !== variantKey);
      } else {
        return [...prev, variantKey];
      }
    });
  };

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
    setLoading(true);
    setResult(null);

    try {
      const userApiKey = await getApiKey(imageProvider as 'openai' | 'stability' | 'replicate' | 'anthropic');

      const requestBody: Record<string, unknown> = {
        usage,
        asset_type: assetType,
        style,
        brand_theme: brandTheme,
        apply_brand_colors: applyBrandColorsToImage,
        title,
        subject,
        additionalDetails: details,
        generate_mode: generateMode,
        image_provider: imageProvider,
      };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.success) {
        const imageUrl = data.imageUrl || data.image_url;
        const prompt = data.prompt || data.prompt_used;

        if (data.generate_mode === 'asset_set' && data.asset_set) {
          setResult({
            imageUrl: data.asset_set.master?.url || imageUrl,
            prompt,
            generate_mode: 'asset_set',
            asset_set: data.asset_set
          });
        } else {
          setResult({ imageUrl, prompt, generate_mode: 'single' });
        }
        fetchHistory();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usage,
          asset_type: assetType,
          style,
          brand_theme: brandTheme,
          apply_brand_colors: applyBrandColorsToImage,
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
        fetchHistory();
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
    setTitle(item.title || item.subject);
    setSubject(item.subject);
    setUsage(item.usage);
    setDimension(item.dimension);
    if (item.style) setStyle(item.style);
    if (item.brandTheme) setBrandTheme(item.brandTheme);
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
      const userApiKey = await getApiKey('stability');

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

  // Render the text-to-image content
  const renderText2ImgContent = () => (
    <div className={styles.grid}>
      {/* Left Sidebar: Configuration Form */}
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <span className={styles.stepNumber}>1</span>
            Configuration
          </div>
        </div>
        <div className={styles.sidebarContent}>
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
              label="Style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              options={STYLE_OPTIONS}
            />

            <Select
              label="Brand Theme"
              value={brandTheme}
              onChange={(e) => setBrandTheme(e.target.value)}
              options={BRAND_THEME_OPTIONS}
            />

            {brandTheme !== 'none' && (
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id="applyBrandColors"
                  checked={applyBrandColorsToImage}
                  onChange={(e) => setApplyBrandColorsToImage(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <label htmlFor="applyBrandColors" className={styles.checkboxLabel}>
                  Apply brand colors to image
                </label>
              </div>
            )}

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
                    <label key={variant.key} className={styles.variantLabel}>
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
              placeholder="e.g., 'Modern optimization dashboard'"
              required
            />

            <Textarea
              label="Additional Details (Optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Lighting, specific elements..."
              rows={2}
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
        </div>
      </div>

      {/* Center Column: Image Preview */}
      <div className={styles.centerColumn}>
        <div className={styles.previewHeader}>
          <div className={styles.previewTitle}>
            <span className={styles.stepNumber}>2</span>
            Visual Output
            {result?.generate_mode === 'asset_set' && (
              <span className={styles.assetSetBadge}>Asset Set</span>
            )}
          </div>
        </div>
        <div className={styles.previewContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>{loadingText}</span>
            </div>
          ) : result?.generate_mode === 'asset_set' && result.asset_set ? (
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
          ) : result?.imageUrl ? (
            <>
              <div
                className={styles.previewImageWrapper}
                onClick={() => setShowPreview(true)}
                title="Click to preview full size"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.imageUrl}
                  alt={subject}
                  className={styles.previewImage}
                />
              </div>
              <div className={styles.previewActions}>
                <Button
                  variant="secondary"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={() => handleDownload()}
                >
                  Download
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Edit className="w-4 h-4" />}
                  onClick={() => setShowRevision(!showRevision)}
                  disabled={loading}
                >
                  Revise
                </Button>
              </div>
              {showRevision && (
                <div className={styles.revisionContainer}>
                  <Textarea
                    value={revisionText}
                    onChange={(e) => setRevisionText(e.target.value)}
                    placeholder="Describe what changes you want..."
                    rows={2}
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
          ) : (
            <div className={styles.previewPlaceholder}>
              <ImageIcon size={64} />
              <p>Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Prompt Data + Recent Generations */}
      <div className={styles.rightSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <span className={styles.stepNumber}>3</span>
            Output Data
          </div>
        </div>
        <div className={styles.sidebarContent}>
          {/* Prompt Section */}
          <div className={styles.promptSection}>
            <div className={styles.promptHeader}>
              <span className={styles.promptLabel}>
                <FileText className="w-4 h-4" style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Generated Prompt
              </span>
              {result?.prompt && (
                <button
                  className={styles.copyButton}
                  onClick={handleCopyPrompt}
                  title="Copy to Clipboard"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <div className={styles.promptContainer}>
              {result?.prompt ? (
                <pre className={styles.promptText}>{result.prompt}</pre>
              ) : (
                <p className={styles.emptyPrompt}>Prompt will appear here...</p>
              )}
            </div>
          </div>

          {/* Recent Generations Grid */}
          <div className={styles.generationsSection}>
            <div className={styles.generationsHeader}>
              <Grid className="w-4 h-4" style={{ color: '#0ea5e9' }} />
              <span className={styles.generationsLabel}>Recent Generations</span>
            </div>
            <div className={styles.generationsGrid}>
              {history.length > 0 ? (
                history.slice(0, 8).map((item, idx) => (
                  <div
                    key={idx}
                    className={styles.generationThumb}
                    onClick={() => selectFromHistory(item)}
                    title={item.title || item.subject}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.title || item.subject} />
                  </div>
                ))
              ) : (
                <p className={styles.emptyGenerations}>No generations yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the image-to-image content
  const renderImg2ImgContent = () => (
    <div className={styles.grid}>
      {/* Left Sidebar: Source & Settings */}
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <span className={styles.stepNumber}>1</span>
            Source & Settings
          </div>
        </div>
        <div className={styles.sidebarContent}>
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
                  Stability AI {userApiKeyConfigured['stability'] ? '(Your key)' : '(Server key)'}
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
              <div className={styles.errorMessage}>{img2imgError}</div>
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
        </div>
      </div>

      {/* Center Column: Comparison View */}
      <div className={styles.centerColumn}>
        <div className={styles.previewHeader}>
          <div className={styles.previewTitle}>
            <span className={styles.stepNumber}>2</span>
            Comparison
            {img2imgResult && <span className={styles.img2imgBadge}>Styled</span>}
          </div>
        </div>
        <div className={styles.previewContent}>
          {img2imgLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner} />
              <span className={styles.loadingText}>Applying style transformation...</span>
            </div>
          ) : img2imgResult ? (
            <ComparisonView
              originalImage={img2imgResult.originalImage}
              styledImage={img2imgResult.styledImage}
              onDownload={handleImg2ImgDownload}
              onRegenerate={handleImg2ImgRegenerate}
              loading={img2imgLoading}
            />
          ) : (
            <div className={styles.previewPlaceholder}>
              <Sparkles size={64} />
              <p>Upload an image and click Apply Style to see the comparison</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Style Details */}
      <div className={styles.rightSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>
            <span className={styles.stepNumber}>3</span>
            Style Details
          </div>
        </div>
        <div className={styles.sidebarContent}>
          <div className={styles.promptSection}>
            <div className={styles.promptHeader}>
              <span className={styles.promptLabel}>
                <FileText className="w-4 h-4" style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Style Prompt
              </span>
            </div>
            <div className={styles.promptContainer}>
              {img2imgResult?.prompt ? (
                <pre className={styles.promptText}>{img2imgResult.prompt}</pre>
              ) : (
                <p className={styles.emptyPrompt}>Style prompt will appear here after transformation</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle tab change - switch to settings modal when settings tab is selected
  const handleTabChange = (tab: CanvasTab) => {
    if (tab === 'settings') {
      openSettings();
    } else {
      setActiveTab(tab);
    }
  };

  // Redirect to login when not authenticated
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, router]);

  // Show loading state while checking auth or redirecting
  if (isLoading || !isLoggedIn) {
    return (
      <div className={styles.loadingScreen}>
        <BrandLogo height={64} />
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.appLayout}>
      {/* Fixed Header */}
      <AppHeader
        logo={<BrandLogo height={32} />}
        toolSwitcher={<ToolSwitcher />}
        settingsButton={
          <>
            <UserMenu />
            <Button variant="icon" onClick={openSettings} title="Settings">
              <Settings className="w-5 h-5" />
            </Button>
          </>
        }
      />

      {/* Main Content Area with Sidebar */}
      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <CanvasSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Content Area */}
        <main className={styles.main}>
          <div className={styles.container}>
            {/* Generate Tab */}
            {activeTab === 'generate' && (
              <>
                {/* Main Mode Tabs */}
                <div className={styles.mainModeTabs}>
                  <Button
                    variant={mainMode === 'text2img' ? 'primary' : 'ghost'}
                    leftIcon={<Type className="w-4 h-4" />}
                    onClick={() => setMainMode('text2img')}
                  >
                    Text to Image
                  </Button>
                  <Button
                    variant={mainMode === 'img2img' ? 'primary' : 'ghost'}
                    leftIcon={<ImagePlus className="w-4 h-4" />}
                    onClick={() => setMainMode('img2img')}
                  >
                    Image to Image
                  </Button>
                </div>

                {mainMode === 'text2img' ? renderText2ImgContent() : renderImg2ImgContent()}
              </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className={styles.tabContent}>
                <div className={styles.tabHeader}>
                  <h1>Generation History</h1>
                  <p>View and reuse your previous generations</p>
                </div>
                <div className={styles.historyFullGrid}>
                  {history.length > 0 ? (
                    history.map((item, idx) => (
                      <div
                        key={idx}
                        className={styles.historyFullItem}
                        onClick={() => {
                          selectFromHistory(item);
                          setActiveTab('generate');
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={item.title || item.subject} />
                        <div className={styles.historyFullInfo}>
                          <span className={styles.historyFullTitle}>{item.title || item.subject}</span>
                          <span className={styles.historyFullMeta}>{item.dimension} | {item.style || 'Default'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <Grid size={48} />
                      <p>No generation history yet</p>
                      <p className={styles.emptyStateHint}>Generate images to see them here</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className={styles.tabContent}>
                <div className={styles.tabHeader}>
                  <h1>Templates</h1>
                  <p>Quick start with pre-configured templates</p>
                </div>
                <div className={styles.emptyState}>
                  <Sparkles size={48} />
                  <p>Templates coming soon</p>
                  <p className={styles.emptyStateHint}>Pre-configured templates for common use cases</p>
                </div>
              </div>
            )}

            <footer className={styles.footer}>
              <p>API Endpoint: <code className={styles.code}>POST /api/generate</code></p>
              <p className={styles.versionTag}>{APP_VERSION}</p>
              <p className={styles.footerBrand}>
                <a href={brand.links.website} target="_blank" rel="noopener noreferrer">
                  {brand.footer}
                </a>
              </p>
            </footer>
          </div>
        </main>
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
          checkUserApiKeys();
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
                  Customize the visual style guide used for generating images.
                </p>
                {styleGuideLoading && !styleGuide ? (
                  <div className={styles.settingsLoading}>Loading...</div>
                ) : (
                  <Textarea
                    value={styleGuide}
                    onChange={(e) => setStyleGuide(e.target.value)}
                    className={styles.styleGuideEditor}
                    placeholder="Enter your style guide here..."
                    rows={15}
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

    </div>
  );
}
