import React, { useId } from 'react';
import './Textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      resize = 'vertical',
      className = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || `fl-textarea${generatedId}`;

    const wrapperClassNames = [
      'fl-textarea-wrapper',
      error ? 'fl-textarea-wrapper--error' : '',
      props.disabled ? 'fl-textarea-wrapper--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClassNames}>
        {label && (
          <label htmlFor={textareaId} className="fl-textarea__label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className="fl-textarea"
          rows={rows}
          style={{ resize }}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${textareaId}-error`} className="fl-textarea__error" role="alert">
            {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${textareaId}-hint`} className="fl-textarea__hint">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
