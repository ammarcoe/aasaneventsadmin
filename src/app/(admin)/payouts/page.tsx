"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { qk } from "@/lib/queryKeys";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { PayoutReviewCard } from "@/features/payments/PayoutReviewCard";
import { callableMessage, fetchPayoutQueue, reviewPayoutAccounts } from "@/features/payments/api";

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const { data: queue = [], isLoading, error } = useQuery({
    queryKey: qk.payouts.queue,
    queryFn: fetchPayoutQueue,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["payouts"] });
    queryClient.invalidateQueries({ queryKey: qk.organizers.all });
  };

  const decide = async (organizerId: string, approve: boolean, reason?: string) => {
    try {
      await reviewPayoutAccounts(organizerId, approve, reason);
      toast.success(
        approve
          ? "Approved. The organizer can now sell paid tickets in the app."
          : "Rejected. The organizer has been told why."
      );
    } catch (err) {
      toast.error(callableMessage(err, "Couldn't save the review."));
    } finally {
      refresh(); // also clears items someone else already reviewed
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-ink)]">Payout reviews</h1>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Organizers&apos; Raast, wallet and bank accounts waiting for approval. Attendees can only pay into approved
          accounts. Oldest first.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg text-sm text-[var(--color-crimson)]">
          Failed to load payout reviews.
        </div>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="No payment accounts are waiting for review."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {queue.map((item) => (
            <PayoutReviewCard
              key={item.organizerId}
              item={item}
              onApprove={(id) => decide(id, true)}
              onReject={(id, reason) => decide(id, false, reason)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
