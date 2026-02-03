'use client';

import React from 'react';
import styles from '../page.module.css';
import { Button } from '@/ui/components/Button/Button';
import {
  Type,
  RefreshCw,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { labelStyle, inputStyle, selectStyle, chipStyle, sectionGap } from '../sharedStyles';
import type { WizardState } from '../useLogoWizard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_OPTIONS = [
  'Inter',
  'Montserrat',
  'Playfair Display',
  'Roboto',
  'Poppins',
  'Raleway',
  'Open Sans',
  'Oswald',
];

const FONT_WEIGHT_OPTIONS = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
];

const LAYOUT_LABELS: Record<string, string> = {
  horizontal: 'Horizontal',
  stacked: 'Stacked',
  inverted: 'Inverted',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LockupStepProps {
  wizard: WizardState;
}

export default function LockupStep({ wizard }: LockupStepProps) {
  const {
    brandName,
    selectedIconTransparent,
    lockupFontFamily,
    lockupFontWeight,
    lockupTextColor,
    lockupVariations,
    selectedLockupIndex,
    loading,
    error,
    setFormField,
    handleGenerateLockups,
    handleProceedToExport,
  } = wizard;

  const selected = lockupVariations[selectedLockupIndex] ?? null;

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
          <Type style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            Lockup Settings
          </span>
        </div>

        {/* Icon Thumbnail */}
        {selectedIconTransparent && (
          <div style={sectionGap}>
            <div style={labelStyle}>Selected Icon</div>
            <div className={styles.iconThumbnail}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedIconTransparent}
                alt="Selected icon"
              />
            </div>
          </div>
        )}

        {/* Brand Name */}
        <div style={sectionGap}>
          <div style={labelStyle}>Brand Name</div>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setFormField('brandName', e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Font Family */}
        <div style={sectionGap}>
          <div style={labelStyle}>Font Family</div>
          <div style={{ position: 'relative' }}>
            <select
              value={lockupFontFamily}
              onChange={(e) => setFormField('lockupFontFamily', e.target.value)}
              style={selectStyle}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
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

        {/* Font Weight */}
        <div style={sectionGap}>
          <div style={labelStyle}>Font Weight</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FONT_WEIGHT_OPTIONS.map((w) => (
              <button
                key={w.value}
                onClick={() => setFormField('lockupFontWeight', w.value)}
                style={chipStyle(lockupFontWeight === w.value)}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div style={sectionGap}>
          <div style={labelStyle}>Text Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={lockupTextColor || '#000000'}
              onChange={(e) => setFormField('lockupTextColor', e.target.value)}
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
              placeholder="#000000"
              value={lockupTextColor}
              onChange={(e) => setFormField('lockupTextColor', e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
          </div>
        </div>

        {/* Regenerate Button */}
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleGenerateLockups}
            disabled={loading}
            isLoading={loading}
            leftIcon={<RefreshCw size={16} />}
            style={{ width: '100%' }}
          >
            {loading ? 'Generating...' : 'Regenerate Lockups'}
          </Button>
        </div>
      </aside>

      {/* ---- CENTER GRID ---- */}
      <div className={styles.gridArea}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>Generating lockup variations...</span>
          </div>
        ) : lockupVariations.length > 0 ? (
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
                Lockup Variations ({lockupVariations.length})
              </span>
            </div>

            <div className={styles.lockupGrid}>
              {lockupVariations.map((v, i) => (
                <div
                  key={v.layout}
                  className={`${styles.lockupCard} ${
                    selectedLockupIndex === i ? styles.active : ''
                  }`}
                  onClick={() => setFormField('selectedLockupIndex', i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.dataUrl}
                    alt={`${LAYOUT_LABELS[v.layout]} lockup`}
                  />
                  <span className={styles.lockupCardLabel}>
                    {LAYOUT_LABELS[v.layout]}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <Type size={64} />
            <p className={styles.emptyStateText}>No lockups generated</p>
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
            <div className={styles.previewImage} style={{ aspectRatio: 'auto' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.dataUrl}
                alt={`${LAYOUT_LABELS[selected.layout]} lockup preview`}
                style={{ maxHeight: '400px' }}
              />
            </div>

            <p
              style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              {LAYOUT_LABELS[selected.layout]} layout
            </p>

            {/* Next Step */}
            <div style={{ marginTop: 'auto' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToExport}
                disabled={loading}
                isLoading={loading}
                leftIcon={loading ? undefined : <ArrowRight size={16} />}
                style={{ width: '100%' }}
              >
                {loading ? 'Generating...' : 'Next: Export'}
              </Button>
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
            Select a lockup variation to preview
          </div>
        )}
      </aside>
    </>
  );
}
