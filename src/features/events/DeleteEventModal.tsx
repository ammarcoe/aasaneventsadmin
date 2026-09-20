"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Trash2, AlertTriangle, ShieldAlert } from "lucide-react";

export interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  eventTitle: string;
  registeredCount: number;
  isLoading?: boolean;
}

export function DeleteEventModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  registeredCount,
  isLoading = false,
}: DeleteEventModalProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const isDeleteBlocked = registeredCount > 0;
  const isMatch = confirmInput.trim() === eventTitle.trim();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeleteBlocked || !isMatch) return;
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Event"
      description="Permanently delete this event from the database."
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
            disabled={isDeleteBlocked || !isMatch}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete Permanently
          </Button>
        </>
      }
    >
      <form onSubmit={handleDelete} className="flex flex-col gap-4">
        {isDeleteBlocked ? (
          <div className="p-4 bg-crimson-surface border border-crimson/30 rounded-lg text-xs text-crimson flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm">Deletion Blocked</span>
              <p className="mt-1 leading-relaxed">
                This event has <strong>{registeredCount} registered attendees</strong>. Deleting it would orphan ticket holder records. To take the event down safely, use the <strong>Cancel Event</strong> action instead.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3.5 bg-crimson-surface border border-crimson/20 rounded-lg text-xs text-crimson flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">This action cannot be undone</span>
                <p className="mt-0.5 text-crimson/80">
                  The event record, associated metadata, and ticket configurations will be erased.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-ink">
                Type <span className="font-bold underline select-all">{eventTitle}</span> to confirm:
              </label>
              <Input
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Enter exact event title"
                autoFocus
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
