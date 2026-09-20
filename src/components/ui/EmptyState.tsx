import React from "react";
import { LucideIcon, Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-surface/50 ${className}`}
    >
      <div className="p-3 bg-surface-subtle border border-border rounded-full mb-3 text-ink-muted">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-ink mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-ink-muted max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
