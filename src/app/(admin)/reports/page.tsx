import React from "react";
import { ReportsModeration } from "@/features/reports/ReportsModeration";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reports &amp; Moderation</h1>
        <p className="text-xs text-ink-muted">
          Review community reports, inspect reported events, and take administrative actions.
        </p>
      </div>
      <ReportsModeration />
    </div>
  );
}
