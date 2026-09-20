"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { EventFormValues } from "./schema";
import { CheckCircle2, AlertCircle, Send, Sparkles } from "lucide-react";

export function getPublishGateMissingItems(data: Partial<EventFormValues>): string[] {
  const missing: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    missing.push("Event title is required");
  }
  if (!data.imageUrls || data.imageUrls.length === 0 || !data.imageUrls[0]) {
    missing.push("At least one banner image is required");
  }
  if (!data.categoryId) {
    missing.push("Category must be selected");
  }
  if (!data.startTime) {
    missing.push("Start time must be provided");
  } else if (new Date(data.startTime).getTime() <= Date.now()) {
    missing.push("Start time must be in the future");
  }
  if (!data.venueName || data.venueName.trim().length === 0) {
    missing.push("Venue name is required");
  }
  if (!data.organizerName || data.organizerName.trim().length === 0) {
    missing.push("Organizer must be selected");
  }
  if (!data.ticketTypes || data.ticketTypes.length === 0) {
    missing.push("At least one ticket type must be configured");
  }
  const isPaid =
    Boolean(data.priceMinPkr && data.priceMinPkr > 0) ||
    data.ticketTypes?.some((t) => t.pricePkr > 0);
  if (isPaid && (!data.ticketUrl || data.ticketUrl.trim().length === 0)) {
    missing.push("Paid events require a ticket URL");
  }

  return missing;
}

import { Switch } from "@/components/ui/Switch";
import { Bell, BellOff, Smartphone } from "lucide-react";

export interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { skipNotification: boolean }) => Promise<void>;
  eventTitle: string;
  organizerName: string;
  followerCount?: number;
  eventDateFormatted?: string;
  isRepublish?: boolean;
  isLoading?: boolean;
}

export function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  organizerName,
  followerCount = 142,
  eventDateFormatted = "Upcoming PKT",
  isRepublish = false,
  isLoading = false,
}: PublishConfirmModalProps) {
  const [skipNotification, setSkipNotification] = React.useState(false);

  const handleConfirm = async () => {
    await onConfirm({ skipNotification });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRepublish ? "Confirm Republishing Event" : "Publish Event to App"}
      description="This will make the event live in the mobile app feed."
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
            onClick={handleConfirm}
          >
            <Send className="w-4 h-4" />
            {skipNotification ? "Publish Quietly" : "Publish & Notify"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="p-3.5 rounded-lg bg-surface-subtle border border-border flex flex-col gap-1">
          <div className="text-sm font-semibold text-ink">{eventTitle}</div>
          <div className="text-xs text-ink-muted">
            Organizer: <span className="font-semibold text-ink">{organizerName}</span>
          </div>
        </div>

        {/* Mock Push Notification Card */}
        {!skipNotification && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-accent-deep" />
              Mock Mobile Push Preview
            </span>
            <div className="p-3.5 bg-surface border border-border rounded-xl shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-ink-muted">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <div className="w-4 h-4 rounded bg-accent flex items-center justify-center text-[9px] text-on-ink font-black">
                    A
                  </div>
                  <span>AASANEVENT</span>
                </div>
                <span>now</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-ink">New Event from {organizerName}</span>
                <span className="text-xs text-ink-muted line-clamp-1">
                  {eventTitle} · {eventDateFormatted}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-accent-deep font-medium">
              Estimated reach: ~{followerCount} active followers &amp; subscribers
            </span>
          </div>
        )}

        {/* Publish Quietly Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-surface-subtle border border-border rounded-xl">
          <div className="flex flex-col pr-4">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              {skipNotification ? (
                <BellOff className="w-3.5 h-3.5 text-crimson" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-accent-deep" />
              )}
              Publish quietly
            </span>
            <span className="text-[11px] text-ink-muted mt-0.5">
              Make event visible without triggering push notifications to followers.
            </span>
          </div>
          <Switch
            checked={skipNotification}
            onCheckedChange={setSkipNotification}
            aria-label="Publish quietly toggle"
          />
        </div>

        {isRepublish && (
          <div className="p-3 rounded-lg bg-sand/30 border border-sand text-xs text-ink flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-ink">Republish Notice</span>
              <p className="text-ink-muted mt-0.5">
                This event was already live previously. If quiet mode is unchecked, notifications may be broadcast again.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
