"use client";

import React, { useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FaqItem } from "@/types";
import { FAQ_PRESETS } from "@/features/events/constants";
import { GripVertical, Plus, Trash2, HelpCircle } from "lucide-react";

interface FaqRowProps {
  item: FaqItem;
  onChange: (updates: Partial<FaqItem>) => void;
  onRemove: () => void;
}

function FaqRow({ item, onChange, onRemove }: FaqRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const isAnswerEmpty = !item.a || item.a.trim().length === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3.5 rounded-[var(--radius-md)] border bg-[var(--color-surface)] transition-all ${
        isDragging
          ? "opacity-40 border-[var(--color-accent)]"
          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Drag Handle */}
        <button
          type="button"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="mt-1 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] cursor-grab active:cursor-grabbing p-0.5 rounded"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Content Area */}
        <div className="flex-1 space-y-2">
          {/* Question Input */}
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              maxLength={120}
              placeholder="Question (e.g. Is there parking?)"
              value={item.q}
              onChange={(e) => onChange({ q: e.target.value })}
              className="w-full text-xs font-semibold text-[var(--color-ink)] px-2 py-1 rounded bg-[var(--color-surface-subtle)] border border-transparent focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:outline-none"
            />
            <span className="text-[10px] text-[var(--color-ink-faint)] shrink-0">
              {item.q.length}/120
            </span>
          </div>

          {/* Answer Textarea */}
          <div className="relative">
            <textarea
              rows={2}
              maxLength={600}
              placeholder="Provide a clear, helpful answer..."
              value={item.a}
              onChange={(e) => onChange({ a: e.target.value })}
              className={`w-full text-xs text-[var(--color-ink)] p-2 rounded bg-transparent border ${
                isAnswerEmpty
                  ? "border-red-300 dark:border-red-900/60 placeholder:text-[var(--color-crimson)]"
                  : "border-[var(--color-border-subtle)] focus:border-[var(--color-accent)]"
              } focus:outline-none resize-y`}
            />
            <div className="flex justify-between items-center text-[10px] text-[var(--color-ink-muted)] mt-0.5 px-1">
              {isAnswerEmpty ? (
                <span className="text-[var(--color-crimson)] font-medium">Add an answer</span>
              ) : (
                <span />
              )}
              <span>{item.a.length}/600</span>
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          title="Delete FAQ"
          onClick={onRemove}
          className="p-1 rounded text-[var(--color-ink-faint)] hover:text-[var(--color-crimson)] hover:bg-red-50 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface FaqListProps {
  faq: FaqItem[];
  onChange: (items: FaqItem[]) => void;
  error?: string;
}

export function FaqList({ faq, onChange, error }: FaqListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = faq.findIndex((item) => item.id === active.id);
      const newIndex = faq.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(faq, oldIndex, newIndex));
      }
    }
  };

  const addFaq = (question = "") => {
    if (faq.length >= 12) return;
    const newItem: FaqItem = {
      id: `faq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      q: question,
      a: "",
    };
    onChange([...faq, newItem]);
  };

  const updateFaq = (id: string, updates: Partial<FaqItem>) => {
    onChange(faq.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeFaq = (id: string) => {
    onChange(faq.filter((item) => item.id !== id));
  };

  // Filter available suggestions (exclude questions already in FAQ list)
  const availablePresets = FAQ_PRESETS.filter(
    (preset) => !faq.some((item) => item.q.trim().toLowerCase() === preset.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-[var(--color-ink)]">
            Frequently Asked Questions ({faq.length}/12)
          </label>
          <p className="text-[11px] text-[var(--color-ink-muted)]">
            Help attendees with practical venue & event rules.
          </p>
        </div>
        {faq.length < 12 && (
          <button
            type="button"
            onClick={() => addFaq()}
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add question
          </button>
        )}
      </div>

      {/* Preset Suggestions Row */}
      {availablePresets.length > 0 && faq.length < 12 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-[var(--color-ink-muted)] flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-[var(--color-accent)]" />
            Quick Suggestions:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availablePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addFaq(preset)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--color-surface-subtle)] hover:bg-[var(--color-accent-subtle)] hover:text-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-border-subtle)] transition-colors"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FAQ List */}
      {faq.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={faq.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2.5">
              {faq.map((item) => (
                <FaqRow
                  key={item.id}
                  item={item}
                  onChange={(updates) => updateFaq(item.id, updates)}
                  onRemove={() => removeFaq(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-6 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
          <p className="text-xs">No FAQs added yet.</p>
          <button
            type="button"
            onClick={() => addFaq()}
            className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add custom FAQ
          </button>
        </div>
      )}

      {error && <p className="text-xs text-[var(--color-crimson)]">{error}</p>}
    </div>
  );
}
export default FaqList;
