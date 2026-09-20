import React, { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label?: string;
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = "",
      error,
      helperText,
      label,
      id,
      maxLength,
      currentLength,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="text-xs font-semibold text-ink uppercase tracking-wide"
            >
              {label}
              {props.required && <span className="text-crimson ml-1">*</span>}
            </label>
          )}
          {maxLength && (
            <span className="text-xs text-ink-faint">
              {currentLength ?? 0} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          rows={props.rows || 4}
          className={`w-full bg-surface border rounded-md px-3.5 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:bg-control-disabled disabled:text-ink-disabled disabled:cursor-not-allowed ${
            error ? "border-crimson focus:ring-crimson" : "border-border"
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-crimson font-medium">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-ink-muted">{helperText}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
