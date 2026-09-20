import React, { forwardRef } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  helperText?: string;
  label?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, helperText, label, id, options, children, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-ink uppercase tracking-wide"
          >
            {label}
            {props.required && <span className="text-crimson ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-surface border rounded-md px-3.5 py-2 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent disabled:bg-control-disabled disabled:text-ink-disabled disabled:cursor-not-allowed ${
            error ? "border-crimson focus:ring-crimson" : "border-border"
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-crimson font-medium">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-ink-muted">{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
