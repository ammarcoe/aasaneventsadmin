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
import { EventImageView } from "@/components/event-form/EventImageView";
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
  Repeat,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "published" | "draft" | "rejected" | "past" | "series";

export function EventList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [duplicateTarget, setDuplicateTarget] = useState<Event | null>(null);
  const [confirmFeatureTarget, setConfirmFeatureTarget] = useState<Event | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const filter: EventFilter = {
    status:
      activeTab === "past"
        ? "past"
        : activeTab === "all" || activeTab === "series"
        ? undefined
        : (activeTab as EventStatus),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: qk.events.list(filter),
    queryFn: () => fetchEvents({ filter, pageSize: 100 }),
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

  // Client-side search and series filtering
  const filteredEvents = events.filter((e) => {
    if (activeTab === "series" && !e.seriesId) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      e.title.toLowerCase().includes(term) ||
      e.venueName.toLowerCase().includes(term) ||
      e.organizerName.toLowerCase().includes(term) ||
      (e.seriesId && e.seriesId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="flex flex-col gap-6 font-sans">
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
            label="Series"
            isSelected={activeTab === "series"}
            onClick={() => setActiveTab("series")}
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
                ? "text-[var(--color-crimson)] border-[var(--color-crimson)]/30 bg-red-50 dark:bg-red-950/30 font-semibold"
                : "text-[var(--color-ink-muted)] border-[var(--color-border-subtle)] bg-[var(--color-surface)]"
            }`}
            title={
              featuredCount > 5
                ? "More than 5 events featured — may dilute user attention"
                : "Currently featured events"
            }
          >
            <Star
              className={`w-3.5 h-3.5 ${
                featuredCount > 0
                  ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                  : "text-[var(--color-ink-faint)]"
              }`}
            />
            <span>{featuredCount} Featured</span>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--color-ink-faint)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events or series ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] rounded-md pl-9 pr-3.5 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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
        <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-lg text-sm text-[var(--color-crimson)]">
          Failed to load events.
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description="There are no events matching your active filter or search query."
          action={
            <Button size="sm" onClick={() => router.push("/events/new")}>
              <Plus className="w-4 h-4 mr-1" />
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
              const coverImg = event.images?.[0] || null;
              const fallbackCover = event.imageUrls?.[0] || null;
              const totalSold =
                event.soldCount ??
                event.ticketTypes.reduce((acc, t) => acc + (t.soldCount || 0), 0);
              const totalCapacity =
                event.capacity ??
                event.ticketTypes.reduce((acc, t) => acc + (t.capacity || 0), 0);

              const isUpcoming = new Date(event.startTime) > new Date();
              const canFeature = event.status === "published" && isUpcoming;
              const disableStar = !event.isFeatured && !canFeature;

              return (
                <TableRow key={event.id}>
                  {/* Inline Star Toggle */}
                  <TableCell className="text-center">
                    <button
                      type="button"
                      disabled={disableStar}
                      onClick={() => handleToggleFeatured(event)}
                      className={`p-1 rounded-sm transition-colors ${
                        disableStar
                          ? "opacity-30 cursor-not-allowed text-[var(--color-ink-faint)]"
                          : "text-[var(--color-ink-faint)] hover:text-[var(--color-accent)] cursor-pointer"
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
                            ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                            : "text-[var(--color-border-strong)]"
                        }`}
                      />
                    </button>
                  </TableCell>

                  {/* Thumb + Title + Series Badge */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-md overflow-hidden bg-[var(--color-surface-subtle)] border border-[var(--color-border-subtle)] shrink-0 flex items-center justify-center">
                        <EventImageView
                          image={coverImg}
                          fallbackUrl={fallbackCover}
                          blur={false}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 max-w-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <Link
                            href={`/events/${event.id}`}
                            className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors truncate text-xs"
                            title={event.title}
                          >
                            {event.title}
                          </Link>

                          {/* Series Badge */}
                          {event.seriesId && (
                            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 uppercase tracking-wider">
                              {event.seriesIndex && event.seriesCount
                                ? `SERIES ${event.seriesIndex}/${event.seriesCount}`
                                : "SERIES"}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-[var(--color-ink-muted)] truncate">
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

                  {/* Starts in PKT */}
                  <TableCell>
                    <span className="text-xs font-mono text-[var(--color-ink)]">
                      {pktLabel(event.startTime)}
                    </span>
                  </TableCell>

                  {/* Organizer */}
                  <TableCell>
                    <span className="text-xs text-[var(--color-ink-muted)] font-medium">
                      {event.organizerName}
                    </span>
                  </TableCell>

                  {/* Registrations / Capacity */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="font-semibold text-[var(--color-ink)]">{totalSold}</span>
                      <span className="text-[var(--color-ink-faint)]">/ {totalCapacity}</span>
                    </div>
                  </TableCell>

                  {/* Action Menu */}
                  <TableCell className="text-right">
                    <div className="relative inline-flex items-center justify-end gap-1">
                      {event.seriesId && (
                        <button
                          type="button"
                          onClick={() => setSearchTerm(event.seriesId || "")}
                          className="p-1.5 text-[var(--color-ink-faint)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-subtle)] rounded-md transition-colors"
                          title="View all events in this series"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <Link href={`/events/${event.id}`}>
                        <button
                          type="button"
                          className="p-1.5 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] rounded-md transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setDuplicateTarget(event)}
                        className="p-1.5 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] rounded-md transition-colors"
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
                        className="p-1.5 text-[var(--color-ink-faint)] hover:text-[var(--color-crimson)] hover:bg-red-50 rounded-md transition-colors"
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
          onDuplicate={handleDuplicate}
          event={duplicateTarget}
          isLoading={isDuplicating}
        />
      )}
    </div>
  );
}
export default EventList;
