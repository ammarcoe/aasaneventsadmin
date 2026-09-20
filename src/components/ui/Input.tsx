import React, { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, helperText, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-ink uppercase tracking-wide"
          >
            {label}
            {props.required && <span className="text-crimson ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
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

Input.displayName = "Input";
