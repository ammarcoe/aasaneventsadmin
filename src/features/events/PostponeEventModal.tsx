"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { pktToDate, dateToPktParts, pktLabel } from "@/lib/pkt";
import { Calendar, Clock, AlertCircle } from "lucide-react";

export interface PostponeEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    newStartTime?: Date | null;
    newEndTime?: Date | null;
    reason?: string;
  }) => Promise<void>;
  eventTitle: string;
  currentStartTime?: Date;
  currentEndTime?: Date | null;
  isLoading?: boolean;
}

export function PostponeEventModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  currentStartTime,
  currentEndTime,
  isLoading = false,
}: PostponeEventModalProps) {
  const currentParts = dateToPktParts(currentStartTime);
  const currentEndParts = dateToPktParts(currentEndTime);

  const [dateStr, setDateStr] = useState(currentParts.date);
  const [timeStr, setTimeStr] = useState(currentParts.time);
  const [endDateStr, setEndDateStr] = useState(currentEndParts.date);
  const [endTimeStr, setEndTimeStr] = useState(currentEndParts.time);
  const [hasNewDate, setHasNewDate] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let newStart: Date | null = null;
    let newEnd: Date | null = null;

    if (hasNewDate && dateStr && timeStr) {
      newStart = pktToDate(dateStr, timeStr);
      if (endDateStr && endTimeStr) {
        newEnd = pktToDate(endDateStr, endTimeStr);
      }
    }

    await onConfirm({
      newStartTime: newStart,
      newEndTime: newEnd,
      reason,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Postpone Event"
      description="Mark event as postponed with an optional rescheduled date."
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
            <Clock className="w-4 h-4" />
            Confirm Postpone
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-xs text-ink-muted">
          Event: <strong className="text-ink">{eventTitle}</strong>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasNewDate"
            checked={hasNewDate}
            onChange={(e) => setHasNewDate(e.target.checked)}
            className="rounded text-accent focus:ring-accent"
          />
          <label htmlFor="hasNewDate" className="text-xs font-semibold text-ink cursor-pointer">
            Reschedule to a new date and time right now
          </label>
        </div>

        {hasNewDate && (
          <div className="p-3.5 bg-surface-subtle border border-border rounded-lg flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="New Start Date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required={hasNewDate}
              />
              <Input
                type="time"
                label="New Start Time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                required={hasNewDate}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="New End Date (Optional)"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
              />
              <Input
                type="time"
                label="New End Time (Optional)"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
              />
            </div>
          </div>
        )}

        <Textarea
          label="Postpone Notice / Reason"
          placeholder="e.g. Due to weather advisories, this event is rescheduled..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          helperText="Reason will be visible on the event card and detail screen."
        />
      </form>
    </Modal>
  );
}
