import React from "react";

export interface FilterChipProps {
  label: string;
  count?: number;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function FilterChip({
  label,
  count,
  isSelected,
  onClick,
  className = "",
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer border ${
        isSelected
          ? "bg-secondary text-ink font-semibold border-border-strong shadow-xs"
          : "bg-surface text-ink-muted hover:text-ink hover:bg-surface-subtle border-border"
      } ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            isSelected
              ? "bg-surface text-ink font-bold"
              : "bg-control text-ink-muted"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
