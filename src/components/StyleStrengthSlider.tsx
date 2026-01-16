'use client';

import styles from './StyleStrengthSlider.module.css';

interface StyleStrengthSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function StyleStrengthSlider({
  value,
  onChange,
  disabled
}: StyleStrengthSliderProps) {
  const getStrengthLabel = (strength: number): string => {
    if (strength <= 20) return 'Subtle';
    if (strength <= 40) return 'Light';
    if (strength <= 60) return 'Moderate';
    if (strength <= 80) return 'Strong';
    return 'Maximum';
  };

  const getStrengthDescription = (strength: number): string => {
    if (strength <= 20) return 'Minor adjustments, preserves most of the original';
    if (strength <= 40) return 'Light transformation with recognizable source';
    if (strength <= 60) return 'Balanced blend of original and brand styling';
    if (strength <= 80) return 'Significant transformation while retaining core elements';
    return 'Complete artistic reinterpretation';
  };

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.header}>
        <span className={styles.label}>Style Strength</span>
        <span className={styles.value}>{value}%</span>
      </div>

      <div className={styles.sliderWrapper}>
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className={styles.slider}
          disabled={disabled}
        />
        <div
          className={styles.sliderFill}
          style={{ width: `${value}%` }}
        />
      </div>

      <div className={styles.markers}>
        <span className={value <= 20 ? styles.activeMarker : ''}>Subtle</span>
        <span className={value > 40 && value <= 60 ? styles.activeMarker : ''}>Moderate</span>
        <span className={value > 80 ? styles.activeMarker : ''}>Maximum</span>
      </div>

      <div className={styles.description}>
        <span className={styles.strengthLabel}>{getStrengthLabel(value)}</span>
        <span className={styles.strengthDescription}>{getStrengthDescription(value)}</span>
      </div>
    </div>
  );
}
