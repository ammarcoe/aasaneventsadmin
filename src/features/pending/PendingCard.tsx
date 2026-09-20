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
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export interface PendingCardProps {
  event: Event;
  onApprove: (eventId: string, organizerId?: string | null) => Promise<void>;
  onReject: (eventId: string, reason: string) => Promise<void>;
}

export function PendingCard({ event, onApprove, onReject }: PendingCardProps) {
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const banner = event.imageUrls?.[0];
  const capacity =
    event.capacity ?? event.ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0);
  const priceDisplay =
    event.priceMinPkr === 0 || (!event.priceMinPkr && !event.priceMaxPkr)
      ? "Free"
      : formatPKR(event.priceMinPkr);

  const handleConfirmApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(event.id, event.organizerId);
      setIsApproveModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    setIsProcessing(true);
    try {
      await onReject(event.id, reason);
      setIsRejectModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-all hover:border-border-strong">
      <div className="flex items-start gap-4 min-w-0">
        {/* 120x90 image thumb */}
        <div className="w-[120px] h-[90px] rounded-md overflow-hidden bg-surface-subtle border border-border shrink-0 flex items-center justify-center">
          {banner ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Calendar className="w-6 h-6 text-ink-faint" />
          )}
        </div>

        {/* Details column */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="pending" size="sm">
              Submitted {formatRelativeTime(event.createdAt)}
            </Badge>
            <span className="text-[11px] text-accent-deep font-semibold uppercase tracking-wider">
              {event.categoryId}
            </span>
          </div>

          <h3 className="text-base font-bold text-ink truncate max-w-lg" title={event.title}>
            {event.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
            <span className="flex items-center gap-1 font-medium text-ink">
              <Users className="w-3.5 h-3.5 text-accent-deep" />
              {event.organizerName}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-ink-faint" />
              {pktLabel(event.startTime)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-ink-faint" />
              {event.venueName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs mt-1">
            <span className="font-semibold text-ink">
              Price: <span className="font-mono text-accent-deep">{priceDisplay}</span>
            </span>
            <span className="text-ink-muted">
              Capacity: <span className="font-mono font-semibold text-ink">{capacity}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: [Review] [Reject] [Approve] */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-border">
        <Link href={`/events/${event.id}`}>
          <Button variant="secondary" size="sm">
            <Eye className="w-3.5 h-3.5" />
            Review
          </Button>
        </Link>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsRejectModalOpen(true)}
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsApproveModalOpen(true)}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve
        </Button>
      </div>

      {/* Inline Approve Confirmation Modal */}
      <PublishConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        eventTitle={event.title}
        organizerName={event.organizerName}
        isLoading={isProcessing}
      />

      {/* Inline Reject Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        eventTitle={event.title}
        onReject={handleConfirmReject}
        isLoading={isProcessing}
      />
    </div>
  );
}
