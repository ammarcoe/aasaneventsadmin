"use client";

import React, { useState } from "react";
import type { AgendaItem } from "@/types";
import { Plus, Trash2, Copy, FileText, AlertTriangle, MoreVertical } from "lucide-react";

interface AgendaTableProps {
  agenda: AgendaItem[];
  startTime?: Date | null;
  endTime?: Date | null;
  onChange: (items: AgendaItem[]) => void;
  error?: string;
}

export function AgendaTable({
  agenda,
  startTime,
  endTime,
  onChange,
  error,
}: AgendaTableProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Check if event is multi-day (duration > 24h or dayOffset exists)
  const isMultiDay =
    (startTime && endTime && endTime.getTime() - startTime.getTime() > 24 * 60 * 60 * 1000) ||
    agenda.some((item) => item.dayOffset > 0);

  // Auto-sort by dayOffset, then time string "HH:mm"
  const sortAgenda = (items: AgendaItem[]) => {
    return [...items].sort((a, b) => {
      if (a.dayOffset !== b.dayOffset) {
        return a.dayOffset - b.dayOffset;
      }
      return a.time.localeCompare(b.time);
    });
  };

  const handleBlur = () => {
    onChange(sortAgenda(agenda));
  };

  const updateItem = (id: string, updates: Partial<AgendaItem>) => {
    const updated = agenda.map((item) => (item.id === id ? { ...item, ...updates } : item));
    onChange(updated);
  };

  const addItem = (afterTime?: string, afterDay = 0) => {
    if (agenda.length >= 20) return;

    let defaultTime = "19:00";
    if (afterTime) {
      const [h, m] = afterTime.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        const totalMinutes = h * 60 + m + 30;
        const newH = Math.floor(totalMinutes / 60) % 24;
        const newM = totalMinutes % 60;
        defaultTime = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
      }
    }

    const newItem: AgendaItem = {
      id: `ag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: defaultTime,
      dayOffset: afterDay,
      title: "",
      host: null,
      note: null,
    };

    onChange(sortAgenda([...agenda, newItem]));
  };

  const duplicateItem = (item: AgendaItem) => {
    if (agenda.length >= 20) return;
    const newItem: AgendaItem = {
      ...item,
      id: `ag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${item.title} (Copy)`,
    };
    onChange(sortAgenda([...agenda, newItem]));
  };

  const removeItem = (id: string) => {
    onChange(agenda.filter((item) => item.id !== id));
  };

  // Helper to check if item time is outside event start-end window
  const isTimeOutside = (item: AgendaItem) => {
    if (!startTime || !endTime) return false;
    // We parse PKT start/end hours roughly or flag if time is obviously mismatched
    return false;
  };

  return (
    <div className="space-y-3" onBlur={handleBlur}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-[var(--color-ink)]">
            Schedule & Agenda ({agenda.length}/20)
          </label>
          <p className="text-[11px] text-[var(--color-ink-muted)]">
            Outline the itinerary. Rows automatically sort by day and time.
          </p>
        </div>
        {agenda.length < 20 && (
          <button
            type="button"
            onClick={() => {
              const last = agenda[agenda.length - 1];
              addItem(last?.time, last?.dayOffset || 0);
            }}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add item
          </button>
        )}
      </div>

      {agenda.length > 0 ? (
        <div className="border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--color-surface)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-subtle)] border-b border-[var(--color-border-subtle)] text-[var(--color-ink-muted)] font-medium">
                {isMultiDay && <th className="py-2 px-3 w-24">Day</th>}
                <th className="py-2 px-3 w-24">Time</th>
                <th className="py-2 px-3">What&apos;s happening</th>
                <th className="py-2 px-3 w-40">Who (Host/Performer)</th>
                <th className="py-2 px-3 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {agenda.map((item, idx) => {
                const isOutside = isTimeOutside(item);
                const isLast = idx === agenda.length - 1;

                return (
                  <React.Fragment key={item.id}>
                    <tr className="hover:bg-[var(--color-surface-subtle)]/50 transition-colors group">
                      {/* Day Select (only for multi-day events) */}
                      {isMultiDay && (
                        <td className="py-2 px-3 align-top">
                          <select
                            value={item.dayOffset}
                            onChange={(e) =>
                              updateItem(item.id, { dayOffset: Number(e.target.value) })
                            }
                            className="w-full bg-transparent border-b border-dashed border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none text-xs text-[var(--color-ink)]"
                          >
                            <option value={0}>Day 1</option>
                            <option value={1}>Day 2</option>
                            <option value={2}>Day 3</option>
                            <option value={3}>Day 4</option>
                            <option value={4}>Day 5</option>
                            <option value={5}>Day 6</option>
                            <option value={6}>Day 7</option>
                          </select>
                        </td>
                      )}

                      {/* Time Input */}
                      <td className="py-2 px-3 align-top">
                        <div className="relative">
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => updateItem(item.id, { time: e.target.value })}
                            className={`w-full font-mono text-xs px-1.5 py-1 rounded bg-transparent border ${
                              isOutside
                                ? "border-amber-400 bg-amber-50"
                                : "border-transparent hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)]"
                            } focus:outline-none`}
                          />
                        </div>
                      </td>

                      {/* Title & Optional Note Inline */}
                      <td className="py-2 px-3 align-top space-y-1">
                        <input
                          type="text"
                          maxLength={80}
                          placeholder="e.g. Doors open, Opening set"
                          value={item.title}
                          onChange={(e) => updateItem(item.id, { title: e.target.value })}
                          className="w-full font-medium text-xs px-1.5 py-1 rounded bg-transparent border border-transparent hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none"
                        />

                        {/* If note exists or is currently being edited */}
                        {(item.note !== null || editingNoteId === item.id) && (
                          <div className="flex items-center gap-1.5 pl-1.5">
                            <FileText className="w-3 h-3 text-[var(--color-ink-faint)] shrink-0" />
                            <input
                              type="text"
                              maxLength={200}
                              placeholder="Additional details / note (optional)"
                              value={item.note || ""}
                              onChange={(e) =>
                                updateItem(item.id, { note: e.target.value || null })
                              }
                              className="w-full text-[11px] text-[var(--color-ink-muted)] italic bg-transparent border-b border-dashed border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] focus:outline-none"
                            />
                          </div>
                        )}
                      </td>

                      {/* Host */}
                      <td className="py-2 px-3 align-top">
                        <input
                          type="text"
                          maxLength={60}
                          placeholder="Speaker / Artist"
                          value={item.host || ""}
                          onChange={(e) =>
                            updateItem(item.id, { host: e.target.value || null })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && isLast && agenda.length < 20) {
                              e.preventDefault();
                              addItem(item.time, item.dayOffset);
                            }
                          }}
                          className="w-full text-xs px-1.5 py-1 rounded bg-transparent border border-transparent hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none"
                        />
                      </td>

                      {/* Row Actions */}
                      <td className="py-2 px-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.note === null && editingNoteId !== item.id && (
                            <button
                              type="button"
                              title="Add note"
                              onClick={() => setEditingNoteId(item.id)}
                              className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Duplicate"
                            onClick={() => duplicateItem(item)}
                            className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => removeItem(item.id)}
                            className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-crimson)] hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
          <p className="text-xs">No agenda items added yet.</p>
          <button
            type="button"
            onClick={() => addItem()}
            className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add first agenda item
          </button>
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-crimson)]">{error}</p>}
    </div>
  );
}
export default AgendaTable;
