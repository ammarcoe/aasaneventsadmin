"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchOrganizer } from "@/features/organizers/api";
import { OrganizerForm } from "@/features/organizers/OrganizerForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users2 } from "lucide-react";

export function EditOrganizerClient() {
  const params = useParams();
  const id = params?.id as string;

  const { data: organizer, isLoading, error } = useQuery({
    queryKey: qk.organizers.detail(id),
    queryFn: () => fetchOrganizer(id),
    enabled: Boolean(id && id !== "_"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <EmptyState
        icon={Users2}
        title="Organizer not found"
        description="The organizer you are looking for does not exist or has been deleted."
      />
    );
  }

  return <OrganizerForm initialData={organizer} />;
}
