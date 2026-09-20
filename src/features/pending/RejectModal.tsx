"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ShieldAlert } from "lucide-react";

export interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  onReject: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

const REASONS = [
  "Inappropriate content or community guidelines violation",
  "Misleading or inaccurate event details or pricing",
  "Low quality banner image or unreadable flyer text",
  "Duplicate submission",
  "Missing required venue permission or unauthorized host",
  "Other reason (specify in note below)",
];

export function RejectModal({
  isOpen,
  onClose,
  eventTitle,
  onReject,
  isLoading = false,
}: RejectModalProps) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = note.trim()
      ? `${selectedReason}: ${note.trim()}`
      : selectedReason;
    await onReject(finalReason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Event Submission"
      description={`Provide a clear reason for rejecting "${eventTitle}". The organizer will see this in the app.`}
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            <ShieldAlert className="w-4 h-4" />
            Confirm Rejection
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-ink uppercase tracking-wide">
            Reason for Rejection
          </label>
          <div className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                  selectedReason === r
                    ? "bg-surface-subtle border-border-strong text-ink font-medium"
                    : "bg-surface border-border text-ink-muted hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="accent-accent text-accent"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        <Textarea
          label="Additional Feedback / Note (Optional)"
          placeholder="Give the organizer specific actionable instructions so they can correct and resubmit..."
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </form>
    </Modal>
  );
}
