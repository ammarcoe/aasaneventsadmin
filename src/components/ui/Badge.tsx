import React from "react";

export type BadgeVariant =
  | "published"
  | "pending"
  | "draft"
  | "rejected"
  | "cancelled"
  | "postponed"
  | "active"
  | "suspended"
  | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    published: "bg-accent/20 text-accent-deep border border-accent/40",
    pending: "bg-sand text-ink border border-border",
    draft: "bg-control text-ink-muted border border-border",
    rejected: "bg-crimson-surface text-crimson border border-crimson/30",
    cancelled: "bg-control-disabled text-ink-disabled border border-border",
    postponed: "bg-sand text-ink border border-border",
    active: "bg-accent text-on-ink",
    suspended: "bg-crimson-surface text-crimson border border-crimson/30",
    neutral: "bg-control text-ink border border-border",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5 font-semibold uppercase tracking-wider",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-sm capitalize select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
