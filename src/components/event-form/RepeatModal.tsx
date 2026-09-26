"use client";

import React, { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { addDays, addWeeks, addMonths, isBefore, isAfter } from "date-fns";
import { X, Calendar, Check, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const PKT_TZ = "Asia/Karachi";

export type RepeatPattern = "weekly" | "biweekly" | "monthly_date" | "monthly_weekday";

export interface SeriesOccurrence {
  index: number;
  startTime: Date;
  endTime: Date | null;
  isSelected: boolean;
  hasClash?: boolean;
}

interface RepeatModalProps {
  isOpen: boolean;
  baseStartTime: Date;
  baseEndTime: Date | null;
  initialOccurrences?: SeriesOccurrence[];
  onClose: () => void;
  onApply: (occurrences: SeriesOccurrence[]) => void;
}

export function RepeatModal({
  isOpen,
  baseStartTime,
  baseEndTime,
  initialOccurrences,
  onClose,
  onApply,
}: RepeatModalProps) {
  const [pattern, setPattern] = useState<RepeatPattern>("weekly");
  const [endMode, setEndMode] = useState<"count" | "date">("count");
  const [eventCount, setEventCount] = useState<number>(8);
  const [endDate, setEndDate] = useState<string>("");
  const [occurrences, setOccurrences] = useState<SeriesOccurrence[]>([]);

  // Duration between start and end
  const durationMs =
    baseEndTime && baseEndTime > baseStartTime
      ? baseEndTime.getTime() - baseStartTime.getTime()
      : 2 * 60 * 60 * 1000; // default 2h

  // Generate occurrences whenever base dates or repeat options change
  useEffect(() => {
    if (!isOpen) return;

    const list: SeriesOccurrence[] = [];
    const maxLimit = 12;
    const targetCount = endMode === "count" ? Math.min(eventCount, maxLimit) : maxLimit;
    const maxEndDate = addMonths(baseStartTime, 6);

    let currentDate = new Date(baseStartTime);
    let index = 1;

    while (list.length < targetCount) {
      if (endMode === "date" && endDate) {
        const endDateTime = new Date(`${endDate}T23:59:59`);
        if (isAfter(currentDate, endDateTime)) break;
      }

      if (isAfter(currentDate, maxEndDate)) break;

      const occurrenceEnd = new Date(currentDate.getTime() + durationMs);

      // Check if was previously selected or not
      const existing = initialOccurrences?.find((o) => o.index === index);
      const isSelected = existing ? existing.isSelected : true;

      list.push({
        index,
        startTime: new Date(currentDate),
        endTime: occurrenceEnd,
        isSelected,
      });

      index++;

      // Compute next date
      if (pattern === "weekly") {
        currentDate = addWeeks(currentDate, 1);
      } else if (pattern === "biweekly") {
        currentDate = addWeeks(currentDate, 2);
      } else if (pattern === "monthly_date") {
        currentDate = addMonths(currentDate, 1);
      } else if (pattern === "monthly_weekday") {
        // e.g. same weekday of month roughly 4 weeks
        currentDate = addWeeks(currentDate, 4);
      }
    }

    setOccurrences(list);
  }, [isOpen, baseStartTime, baseEndTime, pattern, endMode, eventCount, endDate, durationMs]);

  if (!isOpen) return null;

  const toggleOccurrence = (idx: number) => {
    setOccurrences((list) =>
      list.map((item) => (item.index === idx ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const selectAll = (selected: boolean) => {
    setOccurrences((list) => list.map((item) => ({ ...item, isSelected: selected })));
  };

  const selectedCount = occurrences.filter((o) => o.isSelected).length;

  const handleSave = () => {
    onApply(occurrences.filter((o) => o.isSelected));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--color-accent)]" />
            <h2 className="text-base font-bold text-[var(--color-ink)]">Repeat this event</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[var(--color-ink)]">
          {/* Pattern options */}
          <div className="space-y-2">
            <label className="font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] text-[10px]">
              Repeat Pattern
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "weekly", label: "Weekly (+7 days)" },
                { id: "biweekly", label: "Every 2 weeks" },
                { id: "monthly_date", label: "Monthly (same date)" },
                { id: "monthly_weekday", label: "Monthly (same weekday)" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPattern(p.id as RepeatPattern)}
                  className={`p-2.5 rounded-[var(--radius-md)] border text-left font-medium transition-all ${
                    pattern === p.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-contrast)]"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ends options */}
          <div className="space-y-2">
            <label className="font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] text-[10px]">
              Series End
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endMode"
                  checked={endMode === "count"}
                  onChange={() => setEndMode("count")}
                  className="accent-[var(--color-accent)]"
                />
                <span>After</span>
                <select
                  disabled={endMode !== "count"}
                  value={eventCount}
                  onChange={(e) => setEventCount(Number(e.target.value))}
                  className="px-2 py-1 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface)] text-xs font-semibold"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} events
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endMode"
                  checked={endMode === "date"}
                  onChange={() => setEndMode("date")}
                  className="accent-[var(--color-accent)]"
                />
                <span>On date</span>
                <input
                  type="date"
                  disabled={endMode !== "date"}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-[var(--color-border-subtle)] rounded bg-[var(--color-surface)] text-xs"
                />
              </label>
            </div>
          </div>

          {/* Generated dates checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] text-[10px]">
                Generated Dates ({selectedCount}/{occurrences.length})
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="text-[11px] text-[var(--color-accent)] hover:underline font-medium"
                >
                  Select all
                </button>
                <span className="text-[var(--color-ink-faint)]">·</span>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="text-[11px] text-[var(--color-ink-muted)] hover:underline"
                >
                  Deselect all
                </button>
              </div>
            </div>

            <div className="border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] max-h-48 overflow-y-auto divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface)]">
              {occurrences.map((occ) => {
                const formatted = formatInTimeZone(
                  occ.startTime,
                  PKT_TZ,
                  "EEE d MMM yyyy · h:mm a"
                );
                return (
                  <label
                    key={occ.index}
                    className="flex items-center justify-between p-2.5 hover:bg-[var(--color-surface-subtle)] cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={occ.isSelected}
                        onChange={() => toggleOccurrence(occ.index)}
                        className="accent-[var(--color-accent)] w-4 h-4 rounded"
                      />
                      <span className="font-mono text-xs text-[var(--color-ink-muted)]">
                        #{occ.index}
                      </span>
                      <span className="font-medium text-[var(--color-ink)]">{formatted} PKT</span>
                    </div>

                    {occ.hasClash && (
                      <span className="text-[10px] text-amber-600 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        Clash
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--color-ink-muted)] italic">
              Untick individual dates if there are clashes or public holidays.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={selectedCount < 2}
            onClick={handleSave}
          >
            Use {selectedCount} dates
          </Button>
        </div>
      </div>
    </div>
  );
}
export default RepeatModal;
