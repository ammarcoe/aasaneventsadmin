"use client";

import React from "react";
import type { EventImage } from "@/types";

interface EventImageViewProps {
  image?: EventImage | null;
  /** Fallback URL if image object is not provided or legacy */
  fallbackUrl?: string | null;
  alt?: string;
  blur?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function EventImageView({
  image,
  fallbackUrl,
  alt,
  blur = false,
  className = "",
  style = {},
}: EventImageViewProps) {
  // If no image is provided, check fallbackUrl
  if (!image) {
    if (!fallbackUrl) {
      return (
        <div
          className={`flex items-center justify-center bg-[var(--color-surface-subtle)] text-[var(--color-ink-faint)] text-xs ${className}`}
          style={style}
        >
          No image
        </div>
      );
    }
    return (
      <div className={`relative overflow-hidden ${className}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackUrl}
          alt={alt || "Event image"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const srcL = image.sizes?.l || fallbackUrl || "";
  const srcS = image.sizes?.s || srcL;
  const imageAlt = alt || image.alt || "Event image";
  const focalX = typeof image.focalX === "number" ? Math.max(0, Math.min(1, image.focalX)) : 0.5;
  const focalY = typeof image.focalY === "number" ? Math.max(0, Math.min(1, image.focalY)) : 0.5;
  const fit = image.fit || "fill";
  const bg = image.bg || "#FAF6F0";

  if (fit === "fill") {
    return (
      <div className={`relative overflow-hidden ${className}`} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcL}
          alt={imageAlt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${focalX * 100}% ${focalY * 100}%`,
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // Fit mode
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        ...style,
        background: bg,
      }}
    >
      {blur && srcS && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={srcS}
            aria-hidden="true"
            alt=""
            style={{
              position: "absolute",
              inset: "-10%",
              width: "120%",
              height: "120%",
              objectFit: "cover",
              filter: "blur(28px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.12)",
            }}
          />
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcL}
        alt={imageAlt}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        loading="lazy"
      />
    </div>
  );
}
export default EventImageView;
