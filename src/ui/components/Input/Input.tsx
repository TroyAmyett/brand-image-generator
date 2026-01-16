import React, { useId } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftElement,
      rightElement,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || `fl-input${generatedId}`;

    const wrapperClassNames = [
      'fl-input-wrapper',
      error ? 'fl-input-wrapper--error' : '',
      props.disabled ? 'fl-input-wrapper--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={inputId} className="fl-input__label">
            {label}
          </label>
        )}
        <div className="fl-input__container">
          {leftElement && (
            <span className="fl-input__element fl-input__element--left">
              {leftElement}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className="fl-input"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightElement && (
            <span className="fl-input__element fl-input__element--right">
              {rightElement}
            </span>
          )}
        </div>
        {error && (
          <span id={`${inputId}-error`} className="fl-input__error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="fl-input__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
