"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEventRegistrations, toggleCheckIn } from "./api";
import { fetchEvent } from "@/features/events/api";
import { pktLabel } from "@/lib/pkt";
import { formatPKR } from "@/lib/utils";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ArrowLeft,
  Search,
  Download,
  Share2,
  Users,
  DollarSign,
  CheckCircle2,
  Ticket,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentCell } from "@/features/payments/PaymentCell";

export interface RegistrationsViewProps {
  eventId: string;
}

export function RegistrationsView({ eventId }: RegistrationsViewProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: event, isLoading: isEventLoading } = useQuery({
    queryKey: ["events", "detail", eventId],
    queryFn: () => fetchEvent(eventId),
    enabled: Boolean(eventId && eventId !== "_"),
  });

  const { data: registrations = [], isLoading: isRegLoading } = useQuery({
    queryKey: ["registrations", "event", eventId],
    queryFn: () => fetchEventRegistrations(eventId),
    enabled: Boolean(eventId && eventId !== "_"),
  });

  const checkInMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: boolean }) =>
      toggleCheckIn(id, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations", "event", eventId] });
      toast.success("Check-in status updated");
    },
    onError: () => toast.error("Failed to update check-in status"),
  });

  // Filtered registrations
  const filtered = registrations.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.userName.toLowerCase().includes(term) ||
      r.userEmail.toLowerCase().includes(term) ||
      (r.userPhone && r.userPhone.toLowerCase().includes(term)) ||
      r.ticketTypeName.toLowerCase().includes(term)
    );
  });

  // Metrics: only confirmed registrations are attending (unpaid / in-review orders aren't).
  const confirmed = registrations.filter((r) => (r.status || "confirmed") === "confirmed");
  const totalAttendees = confirmed.reduce((acc, r) => acc + (r.quantity || 1), 0);
  const totalRevenue = confirmed.reduce((acc, r) => acc + (r.totalPkr || 0), 0);
  const checkedInCount = confirmed.filter((r) => r.checkedIn).reduce((acc, r) => acc + (r.quantity || 1), 0);

  // Copy for WhatsApp
  const handleCopyWhatsApp = () => {
    if (registrations.length === 0) {
      toast.error("No registrations to export");
      return;
    }

    const lines: string[] = [
      `*${event?.title || "Event"} — Attendee List*`,
      `*Total Attendees:* ${totalAttendees} | *Checked In:* ${checkedInCount}`,
      `*Generated:* ${new Date().toLocaleDateString("en-PK")}`,
      "",
    ];

    confirmed.forEach((r, idx) => {
      const contact = r.userPhone || r.userEmail || "No contact";
      lines.push(`${idx + 1}. *${r.userName}* (${r.ticketTypeName} × ${r.quantity}) - ${contact}`);
    });

    const text = lines.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied attendee list formatted for WhatsApp!");
  };

  // Download CSV with UTF-8 BOM
  const handleDownloadCsv = () => {
    if (registrations.length === 0) {
      toast.error("No registrations to download");
      return;
    }

    const headers = [
      "Registration ID",
      "Full Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Quantity",
      "Total PKR",
      "Checked In",
      "Status",
      "Registered At (PKT)",
    ];

    const rows = registrations.map((r) => [
      `"${r.id}"`,
      `"${r.userName.replace(/"/g, '""')}"`,
      `"${r.userEmail.replace(/"/g, '""')}"`,
      `"${(r.userPhone || "").replace(/"/g, '""')}"`,
      `"${r.ticketTypeName.replace(/"/g, '""')}"`,
      r.quantity || 1,
      r.totalPkr || 0,
      r.checkedIn ? "Yes" : "No",
      `"${r.status || "confirmed"}"`,
      `"${pktLabel(r.createdAt)}"`,
    ]);

    // \uFEFF UTF-8 BOM ensures proper character rendering in Microsoft Excel
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registrations_${eventId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Downloaded CSV with UTF-8 BOM");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors font-medium mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Event Details
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {event?.title || "Event"} — Registrations
          </h1>
          <p className="text-xs text-ink-muted">
            Manage ticket holders, check-ins, WhatsApp attendee lists, and CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCopyWhatsApp}
            disabled={registrations.length === 0}
          >
            <Share2 className="w-3.5 h-3.5 text-accent-deep" />
            Copy for WhatsApp
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDownloadCsv}
            disabled={registrations.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-surface rounded-xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-accent/20 text-accent-deep rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-ink-muted">Total Registered</span>
            <span className="text-xl font-bold text-ink">{totalAttendees}</span>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-sand/30 text-ink rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-ink-muted">Total Revenue</span>
            <span className="text-xl font-bold text-ink">{formatPKR(totalRevenue)}</span>
          </div>
        </div>

        <div className="p-4 bg-surface rounded-xl border border-border flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-control text-accent-deep rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-ink-muted">Checked-In Attendees</span>
            <span className="text-xl font-bold text-ink">
              {checkedInCount} / {totalAttendees}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full sm:w-80">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Table */}
      {isRegLoading || isEventLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No registrations found"
          description={
            searchTerm
              ? `No ticket holders match "${searchTerm}".`
              : "No users have registered for this event yet."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Ticket Type</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered (PKT)</TableHead>
              <TableHead className="text-right">Check-In</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink text-sm">{r.userName}</span>
                    <span className="text-xs text-ink-muted font-mono">{r.userId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span className="text-ink">{r.userEmail}</span>
                    {r.userPhone && <span className="text-ink-muted">{r.userPhone}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-subtle border border-border">
                    {r.ticketTypeName}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-semibold">{r.quantity}</TableCell>
                <TableCell className="text-xs font-bold">{formatPKR(r.totalPkr)}</TableCell>
                <TableCell>
                  <PaymentCell
                    registration={r}
                    onDecided={() =>
                      queryClient.invalidateQueries({ queryKey: ["registrations", "event", eventId] })
                    }
                  />
                </TableCell>
                <TableCell className="text-xs text-ink-muted font-mono">
                  {pktLabel(r.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant={r.checkedIn ? "secondary" : "primary"}
                    size="sm"
                    disabled={(r.status || "confirmed") !== "confirmed"}
                    onClick={() =>
                      checkInMutation.mutate({
                        id: r.id,
                        current: Boolean(r.checkedIn),
                      })
                    }
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        r.checkedIn ? "text-accent-deep" : "text-ink-faint"
                      }`}
                    />
                    {r.checkedIn ? "Checked In" : "Check In"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
