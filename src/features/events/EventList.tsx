"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  fetchEvents,
  toggleFeaturedEvent,
  duplicateEvent,
  deleteEvent,
  FetchEventsResult,
} from "./api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FilterChip } from "@/components/ui/FilterChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { DuplicateModal } from "./DuplicateModal";
import { pktLabel } from "@/lib/pkt";
import type { Event, EventStatus, EventFilter } from "@/types";
import {
  Search,
  Plus,
  Star,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "published" | "draft" | "rejected" | "past";

export function EventList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [duplicateTarget, setDuplicateTarget] = useState<Event | null>(null);
  const [confirmFeatureTarget, setConfirmFeatureTarget] = useState<Event | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filter: EventFilter = {
    status: activeTab === "past" ? "past" : activeTab === "all" ? undefined : (activeTab as EventStatus),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: qk.events.list(filter),
    queryFn: () => fetchEvents({ filter, pageSize: 50 }),
  });

  const events = data?.events || [];

  // Toggle Featured inline with optimistic update and rollback
  const featureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      toggleFeaturedEvent(id, isFeatured),
    onMutate: async ({ id, isFeatured }) => {
      await queryClient.cancelQueries({ queryKey: qk.events.all });
      const queryKey = qk.events.list(filter);
      const previousData = queryClient.getQueryData<FetchEventsResult>(queryKey);
      if (previousData) {
        queryClient.setQueryData<FetchEventsResult>(queryKey, {
          ...previousData,
          events: previousData.events.map((e) =>
            e.id === id ? { ...e, isFeatured: !isFeatured } : e
          ),
        });
      }
      return { previousData, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error("Failed to toggle featured status. Rolled back.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.events.all });
    },
  });

  const featuredCount = events.filter((e) => e.isFeatured).length;

  const handleToggleFeatured = (event: Event) => {
    if (event.isFeatured) {
      featureMutation.mutate({ id: event.id, isFeatured: true });
      return;
    }

    const isUpcoming = new Date(event.startTime) > new Date();
    if (event.status !== "published" || !isUpcoming) {
      toast.error("Only published upcoming events can be featured.");
      return;
    }

    if (featuredCount >= 5) {
      setConfirmFeatureTarget(event);
      return;
    }

    featureMutation.mutate({ id: event.id, isFeatured: false });
  };

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, organizerId }: { id: string; organizerId?: string | null }) =>
      deleteEvent(id, organizerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      toast.success("Event deleted");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to delete event";
      toast.error(msg);
    },
  });

  // Duplicate handler
  const handleDuplicate = async (newTitle: string, shiftDays: number, cloneImages: boolean) => {
    if (!duplicateTarget) return;
    try {
      setIsDuplicating(true);
      const newId = await duplicateEvent(duplicateTarget, {
        newTitle,
        shiftDays,
        cloneImages,
      });
      toast.success("Event duplicated as draft!");
      setDuplicateTarget(null);
      queryClient.invalidateQueries({ queryKey: qk.events.all });
      router.push(`/events/${newId}`);
    } catch (err) {
      console.error("Duplication failed:", err);
      toast.error("Failed to duplicate event.");
    } finally {
      setIsDuplicating(false);
    }
  };

  // Client-side search filtering over loaded page
  const filteredEvents = events.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(term) ||
      e.venueName.toLowerCase().includes(term) ||
      e.organizerName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top filters bar & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All"
            isSelected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <FilterChip
            label="Pending"
            isSelected={activeTab === "pending"}
            onClick={() => setActiveTab("pending")}
          />
          <FilterChip
            label="Published"
            isSelected={activeTab === "published"}
            onClick={() => setActiveTab("published")}
          />
          <FilterChip
            label="Draft"
            isSelected={activeTab === "draft"}
            onClick={() => setActiveTab("draft")}
          />
          <FilterChip
            label="Rejected"
            isSelected={activeTab === "rejected"}
            onClick={() => setActiveTab("rejected")}
          />
          <FilterChip
            label="Past"
            isSelected={activeTab === "past"}
            onClick={() => setActiveTab("past")}
          />

          <div
            className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 font-medium transition-colors ml-2 ${
              featuredCount > 5
                ? "text-crimson border-crimson/30 bg-crimson-surface font-semibold"
                : "text-ink-muted border-border bg-surface"
            }`}
            title={
              featuredCount > 5
                ? "More than 5 events featured — may dilute user attention"
                : "Currently featured events"
            }
          >
            <Star
              className={`w-3.5 h-3.5 ${
                featuredCount > 0 ? "fill-accent text-accent" : "text-ink-faint"
              }`}
            />
            <span>{featuredCount} Featured</span>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search loaded events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-9 pr-3.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <div className="p-6 bg-crimson-surface border border-crimson/30 rounded-lg text-sm text-crimson">
          Failed to load events. Check permissions.
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="There are no events matching your active tab or search criteria."
          action={
            <Button size="sm" onClick={() => router.push("/events/new")}>
              Create Event
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">Pin</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Starts (PKT)</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => {
              const banner = event.imageUrls?.[0];
              const totalSold = event.soldCount ?? event.ticketTypes.reduce((acc, t) => acc + (t.soldCount || 0), 0);
              const totalCapacity = event.capacity ?? event.ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0);

              const isUpcoming = new Date(event.startTime) > new Date();
              const canFeature = event.status === "published" && isUpcoming;
              const disableStar = !event.isFeatured && !canFeature;

              return (
                <TableRow key={event.id}>
                  {/* Inline Star toggle */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      disabled={disableStar}
                      onClick={() => handleToggleFeatured(event)}
                      className={`p-1 rounded-sm transition-colors ${
                        disableStar
                          ? "opacity-30 cursor-not-allowed text-ink-disabled"
                          : "text-ink-faint hover:text-accent-deep cursor-pointer"
                      }`}
                      title={
                        disableStar
                          ? "Only published upcoming events can be featured"
                          : event.isFeatured
                          ? "Unpin featured"
                          : "Pin as featured"
                      }
                    >
                      <Star
                        className={`w-4 h-4 ${
                          event.isFeatured
                            ? "fill-accent text-accent"
                            : "text-ink-disabled"
                        }`}
                      />
                    </button>
                  </TableCell>

                  {/* Thumb + Title */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-surface-subtle border border-border shrink-0 flex items-center justify-center">
                        {banner ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={banner}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Calendar className="w-4 h-4 text-ink-faint" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 max-w-xs">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-semibold text-ink hover:text-accent-deep transition-colors truncate"
                          title={event.title}
                        >
                          {event.title}
                        </Link>
                        <span className="text-xs text-ink-muted truncate">
                          {event.venueName}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge variant={event.status as import("@/components/ui/Badge").BadgeVariant}>
                      {event.status}
                    </Badge>
                  </TableCell>

                  {/* Starts in PKT strictly */}
                  <TableCell>
                    <span className="text-xs font-mono text-ink">
                      {pktLabel(event.startTime)}
                    </span>
                  </TableCell>

                  {/* Organizer */}
                  <TableCell>
                    <span className="text-xs text-ink-muted font-medium">
                      {event.organizerName}
                    </span>
                  </TableCell>

                  {/* Registrations / Capacity */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="font-semibold text-ink">{totalSold}</span>
                      <span className="text-ink-faint">/ {totalCapacity}</span>
                    </div>
                  </TableCell>

                  {/* Action Menu */}
                  <TableCell className="text-right">
                    <div className="relative inline-flex items-center justify-end gap-1">
                      <Link href={`/events/${event.id}`}>
                        <button
                          type="button"
                          className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface-subtle rounded-md transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDuplicateTarget(event)}
                        className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface-subtle rounded-md transition-colors"
                        title="Duplicate (+1 Week shift)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteMutation.mutate({
                            id: event.id,
                            organizerId: event.organizerId,
                          })
                        }
                        className="p-1.5 text-ink-faint hover:text-crimson hover:bg-crimson-surface rounded-md transition-colors"
                        title="Delete (drafts only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Duplicate Modal */}
      {duplicateTarget && (
        <DuplicateModal
          isOpen={Boolean(duplicateTarget)}
          onClose={() => setDuplicateTarget(null)}
          event={duplicateTarget}
          onDuplicate={handleDuplicate}
          isLoading={isDuplicating}
        />
      )}

      {/* High Featured Count Confirmation Modal */}
      {confirmFeatureTarget && (
        <Modal
          isOpen={Boolean(confirmFeatureTarget)}
          onClose={() => setConfirmFeatureTarget(null)}
          title="High Featured Count Warning"
          description={`There are already ${featuredCount} events featured. Featuring more than 5 events can dilute user attention on the app feed.`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setConfirmFeatureTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const target = confirmFeatureTarget;
                  setConfirmFeatureTarget(null);
                  featureMutation.mutate({ id: target.id, isFeatured: false });
                }}
              >
                Feature Anyway
              </Button>
            </>
          }
        >
          <div className="py-2 text-sm text-ink">
            Are you sure you want to feature <strong className="font-semibold text-ink">{confirmFeatureTarget.title}</strong>?
          </div>
        </Modal>
      )}
    </div>
  );
}
