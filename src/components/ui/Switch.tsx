import React from "react";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={switchId}
              className={`text-sm font-medium ${
                disabled ? "text-ink-disabled" : "text-ink cursor-pointer"
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-ink-muted">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-accent" : "bg-control"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
