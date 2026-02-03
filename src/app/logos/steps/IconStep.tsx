'use client';

import React from 'react';
import styles from '../page.module.css';
import { Button } from '@/ui/components/Button/Button';
import {
  PenTool,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import {
  LogoStyle,
  LOGO_STYLE_LABELS,
  LOGO_STYLE_DESCRIPTIONS,
} from '@/lib/logoPrompt';
import { ImageProvider } from '@/lib/providers/types';
import { labelStyle, inputStyle, selectStyle, chipStyle, sectionGap } from '../sharedStyles';
import type { WizardState } from '../useLogoWizard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IconStepProps {
  wizard: WizardState;
}

export default function IconStep({ wizard }: IconStepProps) {
  const {
    brandName,
    description,
    selectedGuideId,
    logoStyle,
    colorPrimary,
    colorSecondary,
    colorAccent,
    provider,
    styleGuides,
    iconVariations,
    selectedIconIndex,
    loading,
    refining,
    removingBackground,
    error,
    refinement,
    setFormField,
    handleGenerateIcons,
    handleRefine,
    handleProceedToLockups,
  } = wizard;

  const canGenerate = brandName.trim().length > 0 && description.trim().length > 0;
  const selected = iconVariations[selectedIconIndex] ?? null;

  return (
    <>
      {/* ---- LEFT SIDEBAR ---- */}
      <aside className={styles.sidebar}>
        {/* Header */}
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
            Icon Generator
          </span>
        </div>

        {/* Brand Name */}
        <div style={sectionGap}>
          <div style={labelStyle}>Brand Name</div>
          <input
            type="text"
            placeholder="e.g. Acme Corp"
            value={brandName}
            onChange={(e) => setFormField('brandName', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div style={sectionGap}>
          <div style={labelStyle}>Description</div>
          <textarea
            placeholder="Describe your brand, its values, and what the icon should convey..."
            value={description}
            onChange={(e) => setFormField('description', e.target.value)}
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
                onChange={(e) => setFormField('selectedGuideId', e.target.value)}
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
                onClick={() => setFormField('logoStyle', s)}
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
          <div style={labelStyle}>
            {selectedGuideId ? 'Brand Colors' : 'Color Overrides (optional)'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { key: 'colorPrimary', value: colorPrimary, placeholder: 'Primary (#hex)', fallback: '#0ea5e9' },
              { key: 'colorSecondary', value: colorSecondary, placeholder: 'Secondary (#hex)', fallback: '#6366f1' },
              { key: 'colorAccent', value: colorAccent, placeholder: 'Accent (#hex)', fallback: '#f59e0b' },
            ].map(({ key, value, placeholder, fallback }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={value || fallback}
                  onChange={(e) => setFormField(key, e.target.value)}
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
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => setFormField(key, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            ))}
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
            onClick={handleGenerateIcons}
            disabled={!canGenerate || loading}
            isLoading={loading}
            leftIcon={<Sparkles size={16} />}
            style={{ width: '100%' }}
          >
            {loading ? 'Generating...' : 'Generate Icons'}
          </Button>
        </div>
      </aside>

      {/* ---- CENTER GRID ---- */}
      <div className={styles.gridArea}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>
              Generating {brandName ? `"${brandName}"` : ''} icon variations...
            </span>
          </div>
        ) : iconVariations.length > 0 ? (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Icon Variations ({iconVariations.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateIcons}
                disabled={loading}
                leftIcon={<RefreshCw size={14} />}
              >
                Regenerate
              </Button>
            </div>

            <div className={styles.variationsGrid}>
              {iconVariations.map((v, i) => (
                <div
                  key={i}
                  className={`${styles.variationCard} ${
                    selectedIconIndex === i ? styles.active : ''
                  }`}
                  onClick={() => setFormField('selectedIconIndex', i)}
                  title={`Variation ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.imageUrl}
                    alt={`${brandName} icon variation ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <PenTool size={64} />
            <p className={styles.emptyStateText}>No icons generated yet</p>
            <p className={styles.emptyStateHint}>
              Fill in the details on the left and click Generate to create icon variations
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
                alt={`${brandName} icon preview`}
              />
            </div>

            {/* Refine */}
            <div style={{ marginBottom: '20px' }}>
              <div style={labelStyle}>Refine</div>
              <textarea
                placeholder="Describe changes, e.g. 'make it more minimal' or 'simplify the shapes'..."
                value={refinement}
                onChange={(e) => setFormField('refinement', e.target.value)}
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

            {/* Next Step */}
            <div style={{ marginTop: 'auto' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToLockups}
                disabled={removingBackground}
                isLoading={removingBackground}
                leftIcon={removingBackground ? undefined : <ArrowRight size={16} />}
                style={{ width: '100%' }}
              >
                {removingBackground ? 'Processing...' : 'Next: Create Lockups'}
              </Button>
              {removingBackground && (
                <p
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    textAlign: 'center',
                    marginTop: '8px',
                  }}
                >
                  Removing background and generating lockups...
                </p>
              )}
            </div>
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
            Generate icons and select a variation to preview
          </div>
        )}
      </aside>
    </>
  );
}
