'use client';

import { Type, Layout, Palette } from 'lucide-react';
import styles from './PreserveOptions.module.css';

export interface PreserveOptionsState {
  preserveText: boolean;
  preserveLayout: boolean;
  preserveColors: boolean;
}

interface PreserveOptionConfig {
  key: keyof PreserveOptionsState;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PRESERVE_OPTIONS: PreserveOptionConfig[] = [
  {
    key: 'preserveText',
    label: 'Preserve text/labels',
    description: 'Try to keep text elements legible',
    icon: <Type className="w-4 h-4" />
  },
  {
    key: 'preserveLayout',
    label: 'Preserve layout structure',
    description: 'Maintain spatial arrangement',
    icon: <Layout className="w-4 h-4" />
  },
  {
    key: 'preserveColors',
    label: 'Preserve original colors',
    description: 'Keep color palette from source',
    icon: <Palette className="w-4 h-4" />
  }
];

interface PreserveOptionsProps {
  value: PreserveOptionsState;
  onChange: (value: PreserveOptionsState) => void;
  disabled?: boolean;
}

export default function PreserveOptions({
  value,
  onChange,
  disabled
}: PreserveOptionsProps) {
  const handleToggle = (key: keyof PreserveOptionsState) => {
    if (!disabled) {
      onChange({
        ...value,
        [key]: !value[key]
      });
    }
  };

  return (
    <div className={styles.container}>
      {PRESERVE_OPTIONS.map((option) => (
        <label
          key={option.key}
          className={`${styles.option} ${disabled ? styles.disabled : ''}`}
        >
          <input
            type="checkbox"
            checked={value[option.key]}
            onChange={() => handleToggle(option.key)}
            className={styles.checkbox}
            disabled={disabled}
          />
          <span className={styles.iconWrapper}>
            {option.icon}
          </span>
          <span className={styles.textContent}>
            <span className={styles.label}>{option.label}</span>
            <span className={styles.description}>{option.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
