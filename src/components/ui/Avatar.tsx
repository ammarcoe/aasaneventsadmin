import React, { useState } from "react";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const sizeStyles = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden border border-border bg-surface-subtle font-semibold text-ink ${sizeStyles[size]} ${className}`}
    >
      {src && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
