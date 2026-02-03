'use client';

import React, { useState } from 'react';
import styles from '../page.module.css';
import { Button } from '@/ui/components/Button/Button';
import {
  Download,
  RotateCcw,
} from 'lucide-react';
import { labelStyle } from '../sharedStyles';
import type { WizardState, ExportVariant } from '../useLogoWizard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the CSS class for the display background behind each variant card. */
function getDisplayBgClass(variant: ExportVariant['variant']): string {
  switch (variant) {
    case 'icon-only':
      return styles.checkerboard;
    case 'dark-text':
      return styles.lightDisplayBg;
    case 'light-text':
      return styles.darkDisplayBg;
    default:
      return '';
  }
}

/** Return the CSS class for the preview panel background. */
function getPreviewBgClass(variant: ExportVariant['variant']): string {
  switch (variant) {
    case 'icon-only':
      return styles.checkerboard;
    case 'dark-text':
      return styles.lightDisplayBg;
    case 'light-text':
      return styles.darkDisplayBg;
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExportStepProps {
  wizard: WizardState;
}

export default function ExportStep({ wizard }: ExportStepProps) {
  const {
    brandName,
    exportVariants,
    error,
    handleDownload,
    handleDownloadAll,
    resetWizard,
  } = wizard;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = exportVariants[selectedIndex] ?? null;

  const safeName = brandName.trim().replace(/\s+/g, '-').toLowerCase() || 'logo';

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
          <Download style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            Export
          </span>
        </div>

        {/* Info text */}
        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              lineHeight: 1.5,
            }}
          >
            All exports have transparent backgrounds. The display backgrounds below
            are just for preview clarity.
          </p>
        </div>

        {/* Variant list */}
        <div style={{ marginBottom: '20px' }}>
          <div style={labelStyle}>Variants</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {exportVariants.map((v, i) => (
              <button
                key={v.variant}
                onClick={() => setSelectedIndex(i)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: selectedIndex === i
                    ? '1px solid #0ea5e9'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: selectedIndex === i
                    ? 'rgba(14, 165, 233, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: selectedIndex === i ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                {v.label}
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginTop: '2px',
                  }}
                >
                  {v.variant === 'icon-only'
                    ? 'Icon without text'
                    : v.variant === 'dark-text'
                    ? 'For light backgrounds'
                    : 'For dark backgrounds'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Download buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownloadAll}
            leftIcon={<Download size={16} />}
            style={{ width: '100%' }}
          >
            Download All
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={resetWizard}
            leftIcon={<RotateCcw size={14} />}
            style={{ width: '100%' }}
          >
            Start Over
          </Button>
        </div>
      </aside>

      {/* ---- CENTER GRID ---- */}
      <div className={styles.gridArea}>
        {exportVariants.length > 0 ? (
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
                Export Variants ({exportVariants.length})
              </span>
            </div>

            <div className={styles.exportGrid}>
              {exportVariants.map((v, i) => (
                <div
                  key={v.variant}
                  className={`${styles.exportCard} ${
                    selectedIndex === i ? styles.active : ''
                  }`}
                  onClick={() => setSelectedIndex(i)}
                >
                  <div className={`${styles.exportCardImage} ${getDisplayBgClass(v.variant)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.dataUrl}
                      alt={v.label}
                    />
                  </div>
                  <div className={styles.exportCardLabel}>
                    {v.label}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <Download size={64} />
            <p className={styles.emptyStateText}>No export variants generated</p>
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
            {/* Large preview with display background */}
            <div
              className={`${styles.previewImage} ${getPreviewBgClass(selected.variant)}`}
              style={{ aspectRatio: 'auto', minHeight: '200px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.dataUrl}
                alt={`${selected.label} preview`}
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
              {selected.label} — transparent PNG
            </p>

            {/* Download this variant */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                handleDownload(selected, `${safeName}-${selected.variant}.png`)
              }
              leftIcon={<Download size={14} />}
              style={{ width: '100%' }}
            >
              Download {selected.label}
            </Button>
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
            Select a variant to preview
          </div>
        )}
      </aside>
    </>
  );
}
