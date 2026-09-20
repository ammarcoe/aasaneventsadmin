"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReports, dismissReport, actionReport, ReportItem } from "./api";
import { fetchEvent, cancelEvent } from "@/features/events/api";
import { toggleOrganizerSuspend } from "@/features/organizers/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventCardPreview } from "@/components/preview/EventCardPreview";
import { pktLabel } from "@/lib/pkt";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Ban,
  EyeOff,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

export function ReportsModeration() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports", activeTab],
    queryFn: () => fetchReports(activeTab),
  });

  // Query target event details if selected
  const { data: targetEvent } = useQuery({
    queryKey: ["events", "detail", selectedReport?.targetId],
    queryFn: () => fetchEvent(selectedReport!.targetId),
    enabled: Boolean(selectedReport && selectedReport.targetType === "event"),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setSelectedReport(null);
      toast.success("Report dismissed");
    },
    onError: () => toast.error("Failed to dismiss report"),
  });

  const cancelEventMutation = useMutation({
    mutationFn: async (report: ReportItem) => {
      await cancelEvent(report.targetId, `Cancelled due to user report: ${report.reason}`);
      await actionReport(report.id, "Event cancelled by admin");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setSelectedReport(null);
      toast.success("Event cancelled and report actioned");
    },
    onError: () => toast.error("Failed to cancel event"),
  });

  const suspendOrgMutation = useMutation({
    mutationFn: async (report: ReportItem) => {
      if (!report.organizerId) throw new Error("No organizer associated with this report");
      await toggleOrganizerSuspend(report.organizerId, "active");
      await actionReport(report.id, "Organizer suspended by admin");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
      setSelectedReport(null);
      toast.success("Organizer suspended and report actioned");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to suspend organizer"),
  });

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Top Filter Chips */}
      <div className="flex items-center gap-2">
        <FilterChip
          label="Pending Review"
          isSelected={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
        />
        <FilterChip
          label="Actioned"
          isSelected={activeTab === "actioned"}
          onClick={() => setActiveTab("actioned")}
        />
        <FilterChip
          label="Dismissed"
          isSelected={activeTab === "dismissed"}
          onClick={() => setActiveTab("dismissed")}
        />
        <FilterChip
          label="All Reports"
          isSelected={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports to review"
          description="The moderation queue is completely clear. Community reports will appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reason</TableHead>
              <TableHead>Reported Event / Organizer</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reported At (PKT)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className="cursor-pointer hover:bg-surface-subtle transition-colors"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-crimson shrink-0" />
                    <span className="font-bold text-ink text-sm">{r.reason}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{r.targetTitle}</span>
                    <span className="text-xs text-ink-muted">{r.organizerName}</span>
                  </div>
                </TableCell>

                <TableCell className="text-xs text-ink-muted font-medium">
                  {r.reporterEmail}
                </TableCell>

                <TableCell className="text-xs text-ink-muted font-mono">
                  {pktLabel(r.createdAt)}
                </TableCell>

                <TableCell>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                      r.status === "pending"
                        ? "bg-crimson-surface text-crimson border border-crimson/30"
                        : r.status === "actioned"
                        ? "bg-accent/20 text-accent-deep border border-accent/40"
                        : "bg-surface-subtle text-ink-muted border border-border"
                    }`}
                  >
                    {r.status}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReport(r);
                    }}
                  >
                    Inspect
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 480px Moderation Drawer */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="w-full max-w-[480px] bg-surface h-full shadow-2xl flex flex-col justify-between border-l border-border overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex flex-col p-6 gap-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-crimson" />
                  <h3 className="font-bold text-lg text-ink">Moderate Report</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-md text-ink-faint hover:text-ink hover:bg-surface-subtle"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Report Information Box */}
              <div className="p-4 bg-crimson-surface border border-crimson/20 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-crimson uppercase tracking-wider">
                  <span>Reported for: {selectedReport.reason}</span>
                  <span>{selectedReport.status}</span>
                </div>
                {selectedReport.details && (
                  <p className="text-xs text-ink mt-1 italic bg-surface/80 p-2.5 rounded-lg border border-border">
                    &ldquo;{selectedReport.details}&rdquo;
                  </p>
                )}
                <div className="text-[11px] text-ink-muted flex items-center justify-between pt-1">
                  <span>Reporter: {selectedReport.reporterEmail}</span>
                  <span className="font-mono">{pktLabel(selectedReport.createdAt)}</span>
                </div>
              </div>

              {/* Live Card Preview */}
              {targetEvent && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      Reported Event Card Preview
                    </span>
                    <Link
                      href={`/events/${targetEvent.id}`}
                      target="_blank"
                      className="text-xs text-accent-deep hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Open Event Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="p-3 bg-surface-subtle rounded-2xl border border-border flex justify-center">
                    <EventCardPreview data={targetEvent} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Toolbar */}
            <div className="p-5 border-t border-border bg-surface-subtle flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => dismissMutation.mutate(selectedReport.id)}
                  disabled={dismissMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Dismiss Report
                </Button>

                {selectedReport.targetType === "event" && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => cancelEventMutation.mutate(selectedReport)}
                    disabled={cancelEventMutation.isPending}
                  >
                    <Ban className="w-4 h-4" />
                    Cancel Event
                  </Button>
                )}
              </div>

              {selectedReport.organizerId && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => suspendOrgMutation.mutate(selectedReport)}
                  disabled={suspendOrgMutation.isPending}
                >
                  <UserX className="w-4 h-4" />
                  Suspend Organizer ({selectedReport.organizerName})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
