'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, Code, X, Layers, Sparkles, RotateCcw, Box, Image as ImageIcon } from 'lucide-react';
import { AppHeader } from '@/ui/components/AppHeader/AppHeader';
import { CanvasToolNav } from '@/components/CanvasToolNav';
import { UserMenu } from '@/components/UserMenu';
import { Button } from '@/ui/components/Button/Button';
import { CascadeEffect, SpotlightEffect, TiltEffect, IsometricEffect } from '@/components/showcase/effects';
import {
  ShowcaseEffect,
  ShowcaseImage,
  EffectSettings,
  EFFECT_CONTROLS,
  CascadeSettings,
  SpotlightSettings,
  TiltSettings,
  IsometricSettings,
} from '@/lib/showcase/types';
import {
  SHOWCASE_PRESETS,
  getPresetsByEffect,
  getDefaultSettingsForEffect,
} from '@/lib/showcase/presets';
import { downloadShowcase, generateCSSSnippet } from '@/lib/showcase/export';
import styles from './page.module.css';

// ─────────────────────────────────────────────────────────────
// Effect Icons
// ─────────────────────────────────────────────────────────────

const EFFECT_INFO: Record<ShowcaseEffect, { name: string; icon: React.ReactNode; description: string }> = {
  cascade: {
    name: 'Cascade',
    icon: <Layers size={16} />,
    description: 'Linear-style layered panels',
  },
  spotlight: {
    name: 'Spotlight',
    icon: <Sparkles size={16} />,
    description: 'Floating element with glow',
  },
  tilt: {
    name: 'Tilt',
    icon: <RotateCcw size={16} />,
    description: '3D perspective rotation',
  },
  isometric: {
    name: 'Isometric',
    icon: <Box size={16} />,
    description: 'Stacked isometric view',
  },
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  // Effect selection
  const [effect, setEffect] = useState<ShowcaseEffect>('cascade');
  const [settings, setSettings] = useState<EffectSettings>(getDefaultSettingsForEffect('cascade'));
  const [activePreset, setActivePreset] = useState<string>('linear-hero');

  // Images
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export
  const [exporting, setExporting] = useState(false);
  const [showCSSModal, setShowCSSModal] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────
  // Effect change handler
  // ─────────────────────────────────────────────────────────────

  const handleEffectChange = useCallback((newEffect: ShowcaseEffect) => {
    setEffect(newEffect);
    setSettings(getDefaultSettingsForEffect(newEffect));
    const presets = getPresetsByEffect(newEffect);
    setActivePreset(presets[0]?.id || '');
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Preset selection
  // ─────────────────────────────────────────────────────────────

  const handlePresetSelect = useCallback((presetId: string) => {
    const preset = SHOWCASE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      setSettings({ ...preset.settings });
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Settings update
  // ─────────────────────────────────────────────────────────────

  const updateSetting = useCallback((key: string, value: number | string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setActivePreset(''); // Clear preset when manually adjusting
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Image upload
  // ─────────────────────────────────────────────────────────────

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const maxImages = effect === 'spotlight' || effect === 'tilt' ? 1 : 5;
    const currentCount = images.length;
    const availableSlots = maxImages - currentCount;

    if (availableSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, availableSlots);

    filesToProcess.forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          const newImage: ShowcaseImage = {
            id: `img-${Date.now()}-${index}`,
            dataUrl,
            order: currentCount + index,
            label: file.name,
            width: img.width,
            height: img.height,
          };
          setImages((prev) => [...prev, newImage]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }, [effect, images.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFileSelect]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  // Clear images when switching to single-image effects
  useEffect(() => {
    if ((effect === 'spotlight' || effect === 'tilt') && images.length > 1) {
      setImages((prev) => [prev[0]]);
    }
  }, [effect, images.length]);

  // ─────────────────────────────────────────────────────────────
  // Export handlers
  // ─────────────────────────────────────────────────────────────

  const handleExportPNG = useCallback(async () => {
    if (!previewRef.current || images.length === 0) return;

    setExporting(true);
    try {
      await downloadShowcase(previewRef.current, `showcase-${Date.now()}.png`, {
        width: 1920,
        height: 1080,
        format: 'png',
        scale: 2,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Try a different browser or reduce image complexity.');
    } finally {
      setExporting(false);
    }
  }, [images.length]);

  const handleExportWebP = useCallback(async () => {
    if (!previewRef.current || images.length === 0) return;

    setExporting(true);
    try {
      await downloadShowcase(previewRef.current, `showcase-${Date.now()}.webp`, {
        width: 1920,
        height: 1080,
        format: 'webp',
        scale: 2,
        quality: 0.9,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Try a different browser or reduce image complexity.');
    } finally {
      setExporting(false);
    }
  }, [images.length]);

  // ─────────────────────────────────────────────────────────────
  // Render effect preview
  // ─────────────────────────────────────────────────────────────

  const renderEffect = () => {
    const commonProps = {
      images,
      className: '',
    };

    switch (effect) {
      case 'cascade':
        return <CascadeEffect {...commonProps} settings={settings as CascadeSettings} />;
      case 'spotlight':
        return <SpotlightEffect {...commonProps} settings={settings as SpotlightSettings} />;
      case 'tilt':
        return <TiltEffect {...commonProps} settings={settings as TiltSettings} />;
      case 'isometric':
        return <IsometricEffect {...commonProps} settings={settings as IsometricSettings} />;
      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render controls for current effect
  // ─────────────────────────────────────────────────────────────

  const renderControls = () => {
    const controls = EFFECT_CONTROLS[effect];

    return controls.map((control) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (settings as any)[control.key];

      if (control.type === 'slider') {
        return (
          <div key={control.key} className={styles.controlGroup}>
            <div className={styles.controlLabel}>
              <span>{control.label}</span>
              <span className={styles.controlValue}>
                {typeof value === 'number' ? value.toFixed(control.step < 1 ? 2 : 0) : value}
                {control.unit || ''}
              </span>
            </div>
            <input
              type="range"
              className={styles.slider}
              min={control.min}
              max={control.max}
              step={control.step}
              value={value as number}
              onChange={(e) => updateSetting(control.key, parseFloat(e.target.value))}
            />
          </div>
        );
      }

      if (control.type === 'toggle') {
        return (
          <div key={control.key} className={styles.toggle}>
            <span className={styles.controlLabel}>{control.label}</span>
            <button
              className={`${styles.toggleSwitch} ${value ? styles.on : ''}`}
              onClick={() => updateSetting(control.key, !value)}
            />
          </div>
        );
      }

      if (control.type === 'color') {
        return (
          <div key={control.key} className={styles.controlGroup}>
            <div className={styles.controlLabel}>{control.label}</div>
            <div className={styles.colorControl}>
              <input
                type="color"
                className={styles.colorPicker}
                value={value as string}
                onChange={(e) => updateSetting(control.key, e.target.value)}
              />
              <input
                type="text"
                className={styles.colorInput}
                value={value as string}
                onChange={(e) => updateSetting(control.key, e.target.value)}
              />
            </div>
          </div>
        );
      }

      return null;
    });
  };

  // ─────────────────────────────────────────────────────────────
  // Image limits
  // ─────────────────────────────────────────────────────────────

  const maxImages = effect === 'spotlight' || effect === 'tilt' ? 1 : 5;
  const canAddMore = images.length < maxImages;
  const effectPresets = getPresetsByEffect(effect);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className={styles.appLayout}>
      <AppHeader
        toolSwitcher={<CanvasToolNav />}
        userMenu={<UserMenu />}
      />

      <div className={styles.mainLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Effect Selector */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>Effect</div>
            <div className={styles.effectGrid}>
              {(Object.keys(EFFECT_INFO) as ShowcaseEffect[]).map((eff) => (
                <button
                  key={eff}
                  className={`${styles.effectButton} ${effect === eff ? styles.active : ''}`}
                  onClick={() => handleEffectChange(eff)}
                  title={EFFECT_INFO[eff].description}
                >
                  {EFFECT_INFO[eff].icon}
                  <div style={{ marginTop: 4 }}>{EFFECT_INFO[eff].name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>Presets</div>
            <div className={styles.presetList}>
              {effectPresets.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.presetChip} ${activePreset === preset.id ? styles.active : ''}`}
                  onClick={() => handlePresetSelect(preset.id)}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>
              Images ({images.length}/{maxImages})
            </div>
            <div
              className={`${styles.uploadZone} ${dragging ? styles.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => canAddMore && fileInputRef.current?.click()}
              style={{ opacity: canAddMore ? 1 : 0.5, cursor: canAddMore ? 'pointer' : 'not-allowed' }}
            >
              <Upload size={24} className={styles.uploadIcon} />
              <div className={styles.uploadText}>
                {canAddMore ? 'Drop images or click to upload' : 'Maximum images reached'}
              </div>
              <div className={styles.uploadHint}>PNG, JPG, WebP</div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={maxImages > 1}
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            {images.length > 0 && (
              <div className={styles.imageList}>
                {images.map((img) => (
                  <div key={img.id} className={styles.imageItem}>
                    <img src={img.dataUrl} alt={img.label} className={styles.imageThumb} />
                    <div className={styles.imageInfo}>
                      <div className={styles.imageName}>{img.label || 'Image'}</div>
                      <div className={styles.imageSize}>
                        {img.width}×{img.height}
                      </div>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => removeImage(img.id)}
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>Settings</div>
            {renderControls()}
          </div>

          {/* Export */}
          <div className={styles.sidebarSection}>
            <div className={styles.sectionTitle}>Export</div>
            <div className={styles.exportButtons}>
              <button
                className={`${styles.exportButton} ${styles.primary}`}
                onClick={handleExportPNG}
                disabled={images.length === 0 || exporting}
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Download PNG'}
              </button>
              <button
                className={styles.exportButton}
                onClick={handleExportWebP}
                disabled={images.length === 0 || exporting}
              >
                <Download size={16} />
                Download WebP
              </button>
              <button
                className={styles.exportButton}
                onClick={() => setShowCSSModal(true)}
              >
                <Code size={16} />
                Copy CSS
              </button>
            </div>
          </div>
        </aside>

        {/* Preview Area */}
        <main className={styles.previewArea}>
          <div className={styles.previewHeader}>
            <span className={styles.previewTitle}>Preview</span>
            <span className={styles.previewDimensions}>1920 × 1080</span>
          </div>
          <div className={styles.previewContainer}>
            <div
              ref={previewRef}
              className={styles.previewWrapper}
              style={{ aspectRatio: '16 / 9' }}
            >
              {images.length > 0 ? (
                renderEffect()
              ) : (
                <div className={styles.emptyState}>
                  <ImageIcon size={48} className={styles.emptyIcon} />
                  <div className={styles.emptyText}>Upload images to get started</div>
                  <div className={styles.emptyHint}>
                    {effect === 'cascade' || effect === 'isometric'
                      ? 'Add 2-5 screenshots for best results'
                      : 'Add 1 screenshot'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* CSS Modal */}
      {showCSSModal && (
        <div className={styles.modal} onClick={() => setShowCSSModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>CSS Snippet</span>
              <button className={styles.modalClose} onClick={() => setShowCSSModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.codeBlock}>
                <pre>{generateCSSSnippet(settings)}</pre>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(generateCSSSnippet(settings));
                  setShowCSSModal(false);
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
