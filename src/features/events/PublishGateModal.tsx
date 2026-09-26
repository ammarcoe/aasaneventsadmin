"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { EventFormValues } from "./schema";
import { CheckCircle2, AlertCircle, Send, Sparkles, Bell, BellOff, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/Switch";

export function getPublishGateMissingItems(data: Partial<EventFormValues>): string[] {
  const missing: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    missing.push("Event title is required");
  }
  if ((!data.images || data.images.length === 0) && (!data.imageUrls || data.imageUrls.length === 0)) {
    missing.push("At least one cover image is required");
  }
  if (!data.categoryId) {
    missing.push("Category must be selected");
  }
  if (!data.startTime) {
    missing.push("Start time must be provided");
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

export interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options?: { skipNotification?: boolean }) => Promise<void> | void;
  eventTitle?: string;
  organizerName?: string;
  followerCount?: number;
  eventDateFormatted?: string;
  isRepublish?: boolean;
  isLoading?: boolean;
  isPublishing?: boolean;
  seriesCount?: number;
}

export function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle = "Event",
  organizerName = "Organizer",
  followerCount = 142,
  eventDateFormatted = "Upcoming PKT",
  isRepublish = false,
  isLoading = false,
  isPublishing = false,
  seriesCount,
}: PublishConfirmModalProps) {
  const [skipNotification, setSkipNotification] = useState(false);
  const loading = isLoading || isPublishing;

  const handleConfirm = async () => {
    await onConfirm({ skipNotification });
  };

  const isSeries = Boolean(seriesCount && seriesCount > 1);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isSeries
          ? `Publish Series (${seriesCount} Events)`
          : isRepublish
          ? "Confirm Republishing Event"
          : "Publish Event to App"
      }
      description={
        isSeries
          ? `This will create and publish ${seriesCount} events in the app feed.`
          : "This will make the event live in the mobile app feed."
      }
      maxWidth="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={loading}
            onClick={handleConfirm}
          >
            <Send className="w-4 h-4 mr-1.5" />
            {skipNotification ? "Publish Quietly" : "Publish & Notify"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 font-sans text-xs">
        {/* Series Notice */}
        {isSeries && (
          <div className="p-3 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/30 text-[var(--color-ink)] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[var(--color-ink)]">Series Broadcast Notice</span>
              <p className="text-[var(--color-ink-muted)] mt-0.5">
                Creates and publishes {seriesCount} events. Followers get <strong>one</strong> unified notification: &ldquo;{organizerName} added {seriesCount} events&rdquo;.
              </p>
            </div>
          </div>
        )}

        {/* Mock Push Notification Card */}
        {!skipNotification && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-[var(--color-accent)]" />
              Mock Mobile Push Preview
            </span>
            <div className="p-3.5 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-xl shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-[var(--color-ink-muted)]">
                <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)]">
                  <div className="w-4 h-4 rounded bg-[var(--color-accent)] flex items-center justify-center text-[9px] text-white font-black">
                    A
                  </div>
                  <span>AASANEVENT</span>
                </div>
                <span>now</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[var(--color-ink)]">
                  {isSeries
                    ? `${organizerName} added ${seriesCount} events`
                    : `New Event from ${organizerName}`}
                </span>
                <span className="text-xs text-[var(--color-ink-muted)] line-clamp-1">
                  {eventTitle} · {eventDateFormatted}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-[var(--color-accent)] font-medium">
              Estimated reach: ~{followerCount} active followers &amp; subscribers
            </span>
          </div>
        )}

        {/* Publish Quietly Toggle */}
        <div className="flex items-center justify-between p-3.5 bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] rounded-xl">
          <div className="flex flex-col pr-4">
            <span className="text-xs font-bold text-[var(--color-ink)] flex items-center gap-1.5">
              {skipNotification ? (
                <BellOff className="w-3.5 h-3.5 text-[var(--color-crimson)]" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              )}
              Publish quietly
            </span>
            <span className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
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
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Republish Notice</span>
              <p className="mt-0.5">
                This event was already live previously. If quiet mode is unchecked, notifications may be broadcast again.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
