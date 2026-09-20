"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchEvent } from "@/features/events/api";
import { EventForm } from "@/features/events/EventForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar } from "lucide-react";

export function EditEventClient() {
  const params = useParams();
  const id = params?.id as string;

  const { data: event, isLoading, error } = useQuery({
    queryKey: qk.events.detail(id),
    queryFn: () => fetchEvent(id),
    enabled: Boolean(id && id !== "_"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-8">
          <Skeleton className="h-[600px] w-[640px] rounded-lg" />
          <Skeleton className="h-[600px] w-[390px] rounded-lg hidden xl:block" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <EmptyState
        icon={Calendar}
        title="Event not found"
        description="The event you are trying to edit does not exist or has been removed."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Edit Event</h1>
        <p className="text-xs text-ink-muted">
          Update event information, schedule, tickets, and preview live mobile rendering.
        </p>
      </div>
      <EventForm initialData={event} />
    </div>
  );
}
