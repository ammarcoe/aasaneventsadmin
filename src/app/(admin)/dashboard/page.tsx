"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchDashboardMetrics, fetchNeedsAttentionItems } from "@/features/dashboard/api";
import { MetricCards } from "@/features/dashboard/MetricCards";
import { NeedsAttention } from "@/features/dashboard/NeedsAttention";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Plus, Users2, Clock, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: qk.dashboard,
    queryFn: fetchDashboardMetrics,
    refetchInterval: 60_000,
  });

  const {
    data: attentionItems = [],
    isLoading: isAttentionLoading,
  } = useQuery({
    queryKey: ["dashboard", "needs-attention"],
    queryFn: fetchNeedsAttentionItems,
    refetchInterval: 60_000,
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Operations Dashboard
          </h1>
          <p className="text-xs text-ink-muted">
            Overview of event publications, organizer accounts, and submission approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/events/new">
            <Button size="sm">
              <Plus className="w-3.5 h-3.5" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      {isMetricsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      ) : metrics ? (
        <MetricCards metrics={metrics} />
      ) : (
        <div className="p-6 bg-surface border border-border rounded-lg text-xs text-ink-muted">
          Connect to Firebase or local emulators to populate metrics.
        </div>
      )}

      {/* Needs Attention Section */}
      {isAttentionLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
      ) : (
        <NeedsAttention items={attentionItems} />
      )}

      {/* Quick Ops Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <Link
          href="/pending"
          className="p-4 bg-surface rounded-lg border border-border hover:border-border-strong transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-md bg-sand/30 text-ink">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Review Queue</span>
            <span className="text-xs text-ink-muted">Inspect organizer event submissions</span>
          </div>
        </Link>

        <Link
          href="/events/new"
          className="p-4 bg-surface rounded-lg border border-border hover:border-border-strong transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-md bg-accent/20 text-accent-deep">
            <Plus className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Publish New Event</span>
            <span className="text-xs text-ink-muted">Fill in venue, dates, and live tickets</span>
          </div>
        </Link>

        <Link
          href="/organizers/new"
          className="p-4 bg-surface rounded-lg border border-border hover:border-border-strong transition-all flex items-center gap-3"
        >
          <div className="p-2.5 rounded-md bg-control text-ink">
            <Users2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-ink">Add Organizer</span>
            <span className="text-xs text-ink-muted">Create host profile &amp; link app user</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
