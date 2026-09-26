"use client";

import React, { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  fetchPendingEvents,
  publishEvent,
  publishSeries,
  rejectEvent,
  rejectSeries,
} from "@/features/events/api";
import { PendingCard, PendingGroup } from "@/features/pending/PendingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Event } from "@/types";

export default function PendingPage() {
  const queryClient = useQueryClient();
  const { authState } = useAuth();
  const adminUid = authState.status === "authenticated" ? authState.uid : "admin";

  const {
    data: pendingEvents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: qk.events.pending,
    queryFn: fetchPendingEvents,
  });

  // Group pending events by seriesId
  const pendingGroups: PendingGroup[] = useMemo(() => {
    const map = new Map<string, Event[]>();
    const singles: Event[] = [];

    pendingEvents.forEach((ev) => {
      if (ev.seriesId) {
        const list = map.get(ev.seriesId) || [];
        list.push(ev);
        map.set(ev.seriesId, list);
      } else {
        singles.push(ev);
      }
    });

    const groups: PendingGroup[] = [];

    // Series groups
    map.forEach((events, seriesId) => {
      events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      groups.push({
        isSeries: true,
        seriesId,
        events,
      });
    });

    // Singles
    singles.forEach((ev) => {
      groups.push({
        isSeries: false,
        events: [ev],
      });
    });

    // Sort groups by the creation date of their first event
    return groups.sort((a, b) => {
      const aTime = a.events[0]?.createdAt?.getTime() || 0;
      const bTime = b.events[0]?.createdAt?.getTime() || 0;
      return aTime - bTime;
    });
  }, [pendingEvents]);

  const handleApprove = async (eventId: string, organizerId?: string | null) => {
    try {
      await publishEvent(eventId, adminUid, organizerId);
      queryClient.invalidateQueries({ queryKey: qk.events.pending });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Event approved and published live to the mobile app!");
    } catch (err: any) {
      console.error("Approval failed:", err);
      toast.error(err.message || "Failed to approve event.");
    }
  };

  const handleApproveSeries = async (seriesId: string, organizerId?: string | null) => {
    try {
      await publishSeries(seriesId, adminUid, organizerId);
      queryClient.invalidateQueries({ queryKey: qk.events.pending });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Series approved! All occurrences are now live in the mobile app.");
    } catch (err: any) {
      console.error("Series approval failed:", err);
      toast.error(err.message || "Failed to approve series.");
    }
  };

  const handleReject = async (eventId: string, reason: string) => {
    try {
      await rejectEvent(eventId, adminUid, reason);
      queryClient.invalidateQueries({ queryKey: qk.events.pending });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Event rejected. Reason recorded for organizer.");
    } catch (err: any) {
      console.error("Rejection failed:", err);
      toast.error(err.message || "Failed to reject event.");
    }
  };

  const handleRejectSeries = async (seriesId: string, reason: string) => {
    try {
      await rejectSeries(seriesId, adminUid, reason);
      queryClient.invalidateQueries({ queryKey: qk.events.pending });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Series rejected. Reason recorded for organizer.");
    } catch (err: any) {
      console.error("Series rejection failed:", err);
      toast.error(err.message || "Failed to reject series.");
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">
          Pending Approvals
        </h1>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Review submissions by mobile app organizers. Ordered oldest first.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg text-sm text-[var(--color-crimson)]">
          Failed to load pending events.
        </div>
      ) : pendingGroups.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="There are no event submissions awaiting review right now."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pendingGroups.map((group, idx) => (
            <PendingCard
              key={group.seriesId || group.events[0].id || idx}
              group={group}
              onApprove={handleApprove}
              onReject={handleReject}
              onApproveSeries={handleApproveSeries}
              onRejectSeries={handleRejectSeries}
            />
          ))}
        </div>
      )}
    </div>
  );
}
