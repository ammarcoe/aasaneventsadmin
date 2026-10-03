"use client";

import React from "react";
import type { EventFormValues } from "@/features/events/schema";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export interface ChecklistItem {
  id: string;
  type: "blocking" | "warning" | "nudge" | "success";
  label: string;
  targetId?: string;
}

interface EventChecklistProps {
  data: Partial<EventFormValues>;
  isUploadingImages?: boolean;
}

export function EventChecklist({ data, isUploadingImages }: EventChecklistProps) {
  const items: ChecklistItem[] = [];

  // Blocking checks
  if (!data.title || data.title.trim().length === 0) {
    items.push({
      id: "title-required",
      type: "blocking",
      label: "Add a title",
      targetId: "field-title",
    });
  }

  if (!data.images || data.images.length === 0) {
    items.push({
      id: "cover-required",
      type: "blocking",
      label: "Add a cover image",
      targetId: "section-images",
    });
  }

  if (isUploadingImages) {
    items.push({
      id: "images-uploading",
      type: "blocking",
      label: "Wait for images to finish uploading",
      targetId: "section-images",
    });
  }

  if (!data.categoryId) {
    items.push({
      id: "category-required",
      type: "blocking",
      label: "Pick a category",
      targetId: "field-category",
    });
  }

  if (!data.startTime) {
    items.push({
      id: "start-time-required",
      type: "blocking",
      label: "Pick a start time",
      targetId: "field-start-time",
    });
  }

  if (!data.venueName || data.venueName.trim().length === 0) {
    items.push({
      id: "venue-required",
      type: "blocking",
      label: "Where is it?",
      targetId: "field-venue",
    });
  }

  const isPaid =
    Boolean(data.priceMinPkr && data.priceMinPkr > 0) || Boolean(data.ticketTypes?.some((t) => t.pricePkr > 0));
  if (isPaid && !data.sellsInApp && (!data.ticketUrl || data.ticketUrl.length === 0)) {
    items.push({
      id: "ticket-url-required",
      type: "blocking",
      label: "Paid events need a ticket link, or an organizer with approved payment accounts",
      targetId: "field-ticket-url",
    });
  }

  // Warnings
  if (data.images && data.images.some((img) => (img.w && img.w < 1200) || (img.h && img.h < 1200))) {
    items.push({
      id: "small-image-warning",
      type: "warning",
      label: "Some images may look blurry on big screens (under 1200px)",
      targetId: "section-images",
    });
  }

  if (
    (data.audience?.includes("women") || data.audience?.includes("students")) &&
    (!data.faq || data.faq.length === 0)
  ) {
    items.push({
      id: "restricted-audience-faq-nudge",
      type: "nudge",
      label: "Add an FAQ explaining how attendance is checked at the door",
      targetId: "section-details",
    });
  }

  if (!data.description || data.description.length < 50) {
    items.push({
      id: "description-nudge",
      type: "nudge",
      label: "A descriptive 'About' helps attendees decide to come",
      targetId: "field-description",
    });
  }

  const blockingItems = items.filter((x) => x.type === "blocking");
  const otherItems = items.filter((x) => x.type !== "blocking");

  const scrollTo = (targetId?: string) => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
    }
  };

  return (
    <div className="p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--color-ink)]">Pre-flight Checklist</span>
        {blockingItems.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready to publish
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-crimson)]">
            <AlertCircle className="w-3.5 h-3.5" />
            {blockingItems.length} issue(s) to fix
          </span>
        )}
      </div>

      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {blockingItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.targetId)}
            className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] text-[var(--color-crimson)] transition-colors group"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="group-hover:underline">{item.label}</span>
          </button>
        ))}

        {otherItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.targetId)}
            className={`w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-[var(--color-surface-subtle)] text-[11px] transition-colors group ${
              item.type === "warning"
                ? "text-amber-700 dark:text-amber-400"
                : "text-[var(--color-ink-muted)]"
            }`}
          >
            {item.type === "warning" ? (
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
            ) : (
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-ink-faint)]" />
            )}
            <span className="group-hover:underline">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
export default EventChecklist;
