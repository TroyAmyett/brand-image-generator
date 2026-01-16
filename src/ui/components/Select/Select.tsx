import React, { useId } from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      placeholder,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || `fl-select${generatedId}`;

    const wrapperClassNames = [
      'fl-select-wrapper',
      error ? 'fl-select-wrapper--error' : '',
      props.disabled ? 'fl-select-wrapper--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={selectId} className="fl-select__label">
            {label}
          </label>
        )}
        <div className="fl-select__container">
          <select
            ref={ref}
            id={selectId}
            className="fl-select"
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="fl-select__chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
        {error && (
          <span id={`${selectId}-error`} className="fl-select__error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${selectId}-hint`} className="fl-select__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
