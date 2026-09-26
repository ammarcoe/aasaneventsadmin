"use client";

import React, { useState } from "react";
import type { EventFormValues } from "@/features/events/schema";
import { EventImageView } from "./EventImageView";
import { pktMobileDateLine, pktLabel } from "@/lib/pkt";
import { formatPKR } from "@/lib/utils";
import {
  AMENITIES,
  AUDIENCES,
  LANGUAGES,
} from "@/features/events/constants";
import {
  MapPin,
  Heart,
  Star,
  Sparkles,
  Calendar,
  Languages,
  ChevronDown,
  ChevronUp,
  Clock,
  Car,
  Utensils,
  Droplets,
  Moon,
  Bath,
  Users,
  Accessibility,
  Home,
  Sun,
  Wifi,
  ExternalLink,
} from "lucide-react";

const amenityIconMap: Record<string, React.ReactNode> = {
  Car: <Car className="w-3 h-3" />,
  Utensils: <Utensils className="w-3 h-3" />,
  Droplets: <Droplets className="w-3 h-3" />,
  Moon: <Moon className="w-3 h-3" />,
  Bath: <Bath className="w-3 h-3" />,
  Users: <Users className="w-3 h-3" />,
  Accessibility: <Accessibility className="w-3 h-3" />,
  Home: <Home className="w-3 h-3" />,
  Sun: <Sun className="w-3 h-3" />,
  Wifi: <Wifi className="w-3 h-3" />,
};

interface PhonePreviewProps {
  data: Partial<EventFormValues>;
}

export function PhonePreview({ data }: PhonePreviewProps) {
  const [viewMode, setViewMode] = useState<"card" | "page">("card");
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  const coverImage = data.images?.[0] || null;
  const fallbackCoverUrl = data.imageUrls?.[0] || null;
  const title = data.title?.trim() || "Untitled Event";
  const venue = data.venueName?.trim() || "Venue not specified";
  const organizer = data.organizerName?.trim() || "Organizer";
  const dateLine = pktMobileDateLine(data.startTime);
  const dateStr = data.startTime ? pktLabel(data.startTime) : "Date to be announced";

  const priceText =
    data.priceMinPkr === 0 || (!data.priceMinPkr && !data.priceMaxPkr)
      ? "Free"
      : data.priceMinPkr && data.priceMaxPkr && data.priceMinPkr !== data.priceMaxPkr
      ? `${formatPKR(data.priceMinPkr)} - ${formatPKR(data.priceMaxPkr)}`
      : formatPKR(data.priceMinPkr ?? 0);

  // Audience Badges
  const audienceList = (data.audience || []).map((id) =>
    AUDIENCES.find((a) => a.id === id)
  ).filter(Boolean);

  // Languages line
  const selectedLanguages = (data.languages || [])
    .map((id) => LANGUAGES.find((l) => l.id === id)?.label)
    .filter(Boolean);
  const languagesText =
    selectedLanguages.length > 0 ? `In ${selectedLanguages.join(" & ")}` : null;

  // Amenities
  const selectedAmenities = (data.amenities || [])
    .map((id) => AMENITIES.find((a) => a.id === id))
    .filter(Boolean);

  // Agenda
  const agendaList = data.agenda || [];

  // FAQ
  const faqList = data.faq || [];

  return (
    <div className="space-y-3">
      {/* Toggle Bar: Card | Page */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-[var(--color-ink)]">Mobile Preview</div>
        <div className="flex rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("card")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              viewMode === "card"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Card
          </button>
          <button
            type="button"
            onClick={() => setViewMode("page")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              viewMode === "page"
                ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Page
          </button>
        </div>
      </div>

      {/* 320px Phone Frame */}
      <div className="w-[320px] mx-auto rounded-[24px] border-[3px] border-[var(--color-ink)]/80 bg-[var(--color-bg)] overflow-hidden shadow-lg flex flex-col font-sans">
        {/* Phone Notch/Status Bar */}
        <div className="h-5 bg-[var(--color-ink)] flex items-center justify-between px-5 text-[10px] text-white/70 select-none">
          <span>9:41</span>
          <div className="w-12 h-2.5 bg-black rounded-full" />
          <div className="flex items-center gap-1">
            <span className="text-[9px]">PKT</span>
          </div>
        </div>

        {/* Preview Container */}
        <div className="h-[480px] overflow-y-auto bg-[var(--color-bg)] text-[var(--color-ink)] text-xs">
          {viewMode === "card" ? (
            /* CARD PREVIEW: 2.4:1 Feed card */
            <div className="p-3">
              <div className="w-full bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden shadow-xs flex flex-col font-sans">
                {/* 2.4:1 Image Frame */}
                <div className="relative w-full aspect-[2.4/1] overflow-hidden bg-[var(--color-surface-subtle)] flex items-center justify-center">
                  <EventImageView
                    image={coverImage}
                    fallbackUrl={fallbackCoverUrl}
                    blur={false}
                    className="w-full h-full"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                    {data.categoryId && (
                      <div className="bg-white/95 backdrop-blur-xs text-[var(--color-ink)] text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                        {data.categoryId}
                      </div>
                    )}
                    {/* Women Only or Students Only urgency slot */}
                    {data.audience?.includes("women") && (
                      <div className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                        Women only
                      </div>
                    )}
                    {data.audience?.includes("students") && !data.audience?.includes("women") && (
                      <div className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                        Students
                      </div>
                    )}
                  </div>

                  {/* Top-Right Heart */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-[var(--color-ink-muted)]">
                      <Heart className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 flex flex-col gap-1.5">
                  <div className="text-[10px] font-bold tracking-wider text-[var(--color-crimson)] uppercase">
                    {dateLine}
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-ink)] leading-snug line-clamp-2">
                    {title}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-ink-muted)] line-clamp-1">
                    <MapPin className="w-3 h-3 text-[var(--color-ink-faint)] shrink-0" />
                    <span className="truncate">{venue}</span>
                  </div>

                  {/* Bottom Row */}
                  <div className="pt-2 mt-1 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[var(--color-ink)]">
                      {priceText}
                    </div>
                    <span className="text-[10px] text-[var(--color-ink-muted)] truncate max-w-[120px]">
                      {organizer}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PAGE PREVIEW: Event Detail Screen */
            <div className="flex flex-col pb-8">
              {/* Poster (4:3 aspect with blur in fit mode) */}
              <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
                <EventImageView
                  image={coverImage}
                  fallbackUrl={fallbackCoverUrl}
                  blur={true}
                  className="w-full h-full"
                />
              </div>

              <div className="p-3.5 space-y-3.5">
                {/* Title & Audience Badges */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[var(--color-ink)] leading-tight">
                    {title}
                  </h3>

                  {/* Audience Badges */}
                  {audienceList.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {audienceList.map((aud: any) => (
                        <span
                          key={aud.id}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                            aud.id === "women"
                              ? "bg-rose-100 text-rose-700 border border-rose-300"
                              : aud.id === "students"
                              ? "bg-blue-100 text-blue-700 border border-blue-300"
                              : "bg-[var(--color-surface-subtle)] text-[var(--color-ink)] border border-[var(--color-border-subtle)]"
                          }`}
                        >
                          {aud.badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Facts Block */}
                <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-crimson)] shrink-0" />
                    <span className="font-semibold text-[var(--color-ink)]">{dateStr}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-ink-muted)] shrink-0" />
                    <span className="text-[var(--color-ink-muted)] truncate">{venue}</span>
                  </div>
                  {languagesText && (
                    <div className="flex items-center gap-2 text-[11px] pt-1 border-t border-[var(--color-border-subtle)] text-[var(--color-ink-muted)]">
                      <Languages className="w-3.5 h-3.5 text-[var(--color-accent)] shrink-0" />
                      <span>{languagesText}</span>
                    </div>
                  )}
                </div>

                {/* About Card */}
                {data.description && (
                  <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-1">
                    <div className="text-[11px] font-bold text-[var(--color-ink)]">About</div>
                    <p className="text-[11px] text-[var(--color-ink-muted)] leading-relaxed line-clamp-4">
                      {data.description}
                    </p>
                  </div>
                )}

                {/* Agenda Card */}
                {agendaList.length > 0 && (
                  <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
                    <div className="text-[11px] font-bold text-[var(--color-ink)] flex items-center justify-between">
                      <span>Agenda</span>
                      <span className="text-[10px] text-[var(--color-ink-muted)] font-normal">
                        {agendaList.length} items
                      </span>
                    </div>
                    <div className="space-y-2 border-l border-[var(--color-border-subtle)] pl-2 ml-1">
                      {agendaList.slice(0, 4).map((item) => (
                        <div key={item.id} className="text-[11px] space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--color-crimson)] font-mono text-[10px]">
                              {item.time}
                            </span>
                            <span className="font-semibold text-[var(--color-ink)]">
                              {item.title}
                            </span>
                          </div>
                          {item.host && (
                            <div className="text-[10px] text-[var(--color-accent)]">
                              with {item.host}
                            </div>
                          )}
                        </div>
                      ))}
                      {agendaList.length > 4 && (
                        <div className="text-[10px] text-[var(--color-accent)] font-semibold">
                          +{agendaList.length - 4} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Good to know (Amenities) */}
                {selectedAmenities.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[var(--color-ink)]">
                      Good to know
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAmenities.map((am: any) => (
                        <span
                          key={am.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-ink-muted)] font-medium"
                        >
                          {amenityIconMap[am.icon]}
                          {am.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ Accordion */}
                {faqList.length > 0 && (
                  <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
                    <div className="text-[11px] font-bold text-[var(--color-ink)]">FAQ</div>
                    <div className="divide-y divide-[var(--color-border-subtle)]">
                      {faqList.map((item) => {
                        const isOpen = expandedFaqId === item.id;
                        return (
                          <div key={item.id} className="py-1.5">
                            <button
                              type="button"
                              onClick={() => setExpandedFaqId(isOpen ? null : item.id)}
                              className="w-full flex items-center justify-between text-left text-[11px] font-semibold text-[var(--color-ink)]"
                            >
                              <span>{item.q}</span>
                              {isOpen ? (
                                <ChevronUp className="w-3 h-3 text-[var(--color-ink-muted)]" />
                              ) : (
                                <ChevronDown className="w-3 h-3 text-[var(--color-ink-muted)]" />
                              )}
                            </button>
                            {isOpen && (
                              <p className="text-[10px] text-[var(--color-ink-muted)] leading-relaxed mt-1">
                                {item.a}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Organizer Card */}
                <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] flex items-center justify-center text-xs font-bold text-[var(--color-ink)] shrink-0">
                    {organizer.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[var(--color-ink)] truncate">
                      {organizer}
                    </div>
                    <div className="text-[9px] text-[var(--color-ink-muted)]">Organizer</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default PhonePreview;
