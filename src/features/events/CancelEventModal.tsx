"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { AlertTriangle, XCircle } from "lucide-react";

export interface CancelEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  eventTitle: string;
  registeredCount: number;
  isLoading?: boolean;
}

export function CancelEventModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  registeredCount,
  isLoading = false,
}: CancelEventModalProps) {
  const [reason, setReason] = useState("");

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel Event"
      description="Cancelling will unfeature the event and mark it as cancelled across the app."
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Keep Event
          </Button>
          <Button
            type="button"
            variant="destructive"
            isLoading={isLoading}
            onClick={handleCancel}
          >
            <XCircle className="w-4 h-4" />
            Confirm Cancellation
          </Button>
        </>
      }
    >
      <form onSubmit={handleCancel} className="flex flex-col gap-4">
        {registeredCount > 0 && (
          <div className="p-3.5 bg-crimson-surface border border-crimson/30 rounded-lg text-xs text-crimson flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                Warning: {registeredCount} registered attendee{registeredCount > 1 ? "s" : ""}
              </span>
              <p className="mt-0.5 text-crimson/90">
                Cancelling this event will affect existing ticket holders. Be sure to provide an informative explanation below.
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-ink-muted">
          Event: <strong className="text-ink">{eventTitle}</strong>
        </div>

        <Textarea
          label="Cancellation Reason (Public Notice)"
          placeholder="e.g. Due to unforeseen venue maintenance, this event has been cancelled..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          helperText="Displayed to users and ticket holders in the mobile application."
        />
      </form>
    </Modal>
  );
}
