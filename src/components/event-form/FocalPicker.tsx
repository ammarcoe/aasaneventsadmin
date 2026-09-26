"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import type { EventImage } from "@/types";

interface FocalPickerProps {
  image: EventImage;
  onChange: (updates: Partial<EventImage>) => void;
  className?: string;
}

export function FocalPicker({ image, onChange, className = "" }: FocalPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const focalX = typeof image.focalX === "number" ? image.focalX : 0.5;
  const focalY = typeof image.focalY === "number" ? image.focalY : 0.5;
  const isFitMode = image.fit === "fit";

  const calculateFocalPoint = useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      onChange({
        focalX: Math.round(x * 1000) / 1000,
        focalY: Math.round(y * 1000) / 1000,
      });
    },
    [onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isFitMode) return;
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    calculateFocalPoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isFitMode) return;
    calculateFocalPoint(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setIsDragging(false);
    }
  };

  const handleDoubleClick = () => {
    if (isFitMode) return;
    onChange({ focalX: 0.5, focalY: 0.5 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFitMode) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    let newX = focalX;
    let newY = focalY;

    if (e.key === "ArrowLeft") {
      newX = Math.max(0, focalX - step);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      newX = Math.min(1, focalX + step);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      newY = Math.max(0, focalY - step);
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      newY = Math.min(1, focalY + step);
      e.preventDefault();
    } else {
      return;
    }

    onChange({
      focalX: Math.round(newX * 1000) / 1000,
      focalY: Math.round(newY * 1000) / 1000,
    });
  };

  const src = image.sizes?.l || image.sizes?.m || image.sizes?.s || "";

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center overflow-hidden select-none bg-[var(--color-ink)] rounded-[var(--radius-lg)] ${className}`}
      style={{
        maxHeight: 420,
        minHeight: 240,
        aspectRatio: image.w && image.h ? `${image.w} / ${image.h}` : "4 / 3",
        cursor: isFitMode ? "default" : "crosshair",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Target Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={image.alt || "Select focal point"}
        className="max-h-[420px] max-w-full w-auto h-auto object-contain pointer-events-none"
      />

      {/* Crosshair Overlay (only in Fill mode) */}
      {!isFitMode && (
        <div
          tabIndex={0}
          role="slider"
          aria-label={`Focal point ${Math.round(focalX * 100)}% across, ${Math.round(focalY * 100)}% down`}
          aria-valuenow={Math.round(focalX * 100)}
          onKeyDown={handleKeyDown}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] cursor-grab active:cursor-grabbing"
          style={{
            left: `${focalX * 100}%`,
            top: `${focalY * 100}%`,
          }}
        >
          {/* Guide lines to the container edge */}
          <div className="absolute top-1/2 left-[-2000px] right-[-2000px] h-[1px] bg-white/35 pointer-events-none -translate-y-1/2" />
          <div className="absolute left-1/2 top-[-2000px] bottom-[-2000px] w-[1px] bg-white/35 pointer-events-none -translate-x-1/2" />

          {/* 28px Circle Handle */}
          <div
            className="w-7 h-7 rounded-full border-[2.5px] border-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.12)" }}
          >
            {/* 6px White Center Dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      )}

      {/* Caption when in Fit mode */}
      {isFitMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[rgba(0,0,0,0.7)] text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
          Your whole image will be shown.
        </div>
      )}
    </div>
  );
}
export default FocalPicker;
