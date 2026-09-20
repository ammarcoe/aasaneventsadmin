import React from "react";
import { EventList } from "@/features/events/EventList";

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Events</h1>
        <p className="text-xs text-ink-muted">
          Directory of all published, draft, pending, and past events in Islamabad &amp; Pakistan.
        </p>
      </div>
      <EventList />
    </div>
  );
}
