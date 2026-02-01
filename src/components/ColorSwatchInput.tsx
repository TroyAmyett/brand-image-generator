'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { ColorEntry } from '@/lib/brand-kit';

interface ColorSwatchInputProps {
  color: ColorEntry;
  onChange: (color: ColorEntry) => void;
  onRemove: () => void;
}

export default function ColorSwatchInput({ color, onChange, onRemove }: ColorSwatchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleHexChange = (value: string) => {
    // Ensure it starts with # and limit to 7 chars
    let hex = value;
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    hex = hex.slice(0, 7);
    onChange({ ...color, hex });
  };

  const handleNameChange = (value: string) => {
    onChange({ ...color, name: value || undefined });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: '8px',
        border: isFocused
          ? '1px solid rgba(14, 165, 233, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Color circle preview */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: color.hex || '#000000',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          flexShrink: 0,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          type="color"
          value={color.hex || '#000000'}
          onChange={(e) => handleHexChange(e.target.value)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            border: 'none',
            padding: 0,
          }}
          title="Pick a color"
        />
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={color.hex}
        onChange={(e) => handleHexChange(e.target.value)}
        placeholder="#000000"
        style={{
          width: '85px',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          fontSize: '13px',
          fontFamily: 'monospace',
          outline: 'none',
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Name input */}
      <input
        type="text"
        value={color.name || ''}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Name (optional)"
        style={{
          flex: 1,
          minWidth: '80px',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
          color: '#ffffff',
          fontSize: '13px',
          outline: 'none',
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Remove button */}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.4)',
          transition: 'color 0.15s ease, background 0.15s ease',
          flexShrink: 0,
        }}
        title="Remove color"
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.background = 'none';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
