"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { PKT } from "@/lib/pkt";
import { Clock, Plus, Calendar, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function TopBar() {
  const pathname = usePathname();
  const [currentTimePkt, setCurrentTimePkt] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setCurrentTimePkt(formatInTimeZone(new Date(), PKT, "EEE d MMM, h:mm:ss a 'PKT'"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/pending") return "Pending Approvals";
    if (pathname === "/events/new") return "Create New Event";
    if (pathname.startsWith("/events/")) return "Edit Event";
    if (pathname === "/events") return "Events Directory";
    if (pathname === "/organizers/new") return "Create New Organizer";
    if (pathname.startsWith("/organizers/")) return "Edit Organizer";
    if (pathname === "/organizers") return "Organizers Directory";
    return "Operations Panel";
  };

  return (
    <header className="h-16 border-b border-border bg-surface px-8 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-bold text-ink tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* PKT Time indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-subtle border border-border text-xs text-ink-muted">
          <Clock className="w-3.5 h-3.5 text-accent-deep" />
          <span className="font-mono">{currentTimePkt || "Loading PKT..."}</span>
        </div>

        {/* Quick action buttons based on current screen */}
        <div className="flex items-center gap-2">
          {pathname.startsWith("/events") && pathname !== "/events/new" && (
            <Link href="/events/new">
              <Button size="sm" variant="primary">
                <Plus className="w-3.5 h-3.5" />
                New Event
              </Button>
            </Link>
          )}

          {pathname.startsWith("/organizers") && pathname !== "/organizers/new" && (
            <Link href="/organizers/new">
              <Button size="sm" variant="primary">
                <UserPlus className="w-3.5 h-3.5" />
                New Organizer
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
