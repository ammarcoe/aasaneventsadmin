import React from "react";
import type { EventFormValues } from "@/features/events/schema";
import { pktLabel } from "@/lib/pkt";
import { formatPKR } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Ticket,
  ChevronLeft,
  Share2,
  Bookmark,
  ExternalLink,
} from "lucide-react";

export interface EventDetailPreviewProps {
  data: Partial<EventFormValues>;
}

export function EventDetailPreview({ data }: EventDetailPreviewProps) {
  const bannerUrl = data.imageUrls?.[0];
  const title = data.title || "Untitled Event";
  const venue = data.venueName || "Venue not specified";
  const address = data.address || "";
  const organizer = data.organizerName || "Organizer Name";
  const dateStr = data.startTime ? pktLabel(data.startTime) : "Date to be announced";
  const tickets = data.ticketTypes || [];

  return (
    <div className="w-full flex flex-col bg-bg min-h-full pb-16 relative text-ink">
      {/* Top action bar */}
      <div className="relative aspect-[16/10] w-full bg-surface-subtle overflow-hidden">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-ink-faint">
            No image
          </div>
        )}

        {/* Floating action overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-surface/80 backdrop-blur-xs flex items-center justify-center text-ink shadow-xs">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface/80 backdrop-blur-xs flex items-center justify-center text-ink shadow-xs">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div className="w-8 h-8 rounded-full bg-surface/80 backdrop-blur-xs flex items-center justify-center text-ink shadow-xs">
              <Bookmark className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main detail container */}
      <div className="p-4 flex flex-col gap-4">
        {/* Category badge */}
        {data.categoryId && (
          <span className="w-fit text-[11px] font-semibold text-accent-deep bg-accent/15 px-2.5 py-0.5 rounded-full capitalize">
            {data.categoryId}
          </span>
        )}

        <h3 className="text-base font-bold text-ink leading-tight">{title}</h3>

        {/* Organizer mini card */}
        <div className="flex items-center gap-3 p-2.5 bg-surface rounded-xl border border-border">
          <div className="w-8 h-8 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-xs font-bold text-ink">
            {organizer.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-ink truncate">{organizer}</span>
            <span className="text-[10px] text-ink-muted">Event Organizer</span>
          </div>
        </div>

        {/* Date & Time block */}
        <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
          <div className="p-2 rounded-lg bg-surface-subtle text-accent-deep border border-border shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink">Date &amp; Time</span>
            <span className="text-[11px] text-ink-muted leading-tight mt-0.5 font-mono">
              {dateStr}
            </span>
          </div>
        </div>

        {/* Venue & Location block */}
        <div className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border">
          <div className="p-2 rounded-lg bg-surface-subtle text-accent-deep border border-border shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-ink">{venue}</span>
            {address && (
              <span className="text-[11px] text-ink-muted leading-tight mt-0.5">
                {address}
              </span>
            )}
          </div>
        </div>

        {/* Ticket Types list */}
        {tickets.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Tickets &amp; Passes
            </span>
            <div className="flex flex-col gap-2">
              {tickets.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="flex items-center justify-between p-2.5 bg-surface rounded-xl border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5 text-sand" />
                    <span className="font-medium text-ink">{t.name}</span>
                  </div>
                  <span className="font-bold text-ink">
                    {formatPKR(t.pricePkr)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="flex flex-col gap-1 pt-2 border-t border-border">
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              About Event
            </span>
            <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-line">
              {data.description}
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 left-0 right-0 p-3 bg-surface/95 backdrop-blur-xs border-t border-border flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-ink-muted uppercase">Price</span>
          <span className="text-xs font-bold text-ink">
            {formatPKR(data.priceMinPkr)}
          </span>
        </div>
        <button
          type="button"
          className="px-5 py-2 rounded-xl bg-accent text-on-ink font-semibold text-xs flex items-center gap-1.5 shadow-xs"
        >
          {data.ticketUrl ? "Get Tickets" : "Register Now"}
          {data.ticketUrl && <ExternalLink className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}
