"use client";

import React, { useState } from "react";
import type { EventFormValues } from "@/features/events/schema";
import { EventCardPreview } from "./EventCardPreview";
import { EventDetailPreview } from "./EventDetailPreview";
import { Smartphone, Wifi, BatteryMedium, Sparkles } from "lucide-react";

export interface PhoneFrameProps {
  data: Partial<EventFormValues>;
}

export function PhoneFrame({ data }: PhoneFrameProps) {
  const [viewMode, setViewMode] = useState<"card" | "detail">("card");

  return (
    <div className="w-[390px] shrink-0 flex flex-col gap-3 sticky top-4">
      {/* Header controls: Switch preview mode */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
          <Smartphone className="w-3.5 h-3.5 text-accent-deep" />
          <span>Mobile App Preview</span>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-control border border-border">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === "card"
                ? "bg-surface text-ink font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Feed Card
          </button>
          <button
            type="button"
            onClick={() => setViewMode("detail")}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === "detail"
                ? "bg-surface text-ink font-semibold shadow-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Full Detail
          </button>
        </div>
      </div>

      {/* Phone chassis */}
      <div className="w-[390px] h-[720px] rounded-[38px] border-4 border-control bg-bg shadow-xl overflow-hidden flex flex-col relative">
        {/* Status bar & Dynamic Island */}
        <div className="h-10 px-6 flex items-center justify-between text-[11px] font-semibold text-ink bg-transparent shrink-0 z-30">
          <span>9:41</span>
          <div className="w-24 h-4 rounded-full bg-ink flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-surface/20" />
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Screen container */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === "card" ? (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="font-semibold text-ink">Upcoming in Islamabad</span>
                <span className="text-[10px] text-accent-deep font-medium">See all</span>
              </div>
              <EventCardPreview data={data} />
              <div className="p-3 bg-surface rounded-xl border border-border text-[11px] text-ink-muted flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>Live responsive preview updates instantly as you edit the form.</span>
              </div>
            </div>
          ) : (
            <EventDetailPreview data={data} />
          )}
        </div>

        {/* Bottom home indicator line */}
        <div className="h-5 w-full flex items-center justify-center shrink-0 bg-transparent">
          <div className="w-32 h-1 bg-ink/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
