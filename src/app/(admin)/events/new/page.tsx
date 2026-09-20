import React from "react";
import { EventForm } from "@/features/events/EventForm";

export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Create Event</h1>
        <p className="text-xs text-ink-muted">
          Fill in event details, timing, venue, and tickets with instant phone preview.
        </p>
      </div>
      <EventForm />
    </div>
  );
}
