"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { qk } from "@/lib/queryKeys";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { displayValue, fetchPayoutSettings, methodLabel } from "./api";

/** Read-only payment status for an organizer. Changes happen in Payout reviews. */
export function PayoutStatusCard({ organizerId, hasOwner }: { organizerId: string; hasOwner: boolean }) {
  const { data: s, isLoading } = useQuery({
    queryKey: qk.payouts.detail(organizerId),
    queryFn: () => fetchPayoutSettings(organizerId),
  });

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent-deep" />
            In-app payments
          </CardTitle>
          {s &&
            (s.pending ? (
              <Badge variant="pending">Waiting for review</Badge>
            ) : s.active?.methods.length ? (
              <Badge variant="published">Accepting payments</Badge>
            ) : s.rejectionReason ? (
              <Badge variant="rejected">Changes rejected</Badge>
            ) : (
              <Badge variant="draft">Not set up</Badge>
            ))}
        </div>
        <CardDescription>
          Attendees pay this organizer directly. The organizer adds accounts in the app; you approve them.
        </CardDescription>
      </CardHeader>

      {isLoading || !s ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="flex flex-col gap-3 text-sm">
          {s.active?.methods.map((m) => (
            <div key={`${m.type}-${m.value}`} className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-semibold text-ink w-28">{methodLabel(m)}</span>
              <span className="font-mono text-ink">{displayValue(m)}</span>
              <span className="text-xs text-ink-muted">{m.accountTitle}</span>
            </div>
          ))}
          {s.pending && (
            <Link href="/payouts" className="text-xs font-semibold text-accent-deep hover:underline">
              Review the submitted accounts →
            </Link>
          )}
          {!s.pending && s.rejectionReason && (
            <p className="text-xs text-ink-muted">Last rejection: {s.rejectionReason}</p>
          )}
          {!hasOwner && (
            <p className="text-xs text-ink-muted">
              Link this organizer to a user account first: only the linked person can add payment accounts in the
              app.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
