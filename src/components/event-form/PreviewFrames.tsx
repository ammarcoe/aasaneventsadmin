"use client";

import React from "react";
import type { EventImage } from "@/types";
import { EventImageView } from "./EventImageView";

interface PreviewFramesProps {
  image: EventImage;
}

export function PreviewFrames({ image }: PreviewFramesProps) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
        Live Previews
      </div>

      {/* Feed 2.4:1 Preview */}
      <div>
        <div className="text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
          Feed card (2.4 : 1)
        </div>
        <div className="w-[336px] h-[140px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-surface)] shadow-xs">
          <EventImageView image={image} blur={false} className="w-full h-full" />
        </div>
      </div>

      {/* Detail, Square, Story Row */}
      <div className="flex items-end gap-3 pt-1">
        {/* Detail 4:3 */}
        <div>
          <div className="text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
            Detail (4 : 3)
          </div>
          <div className="w-[160px] h-[120px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-surface)] shadow-xs">
            <EventImageView image={image} blur={true} className="w-full h-full" />
          </div>
        </div>

        {/* Square 1:1 */}
        <div>
          <div className="text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
            Square (1 : 1)
          </div>
          <div className="w-[96px] h-[96px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] overflow-hidden bg-[var(--color-surface)] shadow-xs">
            <EventImageView image={image} blur={false} className="w-full h-full" />
          </div>
        </div>

        {/* Story */}
        <div>
          <div className="text-[11px] font-medium text-[var(--color-ink-muted)] mb-1">
            Story
          </div>
          <div className="w-[68px] h-[120px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] overflow-hidden bg-black p-1 flex items-center justify-center shadow-xs">
            <div className="w-full aspect-[4/3] rounded-[2px] overflow-hidden">
              <EventImageView image={image} blur={true} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default PreviewFrames;
