"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Event } from "@/types";
import { pktLabel } from "@/lib/pkt";
import { formatPKR, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PublishConfirmModal } from "@/features/events/PublishGateModal";
import { RejectModal } from "./RejectModal";
import { EventImageView } from "@/components/event-form/EventImageView";
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Repeat,
} from "lucide-react";

export interface PendingGroup {
  isSeries: boolean;
  seriesId?: string;
  events: Event[];
}

export interface PendingCardProps {
  group: PendingGroup;
  onApprove: (eventId: string, organizerId?: string | null) => Promise<void>;
  onReject: (eventId: string, reason: string) => Promise<void>;
  onApproveSeries?: (seriesId: string, organizerId?: string | null) => Promise<void>;
  onRejectSeries?: (seriesId: string, reason: string) => Promise<void>;
}

export function PendingCard({
  group,
  onApprove,
  onReject,
  onApproveSeries,
  onRejectSeries,
}: PendingCardProps) {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const primaryEvent = group.events[0];
  if (!primaryEvent) return null;

  const isSeries = group.isSeries && group.events.length > 1;
  const seriesCount = group.events.length;
  const coverImage = primaryEvent.images?.[0] || null;
  const fallbackCoverUrl = primaryEvent.imageUrls?.[0] || null;

  const capacity =
    primaryEvent.capacity ??
    (Array.isArray(primaryEvent.ticketTypes)
      ? primaryEvent.ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0)
      : 0);

  const priceDisplay =
    primaryEvent.priceMinPkr === 0 || (!primaryEvent.priceMinPkr && !primaryEvent.priceMaxPkr)
      ? "Free"
      : formatPKR(primaryEvent.priceMinPkr);

  // Date range display for series vs single event
  const dateDisplay = isSeries
    ? `${pktLabel(group.events[0].startTime)} → ${pktLabel(
        group.events[group.events.length - 1].startTime
      )}`
    : pktLabel(primaryEvent.startTime);

  const handleConfirmApprove = async () => {
    setIsProcessing(true);
    try {
      if (isSeries && group.seriesId && onApproveSeries) {
        await onApproveSeries(group.seriesId, primaryEvent.organizerId);
      } else {
        await onApprove(primaryEvent.id, primaryEvent.organizerId);
      }
      setIsApproveModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    setIsProcessing(true);
    try {
      if (isSeries && group.seriesId && onRejectSeries) {
        await onRejectSeries(group.seriesId, reason);
      } else {
        await onReject(primaryEvent.id, reason);
      }
      setIsRejectModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:border-[var(--color-border-strong)] font-sans">
      <div className="flex items-start gap-4 min-w-0">
        {/* 120x90 Image Thumbnail with EventImageView */}
        <div className="w-[120px] h-[90px] rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] shrink-0 flex items-center justify-center">
          <EventImageView
            image={coverImage}
            fallbackUrl={fallbackCoverUrl}
            blur={false}
            className="w-full h-full"
          />
        </div>

        {/* Details Column */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="pending" size="sm">
              Submitted {formatRelativeTime(primaryEvent.createdAt)}
            </Badge>

            {isSeries && (
              <span className="bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 border border-[var(--color-accent)]/20">
                <Repeat className="w-2.5 h-2.5" />
                SERIES · {seriesCount}
              </span>
            )}

            <span className="text-[11px] text-[var(--color-accent)] font-semibold uppercase tracking-wider">
              {primaryEvent.categoryId}
            </span>
          </div>

          <h3
            className="text-base font-bold text-[var(--color-ink)] truncate max-w-lg"
            title={primaryEvent.title}
          >
            {primaryEvent.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ink-muted)]">
            <span className="flex items-center gap-1 font-medium text-[var(--color-ink)]">
              <Users className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              {primaryEvent.organizerName}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-[var(--color-ink-faint)]" />
              {dateDisplay}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-ink-faint)]" />
              {primaryEvent.venueName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs mt-1">
            <span className="font-semibold text-[var(--color-ink)]">
              Price: <span className="font-mono text-[var(--color-accent)]">{priceDisplay}</span>
            </span>
            <span className="text-[var(--color-ink-muted)]">
              Capacity:{" "}
              <span className="font-mono font-semibold text-[var(--color-ink)]">{capacity}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: [Review] [Reject] [Approve] */}
      <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[var(--color-border-subtle)]">
        <Link href={`/events/${primaryEvent.id}`}>
          <Button variant="outline" size="sm">
            <Eye className="w-3.5 h-3.5 mr-1" />
            Review
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsRejectModalOpen(true)}
          disabled={isProcessing}
        >
          <XCircle className="w-3.5 h-3.5 mr-1 text-[var(--color-crimson)]" />
          {isSeries ? "Reject all" : "Reject"}
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsApproveModalOpen(true)}
          disabled={isProcessing}
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          {isSeries ? "Approve all" : "Approve"}
        </Button>
      </div>

      {/* Publish / Approve Confirmation Modal */}
      <PublishConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        eventTitle={primaryEvent.title}
        organizerName={primaryEvent.organizerName}
        eventDateFormatted={dateDisplay}
        isLoading={isProcessing}
        seriesCount={isSeries ? seriesCount : undefined}
      />

      {/* Reject Reason Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onReject={handleConfirmReject}
        eventTitle={
          isSeries
            ? `${primaryEvent.title} (Series of ${seriesCount})`
            : primaryEvent.title
        }
        isLoading={isProcessing}
      />
    </div>
  );
}
export default PendingCard;
