import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "interactive";
}

export function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  const variantStyles = {
    default: "bg-surface border-border",
    subtle: "bg-surface-subtle border-border",
    interactive: "bg-surface border-border hover:border-border-strong transition-all cursor-pointer",
  };

  return (
    <div
      className={`border rounded-lg p-5 shadow-xs ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col gap-1 pb-4 border-b border-border mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-base font-semibold text-ink ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-ink-muted ${className}`} {...props}>
      {children}
    </p>
  );
}
