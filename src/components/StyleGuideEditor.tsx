'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { ArrowLeft, Plus, X, Globe, Upload, Loader2, Trash2, Save } from 'lucide-react';
import type { BrandStyleGuide, ColorEntry } from '@funnelists/brand';
import ColorSwatchInput from './ColorSwatchInput';

interface StyleGuideEditorProps {
  guide: BrandStyleGuide;
  isNew?: boolean;
  onSave: (guide: BrandStyleGuide) => void;
  onDelete?: (id: string) => void;
  onCancel: () => void;
  onExtractFromUrl?: (url: string) => Promise<void>;
  onExtractFromImage?: (file: File) => Promise<void>;
  isExtracting?: boolean;
}

// ---- Shared inline style helpers ----

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 12px 0',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '16px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(255, 255, 255, 0.6)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '4px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box' as const,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical' as const,
  fontFamily: 'inherit',
};

const addButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px dashed rgba(255, 255, 255, 0.15)',
  background: 'none',
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

// ---- Chip / Tag Input sub-component ----

function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!values.includes(inputValue.trim())) {
        onChange([...values, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '6px 8px',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(255, 255, 255, 0.05)',
        minHeight: '36px',
        alignItems: 'center',
      }}
    >
      {values.map((val, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: 'rgba(14, 165, 233, 0.15)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            color: '#7dd3fc',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {val}
          <button
            onClick={() => handleRemove(idx)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              color: 'rgba(125, 211, 252, 0.7)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(125, 211, 252, 0.7)'; }}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={values.length === 0 ? (placeholder || 'Type and press Enter') : ''}
        style={{
          flex: 1,
          minWidth: '80px',
          border: 'none',
          background: 'transparent',
          color: '#ffffff',
          fontSize: '13px',
          outline: 'none',
          padding: '2px 0',
        }}
      />
    </div>
  );
}

// ---- Color group sub-component ----

function ColorGroup({
  label,
  colors,
  onChange,
}: {
  label: string;
  colors: ColorEntry[];
  onChange: (colors: ColorEntry[]) => void;
}) {
  const handleColorChange = (index: number, updated: ColorEntry) => {
    const next = [...colors];
    next[index] = updated;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    onChange([...colors, { hex: '#000000' }]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={labelStyle}>{label}</span>
      {colors.map((color, idx) => (
        <ColorSwatchInput
          key={idx}
          color={color}
          onChange={(c) => handleColorChange(idx, c)}
          onRemove={() => handleRemove(idx)}
        />
      ))}
      <button
        onClick={handleAdd}
        style={addButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#0ea5e9';
          e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
      >
        <Plus size={12} /> Add color
      </button>
    </div>
  );
}

// ---- Main Editor ----

export default function StyleGuideEditor({
  guide: initialGuide,
  isNew,
  onSave,
  onDelete,
  onCancel,
  onExtractFromUrl,
  onExtractFromImage,
  isExtracting,
}: StyleGuideEditorProps) {
  const [guide, setGuide] = useState<BrandStyleGuide>({ ...initialGuide });
  const [extractUrl, setExtractUrl] = useState('');
  const [showExtractUrl, setShowExtractUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Updaters ----

  const updateField = <K extends keyof BrandStyleGuide>(key: K, value: BrandStyleGuide[K]) => {
    setGuide((prev) => ({ ...prev, [key]: value }));
  };

  const updateColors = (patch: Partial<BrandStyleGuide['colors']>) => {
    setGuide((prev) => ({ ...prev, colors: { ...prev.colors, ...patch } }));
  };

  const updateTypography = (patch: Partial<BrandStyleGuide['typography']>) => {
    setGuide((prev) => ({ ...prev, typography: { ...prev.typography, ...patch } }));
  };

  const updateVisualStyle = (patch: Partial<BrandStyleGuide['visualStyle']>) => {
    setGuide((prev) => ({ ...prev, visualStyle: { ...prev.visualStyle, ...patch } }));
  };

  const handleSave = () => {
    onSave({ ...guide, updatedAt: new Date().toISOString() });
  };

  const handleExtract = async () => {
    if (!extractUrl.trim() || !onExtractFromUrl) return;
    await onExtractFromUrl(extractUrl.trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onExtractFromImage) {
      await onExtractFromImage(file);
    }
    // Reset so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* ========== Header ========== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            transition: 'color 0.15s ease, background 0.15s ease',
          }}
          title="Back"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            value={guide.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Style guide name"
            style={{
              ...inputStyle,
              fontSize: '18px',
              fontWeight: 600,
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid transparent',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <input
          type="text"
          value={guide.description || ''}
          onChange={(e) => updateField('description', e.target.value || undefined)}
          placeholder="Short description (optional)"
          style={{ ...inputStyle, fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
        />
      </div>

      {/* ========== Extract Section ========== */}
      {(onExtractFromUrl || onExtractFromImage) && (
        <div style={sectionStyle}>
          <h4 style={sectionHeaderStyle}>Extract Brand</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onExtractFromUrl && (
              <button
                onClick={() => setShowExtractUrl(!showExtractUrl)}
                disabled={isExtracting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(14, 165, 233, 0.3)',
                  background: 'rgba(14, 165, 233, 0.1)',
                  color: '#0ea5e9',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: isExtracting ? 'not-allowed' : 'pointer',
                  opacity: isExtracting ? 0.6 : 1,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isExtracting) e.currentTarget.style.background = 'rgba(14, 165, 233, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                }}
              >
                {isExtracting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Globe size={14} />}
                Extract from URL
              </button>
            )}
            {onExtractFromImage && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: isExtracting ? 'not-allowed' : 'pointer',
                    opacity: isExtracting ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExtracting) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                >
                  <Upload size={14} />
                  Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>

          {showExtractUrl && onExtractFromUrl && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="url"
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                placeholder="https://example.com"
                style={{ ...inputStyle, flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExtract();
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
              />
              <button
                onClick={handleExtract}
                disabled={isExtracting || !extractUrl.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0ea5e9',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: isExtracting || !extractUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: isExtracting || !extractUrl.trim() ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {isExtracting ? 'Extracting...' : 'Extract'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== Colors Section ========== */}
      <div style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Colors</h4>

        <ColorGroup
          label="Primary"
          colors={guide.colors.primary}
          onChange={(primary) => updateColors({ primary })}
        />

        <ColorGroup
          label="Secondary"
          colors={guide.colors.secondary}
          onChange={(secondary) => updateColors({ secondary })}
        />

        <ColorGroup
          label="Accent"
          colors={guide.colors.accent}
          onChange={(accent) => updateColors({ accent })}
        />

        {/* Forbidden colors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Forbidden Colors</span>
          <ChipInput
            values={guide.colors.forbidden}
            onChange={(forbidden) => updateColors({ forbidden })}
            placeholder="e.g. red, warm tones..."
          />
        </div>

        {/* Background */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Background</span>
          <input
            type="text"
            value={guide.colors.background}
            onChange={(e) => updateColors({ background: e.target.value })}
            placeholder="e.g. #0f172a or dark gradient"
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
          />
        </div>
      </div>

      {/* ========== Typography Section ========== */}
      <div style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Typography</h4>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={labelStyle}>Heading Font</span>
            <input
              type="text"
              value={guide.typography.headingFont || ''}
              onChange={(e) => updateTypography({ headingFont: e.target.value || undefined })}
              placeholder="e.g. Inter, Montserrat"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={labelStyle}>Body Font</span>
            <input
              type="text"
              value={guide.typography.bodyFont || ''}
              onChange={(e) => updateTypography({ bodyFont: e.target.value || undefined })}
              placeholder="e.g. Open Sans, Roboto"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Font Weights</span>
          <ChipInput
            values={guide.typography.fontWeights || []}
            onChange={(fontWeights) => updateTypography({ fontWeights })}
            placeholder="e.g. 400, 600, bold..."
          />
        </div>
      </div>

      {/* ========== Visual Style Section ========== */}
      <div style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Visual Style</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Style Keywords</span>
          <ChipInput
            values={guide.visualStyle.styleKeywords}
            onChange={(styleKeywords) => updateVisualStyle({ styleKeywords })}
            placeholder="e.g. futuristic, minimalist..."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Mood</span>
          <ChipInput
            values={guide.visualStyle.mood}
            onChange={(mood) => updateVisualStyle({ mood })}
            placeholder="e.g. innovative, professional..."
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Style Description</span>
          <textarea
            value={guide.visualStyle.description}
            onChange={(e) => updateVisualStyle({ description: e.target.value })}
            placeholder="Describe the overall visual style for AI generation..."
            style={textareaStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={labelStyle}>Avoid Keywords</span>
          <ChipInput
            values={guide.visualStyle.avoidKeywords}
            onChange={(avoidKeywords) => updateVisualStyle({ avoidKeywords })}
            placeholder="e.g. clipart, cartoon..."
          />
        </div>
      </div>

      {/* ========== Industry & Source ========== */}
      <div style={sectionStyle}>
        <h4 style={sectionHeaderStyle}>Details</h4>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={labelStyle}>Industry</span>
            <input
              type="text"
              value={guide.industry || ''}
              onChange={(e) => updateField('industry', e.target.value || undefined)}
              placeholder="e.g. SaaS, Healthcare"
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={labelStyle}>Source URL</span>
            <input
              type="url"
              value={guide.sourceUrl || ''}
              onChange={(e) => updateField('sourceUrl', e.target.value || undefined)}
              placeholder="https://..."
              readOnly={!!initialGuide.sourceUrl}
              style={{
                ...inputStyle,
                opacity: initialGuide.sourceUrl ? 0.7 : 1,
                cursor: initialGuide.sourceUrl ? 'default' : 'text',
              }}
              onFocus={(e) => {
                if (!initialGuide.sourceUrl) e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.5)';
              }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
            />
          </div>
        </div>
      </div>

      {/* ========== Actions ========== */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          paddingTop: '8px',
          paddingBottom: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Save */}
        <button
          onClick={handleSave}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: '#0ea5e9',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0284c7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0ea5e9'; }}
        >
          <Save size={16} />
          {isNew ? 'Create Guide' : 'Save Changes'}
        </button>

        {/* Cancel */}
        <button
          onClick={onCancel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
          }}
        >
          Cancel
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Delete */}
        {onDelete && !isNew && (
          <button
            onClick={() => {
              if (confirm(`Delete style guide "${guide.name}"? This cannot be undone.`)) {
                onDelete(guide.id);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              background: 'none',
              color: 'rgba(239, 68, 68, 0.7)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>

      {/* Spin animation for the loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
