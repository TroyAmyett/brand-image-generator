'use client';

import React, { useState } from 'react';
import styles from '../page.module.css';
import { Button } from '@/ui/components/Button/Button';
import { ImageLightbox } from '@/ui/components/ImageLightbox';
import {
  Users,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { labelStyle, inputStyle, sectionGap } from '../sharedStyles';
import type { CharacterWizardState } from '../useCharacterWizard';

interface VariationsStepProps {
  wizard: CharacterWizardState;
}

export default function VariationsStep({ wizard }: VariationsStepProps) {
  const {
    characterName,
    role,
    product,
    characterVariations,
    selectedCharacterIndex,
    variationPrompt,
    numberOfVariations,
    poseVariations,
    selectedPoseIndex,
    generatingVariations,
    error,
    setFormField,
    handleGenerateVariations,
    handleProceedToExport,
  } = wizard;

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const baseImage = characterVariations[selectedCharacterIndex]?.imageUrl ?? null;
  const selected = poseVariations[selectedPoseIndex] ?? null;

  return (
    <>
      {/* LEFT SIDEBAR */}
      <aside className={styles.sidebar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Users style={{ width: '22px', height: '22px', color: '#0ea5e9', flexShrink: 0 }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
            Pose Variations
          </span>
        </div>

        {/* Base Character Thumbnail */}
        {baseImage && (
          <div style={sectionGap}>
            <div style={labelStyle}>Base Character</div>
            <div className={styles.characterThumbnail}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={baseImage} alt="Base character" />
            </div>
          </div>
        )}

        {/* Character Info (read-only) */}
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

        {/* Variation Prompt */}
        <div style={sectionGap}>
          <div style={labelStyle}>Variation Prompt (optional)</div>
          <textarea
            placeholder="Describe variations: e.g. 'slight head tilt, warm smile, different angle'..."
            value={variationPrompt}
            onChange={(e) => setFormField('variationPrompt', e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' as const, minHeight: '72px' }}
          />
        </div>

        {/* Number of Variations */}
        <div style={sectionGap}>
          <div style={labelStyle}>Number of Variations: {numberOfVariations}</div>
          <input
            type="range"
            min={2}
            max={6}
            value={numberOfVariations}
            onChange={(e) => setFormField('numberOfVariations', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#0ea5e9' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
            <span>2</span>
            <span>6</span>
          </div>
        </div>

        {/* Info text */}
        <div style={sectionGap}>
          <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.5 }}>
            Uses AI face consistency to generate the same character in different poses and expressions.
            Requires a Replicate API key.
          </p>
        </div>

        {/* Generate Button */}
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerateVariations}
            disabled={generatingVariations || !baseImage}
            isLoading={generatingVariations}
            leftIcon={<RefreshCw size={16} />}
            style={{ width: '100%' }}
          >
            {generatingVariations ? 'Generating...' : 'Generate Variations'}
          </Button>
        </div>
      </aside>

      {/* CENTER GRID */}
      <div className={styles.gridArea}>
        {generatingVariations ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <span className={styles.loadingText}>
              Generating consistent pose variations...
            </span>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>
              This may take up to 60 seconds
            </p>
          </div>
        ) : poseVariations.length > 0 ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                Pose Variations ({poseVariations.length})
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerateVariations}
                disabled={generatingVariations}
                leftIcon={<RefreshCw size={14} />}
              >
                Regenerate
              </Button>
            </div>
            <div className={styles.poseGrid}>
              {poseVariations.map((dataUrl, i) => (
                <div
                  key={i}
                  className={`${styles.poseCard} ${selectedPoseIndex === i ? styles.active : ''}`}
                  onClick={() => setFormField('selectedPoseIndex', i)}
                  onDoubleClick={() => setLightboxSrc(dataUrl)}
                  title={`Pose ${i + 1} — double-click to enlarge`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUrl} alt={`Pose variation ${i + 1}`} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <Users size={64} />
            <p className={styles.emptyStateText}>No pose variations yet</p>
            <p className={styles.emptyStateHint}>
              Click Generate to create consistent pose variations of your character
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
            <div className={styles.previewImage} onDoubleClick={() => setLightboxSrc(selected)} style={{ cursor: 'zoom-in' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected} alt="Selected pose preview" />
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginBottom: '20px' }}>
              Pose {selectedPoseIndex + 1} of {poseVariations.length}
            </p>
            <div style={{ marginTop: 'auto' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToExport}
                leftIcon={<ArrowRight size={16} />}
                style={{ width: '100%' }}
              >
                Next: Export
              </Button>
            </div>
          </>
        ) : baseImage ? (
          <>
            <div className={styles.previewImage} onDoubleClick={() => setLightboxSrc(baseImage)} style={{ cursor: 'zoom-in' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={baseImage} alt="Base character" />
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginBottom: '20px' }}>
              Base character from Step 1
            </p>
            <div style={{ marginTop: 'auto' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleProceedToExport}
                leftIcon={<ArrowRight size={16} />}
                style={{ width: '100%' }}
              >
                Skip — Use Base Character
              </Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.3)', fontSize: '13px', textAlign: 'center', padding: '2rem' }}>
            Generate variations to preview
          </div>
        )}
      </aside>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} alt="Character enlarged" onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
