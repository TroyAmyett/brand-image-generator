'use client';

import { Palette, Sparkles, Wand2 } from 'lucide-react';
import styles from './TransformationModeSelector.module.css';

export type TransformationMode = 'style_transfer' | 'reimagine' | 'enhance_brand';

interface TransformationModeOption {
  value: TransformationMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const TRANSFORMATION_MODES: TransformationModeOption[] = [
  {
    value: 'style_transfer',
    label: 'Style Transfer',
    description: 'Keep composition, apply brand aesthetic',
    icon: <Palette className="w-5 h-5" />
  },
  {
    value: 'reimagine',
    label: 'Reimagine',
    description: 'Create new interpretation inspired by source',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    value: 'enhance_brand',
    label: 'Enhance & Brand',
    description: 'Subtle color grading and enhancement',
    icon: <Wand2 className="w-5 h-5" />
  }
];

interface TransformationModeSelectorProps {
  value: TransformationMode;
  onChange: (mode: TransformationMode) => void;
  disabled?: boolean;
}

export default function TransformationModeSelector({
  value,
  onChange,
  disabled
}: TransformationModeSelectorProps) {
  return (
    <div className={styles.container}>
      {TRANSFORMATION_MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          className={`${styles.modeButton} ${value === mode.value ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && onChange(mode.value)}
          disabled={disabled}
        >
          <div className={styles.iconWrapper}>
            {mode.icon}
          </div>
          <div className={styles.textContent}>
            <span className={styles.label}>{mode.label}</span>
            <span className={styles.description}>{mode.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
