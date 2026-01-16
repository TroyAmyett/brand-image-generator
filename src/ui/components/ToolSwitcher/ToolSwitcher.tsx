import React, { useState, useRef, useEffect } from 'react';
import './ToolSwitcher.css';

export interface Tool {
  id: string;
  name: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface ToolSwitcherProps {
  tools: Tool[];
  activeTool: string;
  onToolChange: (toolId: string) => void;
  className?: string;
}

export const ToolSwitcher: React.FC<ToolSwitcherProps> = ({
  tools,
  activeTool,
  onToolChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeToolData = tools.find((t) => t.id === activeTool);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleToolSelect = (toolId: string) => {
    onToolChange(toolId);
    setIsOpen(false);
  };

  const classNames = ['fl-tool-switcher', className].filter(Boolean).join(' ');

  return (
    <div ref={dropdownRef} className={classNames}>
      <button
        type="button"
        className="fl-tool-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {activeToolData?.icon && (
          <span className="fl-tool-switcher__trigger-icon">{activeToolData.icon}</span>
        )}
        <span className="fl-tool-switcher__trigger-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="fl-tool-switcher__dropdown" role="listbox">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="option"
              aria-selected={tool.id === activeTool}
              className={`fl-tool-switcher__option ${
                tool.id === activeTool ? 'fl-tool-switcher__option--active' : ''
              }`}
              onClick={() => handleToolSelect(tool.id)}
            >
              {tool.icon && (
                <span className="fl-tool-switcher__option-icon">{tool.icon}</span>
              )}
              <div className="fl-tool-switcher__option-content">
                <span className="fl-tool-switcher__option-name">{tool.name}</span>
                {tool.description && (
                  <span className="fl-tool-switcher__option-description">
                    {tool.description}
                  </span>
                )}
              </div>
              {tool.id === activeTool && (
                <span className="fl-tool-switcher__option-check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

ToolSwitcher.displayName = 'ToolSwitcher';

export default ToolSwitcher;
