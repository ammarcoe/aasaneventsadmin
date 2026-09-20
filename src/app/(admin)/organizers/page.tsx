import React from "react";
import { OrganizerList } from "@/features/organizers/OrganizerList";

export default function OrganizersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Organizers</h1>
        <p className="text-xs text-ink-muted">
          Manage event hosting entities, app account linking, and active permissions.
        </p>
      </div>
      <OrganizerList />
    </div>
  );
}
