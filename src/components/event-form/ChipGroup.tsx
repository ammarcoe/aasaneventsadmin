"use client";

import React from "react";
import {
  AMENITIES,
  AUDIENCES,
  LANGUAGES,
} from "@/features/events/constants";
import {
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
  AlertCircle,
  Plus,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Car: <Car className="w-3.5 h-3.5" />,
  Utensils: <Utensils className="w-3.5 h-3.5" />,
  Droplets: <Droplets className="w-3.5 h-3.5" />,
  Moon: <Moon className="w-3.5 h-3.5" />,
  Bath: <Bath className="w-3.5 h-3.5" />,
  Users: <Users className="w-3.5 h-3.5" />,
  Accessibility: <Accessibility className="w-3.5 h-3.5" />,
  Home: <Home className="w-3.5 h-3.5" />,
  Sun: <Sun className="w-3.5 h-3.5" />,
  Wifi: <Wifi className="w-3.5 h-3.5" />,
};

interface ChipGroupProps {
  selectedAudience: string[];
  selectedLanguages: string[];
  selectedAmenities: string[];
  onAudienceChange: (audience: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
  onAmenitiesChange: (amenities: string[]) => void;
  onAddEntryFaq?: () => void;
}

export function ChipGroup({
  selectedAudience,
  selectedLanguages,
  selectedAmenities,
  onAudienceChange,
  onLanguagesChange,
  onAmenitiesChange,
  onAddEntryFaq,
}: ChipGroupProps) {
  const toggleItem = (list: string[], id: string, onChange: (updated: string[]) => void) => {
    if (list.includes(id)) {
      onChange(list.filter((x) => x !== id));
    } else {
      onChange([...list, id]);
    }
  };

  const hasRestrictedAudience =
    selectedAudience.includes("women") || selectedAudience.includes("students");

  return (
    <div className="space-y-6">
      {/* 1. Who it's for (Audience) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--color-ink)]">
            Who it&apos;s for
          </label>
          <span className="text-[11px] text-[var(--color-ink-muted)]">
            Empty = open to everyone
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((aud) => {
            const isSelected = selectedAudience.includes(aud.id);
            return (
              <button
                key={aud.id}
                type="button"
                onClick={() => toggleItem(selectedAudience, aud.id, onAudienceChange)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <span>{aud.label}</span>
                {isSelected && (
                  <span className="text-[10px] bg-white/20 px-1 rounded uppercase font-bold">
                    {aud.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Restricted Audience Door Check Notice */}
        {hasRestrictedAudience && (
          <div className="mt-2 p-3 rounded-[var(--radius-md)] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold">Attendance restricted: </span>
                Add an FAQ explaining how this is checked at the door (e.g. student ID or CNIC).
              </div>
            </div>
            {onAddEntryFaq && (
              <button
                type="button"
                onClick={onAddEntryFaq}
                className="shrink-0 font-semibold text-amber-800 dark:text-amber-300 underline hover:no-underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add FAQ
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. Languages */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--color-ink)]">
            Languages spoken / performed
          </label>
          <span className="text-[11px] text-[var(--color-ink-muted)]">Multi-select</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.id);
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => toggleItem(selectedLanguages, lang.id, onLanguagesChange)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  isSelected
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Good to know (Amenities) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--color-ink)]">
            Good to know (Amenities & Venue features)
          </label>
          <span className="text-[11px] text-[var(--color-ink-muted)]">
            Highlights venue features
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity.id);
            return (
              <button
                key={amenity.id}
                type="button"
                onClick={() => toggleItem(selectedAmenities, amenity.id, onAmenitiesChange)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-xs"
                    : "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]"
                }`}
              >
                <span className={isSelected ? "text-white" : "text-[var(--color-accent)]"}>
                  {iconMap[amenity.icon] || <Home className="w-3.5 h-3.5" />}
                </span>
                <span>{amenity.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default ChipGroup;
