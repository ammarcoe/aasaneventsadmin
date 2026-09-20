"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchPendingEvents, publishEvent, rejectEvent } from "@/features/events/api";
import { PendingCard } from "@/features/pending/PendingCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/AuthContext";
import { Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PendingPage() {
  const queryClient = useQueryClient();
  const { authState } = useAuth();

  const { data: pendingEvents = [], isLoading, error } = useQuery({
    queryKey: qk.events.pending,
    queryFn: fetchPendingEvents,
  });

  const handleApprove = async (eventId: string, organizerId?: string | null) => {
    try {
      const adminUid = authState.status === "authenticated" ? authState.uid : "admin";
      await publishEvent(eventId, adminUid, organizerId);
      queryClient.invalidateQueries({ queryKey: qk.events.pending });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Event approved and published live to the mobile app!");
    } catch (err) {
      console.error("Approval failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to approve event.");
    }
  };

  const handleReject = async (eventId: string, reason: string) => {
    try {
      const adminUid = authState.status === "authenticated" ? authState.uid : "admin";
      await rejectEvent(eventId, adminUid, reason);
      queryClient.invalidateQueries({ queryKey: qk.events.pending });
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      queryClient.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Event rejected. Reason recorded for organizer.");
    } catch (err) {
      console.error("Rejection failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to reject event.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Pending Approvals
        </h1>
        <p className="text-xs text-ink-muted">
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
        <div className="p-6 bg-crimson-surface border border-crimson/30 rounded-lg text-sm text-crimson">
          Failed to load pending events.
        </div>
      ) : pendingEvents.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="There are no event submissions awaiting review right now."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {pendingEvents.map((event) => (
            <PendingCard
              key={event.id}
              event={event}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
