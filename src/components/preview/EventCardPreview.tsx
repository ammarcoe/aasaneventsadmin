"use client";

import React from "react";
import type { EventFormValues } from "@/features/events/schema";
import { pktMobileDateLine } from "@/lib/pkt";
import { formatPKR } from "@/lib/utils";
import { MapPin, Heart, Star, Sparkles } from "lucide-react";

export interface EventCardPreviewProps {
  data: Partial<EventFormValues>;
}

export function EventCardPreview({ data }: EventCardPreviewProps) {
  const bannerUrl = data.imageUrls?.[0];
  const title = data.title?.trim() || "Untitled Event";
  const venue = data.venueName?.trim() || "Venue not specified";
  const organizer = data.organizerName?.trim() || "Organizer";
  const dateLine = pktMobileDateLine(data.startTime);

  const priceText =
    data.priceMinPkr === 0 || (!data.priceMinPkr && !data.priceMaxPkr)
      ? "Free"
      : data.priceMinPkr && data.priceMaxPkr && data.priceMinPkr !== data.priceMaxPkr
      ? `${formatPKR(data.priceMinPkr)} - ${formatPKR(data.priceMaxPkr)}`
      : formatPKR(data.priceMinPkr ?? 0);

  return (
    <div className="w-full max-w-[358px] mx-auto bg-surface rounded-2xl border border-border overflow-hidden shadow-xs flex flex-col font-sans transition-all">
      {/* 180px Card Banner */}
      <div className="relative h-[180px] w-full overflow-hidden bg-accent/35 flex items-center justify-center">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1.5 text-accent-deep/70 select-none">
            <Sparkles className="w-7 h-7" />
            <span className="text-[11px] font-medium tracking-wide">No image uploaded</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {data.categoryId && (
            <div className="bg-white/95 backdrop-blur-xs text-ink text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
              {data.categoryId}
            </div>
          )}
          {data.isFeatured && (
            <div className="bg-accent text-on-ink px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
              <Star className="w-3 h-3 fill-current" />
              <span>Featured</span>
            </div>
          )}
        </div>

        {/* Top-Right Heart Overlay (matching mobile feed card) */}
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-sm flex items-center justify-center text-ink-muted">
            <Heart className="w-4 h-4 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col gap-2">
        {/* Uppercase Crimson PKT Date Line */}
        <div className="text-[11px] font-bold tracking-wider text-crimson uppercase">
          {dateLine}
        </div>

        {/* 2-line clamped title */}
        <h4 className="text-base font-bold text-ink leading-tight line-clamp-2 min-h-[2.5rem]">
          {title}
        </h4>

        {/* 1-line venue */}
        <div className="flex items-center gap-1 text-xs text-ink-muted line-clamp-1">
          <MapPin className="w-3.5 h-3.5 text-ink-faint shrink-0" />
          <span className="truncate">{venue}</span>
        </div>

        {/* Bottom row: Price & Organizer badge */}
        <div className="pt-3 mt-1 border-t border-border flex items-center justify-between gap-2">
          <div className="text-sm font-bold text-ink tracking-tight">
            {priceText}
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-[10px] font-bold text-ink shrink-0">
              {organizer.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-ink-muted truncate max-w-[130px]">
              {organizer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
