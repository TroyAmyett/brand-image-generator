'use client';

import React, { useState } from 'react';
import styles from '../page.module.css';
import { Button } from '@/ui/components/Button/Button';
import { ImageLightbox } from '@/ui/components/ImageLightbox';
import {
  Download,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { labelStyle, sectionGap } from '../sharedStyles';
import type { CharacterWizardState } from '../useCharacterWizard';

type BgOption = 'dark' | 'light' | 'transparent';

const BG_OPTIONS: { id: BgOption; label: string; className: string }[] = [
  { id: 'dark', label: 'Dark', className: 'darkDisplayBg' },
  { id: 'light', label: 'Light', className: 'lightDisplayBg' },
  { id: 'transparent', label: 'Transparent', className: 'checkerboard' },
];

interface ExportStepProps {
  wizard: CharacterWizardState;
}

export default function ExportStep({ wizard }: ExportStepProps) {
  const {
    characterName,
    role,
    product,
    characterVariations,
    selectedCharacterIndex,
    poseVariations,
    selectedPoseIndex,
    saving,
    error,
    handleDownload,
    handleSaveCharacter,
    resetWizard,
  } = wizard;

  // Determine the final hero image
  const heroImage = poseVariations.length > 0
    ? poseVariations[selectedPoseIndex]
    : characterVariations[selectedCharacterIndex]?.imageUrl ?? null;

  const [selectedBg, setSelectedBg] = useState<BgOption>('dark');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const safeName = characterName.trim().replace(/\s+/g, '-').toLowerCase() || 'character';

  return (
    <>
      {/* LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Download style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            Export & Save
          </span>
        </div>

        {/* Character Summary */}
        {heroImage && (
          <div style={sectionGap}>
            <div className={styles.characterThumbnail}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="Final character" />
            </div>
          </div>
        )}

        {characterName && (
          <div style={sectionGap}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              {characterName}
            </p>
            {role && (
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                {role}{product ? ` — ${product}` : ''}
              </p>
            )}
          </div>
        )}

        {/* HeyGen Specs Info */}
        <div style={sectionGap}>
          <div style={labelStyle}>HeyGen AV4 Specs</div>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.5 }}>
            Exported as PNG at the generated resolution. HeyGen Avatar IV requires
            JPEG or PNG format, minimum 1024px wide, chest-up framing with centered face.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}>
          {heroImage && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleDownload(heroImage, `${safeName}-heygen.png`)}
              leftIcon={<Download size={16} />}
              style={{ width: '100%' }}
            >
              Download for HeyGen
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveCharacter}
            disabled={saving || !heroImage}
            isLoading={saving}
            leftIcon={<Save size={14} />}
            style={{ width: '100%' }}
          >
            {saving ? 'Saving...' : 'Save to Library'}
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

      {/* CENTER AREA */}
      <div className={styles.gridArea}>
        {heroImage ? (
          <div className={styles.exportPreviewArea}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Final Character
              </span>
            </div>

            {/* Preview on different backgrounds */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%' }}>
              {BG_OPTIONS.map((bg) => {
                const active = selectedBg === bg.id;
                return (
                  <div
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.id)}
                    onDoubleClick={() => heroImage && setLightboxSrc(heroImage)}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: active
                        ? '2px solid #0ea5e9'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div
                      className={styles[bg.className]}
                      style={{ padding: '12px', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImage} alt={`On ${bg.label} background`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{
                      padding: '6px',
                      textAlign: 'center',
                      fontSize: '10px',
                      color: active ? '#0ea5e9' : 'rgba(255, 255, 255, 0.5)',
                      fontWeight: active ? 600 : 400,
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      background: 'rgba(0,0,0,0.3)',
                    }}>
                      {bg.label}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* HeyGen Spec Checklist */}
            <div style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '12px' }}>
                HeyGen AV4 Checklist
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Format: PNG', pass: true },
                  { label: 'Resolution: ≥1024px', pass: true },
                  { label: 'Framing: Chest-up portrait', pass: true },
                  { label: 'Expression: Suitable for animation', pass: true },
                  { label: 'Gaze: Front-facing', pass: true },
                ].map((spec) => (
                  <div key={spec.label} className={`${styles.specBadge} ${spec.pass ? styles.pass : styles.warn}`}>
                    {spec.pass ? <Check size={12} /> : <AlertTriangle size={12} />}
                    {spec.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Download size={64} />
            <p className={styles.emptyStateText}>No character to export</p>
          </div>
        )}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      {/* RIGHT PREVIEW PANEL */}
      <aside className={styles.previewPanel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
          Preview
        </div>
        {heroImage ? (
          <>
            <div
              className={`${styles.previewImage} ${styles[BG_OPTIONS.find(b => b.id === selectedBg)!.className]}`}
              style={{ borderRadius: '12px', cursor: 'zoom-in' }}
              onDoubleClick={() => heroImage && setLightboxSrc(heroImage)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="Final character preview" />
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginBottom: '20px' }}>
              {characterName || 'Character'} — {BG_OPTIONS.find(b => b.id === selectedBg)!.label} background
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDownload(heroImage, `${safeName}-heygen.png`)}
              leftIcon={<Download size={14} />}
              style={{ width: '100%' }}
            >
              Download PNG
            </Button>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
            No character selected
          </div>
        )}
      </aside>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Character enlarged" onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
