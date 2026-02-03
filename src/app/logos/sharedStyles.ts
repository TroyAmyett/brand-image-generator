import type React from 'react';

export const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '10px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.9)',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'inherit',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: 'none',
  colorScheme: 'dark',
};

export function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '7px 12px',
    borderRadius: '6px',
    border: active ? '1px solid #0ea5e9' : '1px solid rgba(255, 255, 255, 0.1)',
    background: active ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.03)',
    color: active ? '#0ea5e9' : 'rgba(255, 255, 255, 0.7)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
  };
}

export const sectionGap: React.CSSProperties = {
  marginBottom: '20px',
};
