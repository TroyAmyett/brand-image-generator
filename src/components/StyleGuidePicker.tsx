'use client';

import { useState } from 'react';
import { Plus, Pencil, Check } from 'lucide-react';
import type { BrandStyleGuide } from '@funnelists/brand';

interface StyleGuidePickerProps {
  guides: BrandStyleGuide[];
  activeGuideId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onEdit: (id: string) => void;
}

export default function StyleGuidePicker({
  guides,
  activeGuideId,
  onSelect,
  onCreateNew,
  onEdit,
}: StyleGuidePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  /** Get display colors for a guide (up to 4 primary colors) */
  const getSwatchColors = (guide: BrandStyleGuide): string[] => {
    const colors: string[] = [];
    for (const entry of guide.colors.primary) {
      colors.push(entry.hex);
      if (colors.length >= 4) break;
    }
    // Fill from secondary/accent if less than 3
    if (colors.length < 3) {
      for (const entry of guide.colors.secondary) {
        colors.push(entry.hex);
        if (colors.length >= 4) break;
      }
    }
    if (colors.length < 3) {
      for (const entry of guide.colors.accent) {
        colors.push(entry.hex);
        if (colors.length >= 4) break;
      }
    }
    return colors;
  };

  const cardBaseStyle: React.CSSProperties = {
    width: '200px',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'relative',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
          Style Guides
        </h3>
        <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
          {guides.length} guide{guides.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
        }}
      >
        {guides.map((guide) => {
          const isActive = guide.id === activeGuideId;
          const isHovered = guide.id === hoveredId;
          const swatches = getSwatchColors(guide);

          return (
            <div
              key={guide.id}
              onClick={() => onSelect(guide.id)}
              onMouseEnter={() => setHoveredId(guide.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...cardBaseStyle,
                border: isActive
                  ? '2px solid #0ea5e9'
                  : isHovered
                    ? '2px solid rgba(255, 255, 255, 0.2)'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isActive ? '0 0 12px rgba(14, 165, 233, 0.2)' : 'none',
              }}
            >
              {/* Active indicator */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#0ea5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </div>
              )}

              {/* Color swatches */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {swatches.map((hex, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: hex,
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                      flexShrink: 0,
                    }}
                  />
                ))}
                {swatches.length === 0 && (
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#374151',
                      border: '2px solid rgba(255, 255, 255, 0.15)',
                    }}
                  />
                )}
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ffffff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {guide.name}
              </div>

              {/* Industry badge */}
              {guide.industry && (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.7)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    alignSelf: 'flex-start',
                    textTransform: 'capitalize',
                  }}
                >
                  {guide.industry}
                </span>
              )}

              {/* Edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(guide.id);
                }}
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  transition: 'all 0.15s ease',
                  opacity: isHovered || isActive ? 1 : 0,
                }}
                title="Edit guide"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0ea5e9';
                  e.currentTarget.style.borderColor = 'rgba(14, 165, 233, 0.3)';
                  e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Pencil size={13} />
              </button>
            </div>
          );
        })}

        {/* Create New Card */}
        <div
          onClick={onCreateNew}
          onMouseEnter={() => setHoveredId('__new__')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            ...cardBaseStyle,
            border: hoveredId === '__new__'
              ? '2px dashed rgba(14, 165, 233, 0.5)'
              : '2px dashed rgba(255, 255, 255, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '120px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: hoveredId === '__new__'
                ? 'rgba(14, 165, 233, 0.15)'
                : 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            <Plus
              size={18}
              style={{
                color: hoveredId === '__new__' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.5)',
                transition: 'color 0.15s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: hoveredId === '__new__' ? '#0ea5e9' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.15s ease',
            }}
          >
            New Guide
          </span>
        </div>
      </div>
    </div>
  );
}
