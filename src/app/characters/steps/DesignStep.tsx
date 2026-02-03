'use client';

import React, { useState, useCallback } from 'react';
import styles from '../page.module.css';
import { Button } from '@/ui/components/Button/Button';
import { ImageLightbox } from '@/ui/components/ImageLightbox';
import {
  User,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ArrowRight,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { SETTING_OPTIONS, EXPRESSION_OPTIONS, ASPECT_RATIO_OPTIONS } from '@/lib/characterPrompt';
import { ImageProvider } from '@/lib/providers/types';
import { labelStyle, inputStyle, selectStyle, chipStyle, sectionGap } from '../sharedStyles';
import type { CharacterWizardState } from '../useCharacterWizard';

const PROVIDERS: { id: ImageProvider; label: string }[] = [
  { id: 'openai', label: 'OpenAI GPT Image' },
  { id: 'stability', label: 'Stability AI' },
  { id: 'replicate', label: 'Replicate (Flux)' },
];

interface DesignStepProps {
  wizard: CharacterWizardState;
}

export default function DesignStep({ wizard }: DesignStepProps) {
  const {
    characterName,
    role,
    product,
    description,
    setting,
    expression,
    outfitDescription,
    brandAccentColor,
    customSettingDescription,
    provider,
    aspectRatio,
    characterVariations,
    selectedCharacterIndex,
    loading,
    error,
    savedCharacters,
    setFormField,
    handleGenerateCharacter,
    handleUploadCharacter,
    handleLoadCharacter,
    handleProceedToVariations,
  } = wizard;

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const canGenerate = description.trim().length > 0;
  const selected = characterVariations[selectedCharacterIndex] ?? null;

  const handleFileUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        handleUploadCharacter(dataUrl);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [handleUploadCharacter]);

  return (
    <>
      {/* LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <User style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            Character Design
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
                      <img
                        src={char.heroImage || char.referenceImage}
                        alt={char.name}
                      />
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

        {/* Upload Existing Photo */}
        <div style={sectionGap}>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFileUpload}
            disabled={loading}
            leftIcon={<Upload size={14} />}
            style={{ width: '100%' }}
          >
            Upload Existing Photo
          </Button>
        </div>

        <hr className={styles.sidebarDivider} />

        {/* Character Name */}
        <div style={sectionGap}>
          <div style={labelStyle}>Character Name</div>
          <input
            type="text"
            placeholder="e.g. Sophia"
            value={characterName}
            onChange={(e) => setFormField('characterName', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Role */}
        <div style={sectionGap}>
          <div style={labelStyle}>Role</div>
          <input
            type="text"
            placeholder="e.g. AI News Analyst"
            value={role}
            onChange={(e) => setFormField('role', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Product */}
        <div style={sectionGap}>
          <div style={labelStyle}>Product (optional)</div>
          <input
            type="text"
            placeholder="e.g. Radar"
            value={product}
            onChange={(e) => setFormField('product', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Visual Description */}
        <div style={sectionGap}>
          <div style={labelStyle}>Visual Description</div>
          <textarea
            placeholder="Describe the character: age, ethnicity, hair, distinguishing features..."
            value={description}
            onChange={(e) => setFormField('description', e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '72px' }}
          />
        </div>

        {/* Setting */}
        <div style={sectionGap}>
          <div style={labelStyle}>Setting</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SETTING_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setFormField('setting', s.id)}
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
                onChange={(e) => setFormField('customSettingDescription', e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
        </div>

        {/* Expression */}
        <div style={sectionGap}>
          <div style={labelStyle}>Expression</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {EXPRESSION_OPTIONS.map((exp) => (
              <button
                key={exp.id}
                onClick={() => setFormField('expression', exp.id)}
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
                onClick={() => setFormField('aspectRatio', ar.id)}
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
            onChange={(e) => setFormField('outfitDescription', e.target.value)}
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
              onChange={(e) => setFormField('brandAccentColor', e.target.value)}
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
              onChange={(e) => setFormField('brandAccentColor', e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Provider */}
        <div style={sectionGap}>
          <div style={labelStyle}>Provider</div>
          <div style={{ position: 'relative' }}>
            <select
              value={provider}
              onChange={(e) => setFormField('provider', e.target.value)}
              style={selectStyle}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
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

        {/* Action Buttons */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateCharacter}
            disabled={!canGenerate || loading}
            isLoading={loading}
            leftIcon={<Sparkles size={16} />}
            style={{ width: '100%' }}
          >
            {loading ? 'Generating...' : characterVariations.length > 0 ? 'Regenerate Character' : 'Generate Character'}
          </Button>
          {characterVariations.length > 0 && (
            <Button
              variant="secondary"
              size="lg"
              onClick={handleProceedToVariations}
              leftIcon={<ArrowRight size={16} />}
              style={{ width: '100%' }}
            >
              Next: Variations
            </Button>
          )}
          {characterVariations.length > 0 && !canGenerate && (
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', margin: 0 }}>
              Fill in Visual Description to regenerate with new settings
            </p>
          )}
        </div>
      </aside>

      {/* CENTER GRID */}
      <div className={styles.gridArea}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>
              Generating character{characterName ? ` "${characterName}"` : ''}...
            </span>
          </div>
        ) : characterVariations.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Character Variations ({characterVariations.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateCharacter}
                disabled={loading}
                leftIcon={<RefreshCw size={14} />}
              >
                Regenerate
              </Button>
            </div>
            <div className={styles.variationsGrid}>
              {characterVariations.map((v, i) => (
                <div
                  key={i}
                  className={`${styles.variationCard} ${selectedCharacterIndex === i ? styles.active : ''}`}
                  onClick={() => setFormField('selectedCharacterIndex', i)}
                  onDoubleClick={() => setLightboxSrc(v.imageUrl)}
                  title={`Variation ${i + 1} — double-click to enlarge`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.imageUrl} alt={`${characterName || 'Character'} variation ${i + 1}`} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <User size={64} />
            <p className={styles.emptyStateText}>No characters generated yet</p>
            <p className={styles.emptyStateHint}>
              Fill in the character details on the left and click Generate
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
            <div className={styles.previewImage} onDoubleClick={() => setLightboxSrc(selected.imageUrl)} style={{ cursor: 'zoom-in' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.imageUrl} alt={`${characterName || 'Character'} preview`} />
            </div>
            {characterName && (
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', textAlign: 'center', marginBottom: '4px' }}>
                {characterName}
              </p>
            )}
            {role && (
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginBottom: '20px' }}>
                {role}{product ? ` — ${product}` : ''}
              </p>
            )}
            <div style={{ marginTop: 'auto' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToVariations}
                leftIcon={<ArrowRight size={16} />}
                style={{ width: '100%' }}
              >
                Next: Variations
              </Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
            Generate characters and select a variation to preview
          </div>
        )}
      </aside>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Character enlarged" onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
