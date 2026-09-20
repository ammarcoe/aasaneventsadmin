"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { Event } from "@/types";
import { Copy, Calendar, Image as ImageIcon } from "lucide-react";

export interface DuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onDuplicate: (
    newTitle: string,
    shiftDays: number,
    cloneImages: boolean
  ) => Promise<void>;
  isLoading?: boolean;
}

export function DuplicateModal({
  isOpen,
  onClose,
  event,
  onDuplicate,
  isLoading = false,
}: DuplicateModalProps) {
  const [newTitle, setNewTitle] = useState(`${event.title} (Weekly Recurring)`);
  const [shiftDays, setShiftDays] = useState<number>(7);
  const [cloneImages, setCloneImages] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onDuplicate(newTitle, shiftDays, cloneImages);
  };

  const presetShifts = [
    { label: "+1 Week", days: 7 },
    { label: "+2 Weeks", days: 14 },
    { label: "+1 Month", days: 30 },
    { label: "Same Date", days: 0 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Event"
      description="Create a fresh draft clone with adjusted dates and zeroed registration counts."
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            <Copy className="w-4 h-4" />
            Duplicate as Draft
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Cloned Event Title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-ink">Date Shift Preset</label>
          <div className="flex flex-wrap gap-2">
            {presetShifts.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setShiftDays(p.days)}
                className={`px-3 py-1.5 text-xs rounded-md border font-medium transition-colors cursor-pointer ${
                  shiftDays === p.days
                    ? "bg-accent/20 border-accent text-accent-deep font-semibold"
                    : "bg-surface border-border text-ink hover:bg-surface-subtle"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <Select
          label="Custom Date Shift"
          value={String(shiftDays)}
          onChange={(e) => setShiftDays(Number(e.target.value))}
          options={[
            { value: "7", label: "+1 Week (+7 days) — Standard Recurring" },
            { value: "14", label: "+2 Weeks (+14 days)" },
            { value: "30", label: "+1 Month (+30 days)" },
            { value: "0", label: "Keep Same Date (Manual Adjust)" },
          ]}
        />

        {/* Clone Images Option */}
        <div className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-accent-deep" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-ink">Copy Event Artwork</span>
              <span className="text-[11px] text-ink-muted">
                Carry over banner and gallery images to draft
              </span>
            </div>
          </div>
          <Switch checked={cloneImages} onCheckedChange={setCloneImages} />
        </div>

        <div className="p-3 bg-surface-subtle border border-border rounded-lg text-xs text-ink-muted flex items-start gap-2">
          <Calendar className="w-4 h-4 text-accent-deep shrink-0 mt-0.5" />
          <div>
            <span>
              Cloned event will be set to <strong className="text-ink">Draft</strong>.
            </span>
            <p className="mt-0.5 text-ink-faint">
              All ticket types will be preserved with sold counts reset to 0.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
