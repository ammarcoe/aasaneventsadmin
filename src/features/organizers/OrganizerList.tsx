"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { fetchOrganizers, toggleOrganizerSuspend, updateOrganizer } from "./api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { FilterChip } from "@/components/ui/FilterChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { LinkAccountModal } from "./LinkAccountModal";
import type { Organizer } from "@/types";
import {
  Search,
  UserPlus,
  Link as LinkIcon,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Users2,
} from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "all" | "active" | "suspended" | "unlinked";

export function OrganizerList() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLinkingOrg, setActiveLinkingOrg] = useState<Organizer | null>(null);

  const { data: organizers = [], isLoading, error } = useQuery({
    queryKey: qk.organizers.all,
    queryFn: fetchOrganizers,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) =>
      toggleOrganizerSuspend(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qk.organizers.all });
      toast.success(
        variables.status === "active" ? "Organizer suspended" : "Organizer reactivated"
      );
    },
    onError: () => {
      toast.error("Failed to update organizer status.");
    },
  });

  const filtered = organizers.filter((org) => {
    // Status filter
    if (filter === "active" && org.status !== "active") return false;
    if (filter === "suspended" && org.status !== "suspended") return false;
    if (filter === "unlinked" && org.linkedUserId) return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesName = org.name.toLowerCase().includes(term);
      const matchesEmail = org.email.toLowerCase().includes(term);
      const matchesPhone = org.phone.includes(term);
      return matchesName || matchesEmail || matchesPhone;
    }
    return true;
  });

  const activeCount = organizers.filter((o) => o.status === "active").length;
  const suspendedCount = organizers.filter((o) => o.status === "suspended").length;
  const unlinkedCount = organizers.filter((o) => !o.linkedUserId).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header controls: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All"
            count={organizers.length}
            isSelected={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label="Active"
            count={activeCount}
            isSelected={filter === "active"}
            onClick={() => setFilter("active")}
          />
          <FilterChip
            label="Suspended"
            count={suspendedCount}
            isSelected={filter === "suspended"}
            onClick={() => setFilter("suspended")}
          />
          <FilterChip
            label="Not Linked"
            count={unlinkedCount}
            isSelected={filter === "unlinked"}
            onClick={() => setFilter("unlinked")}
          />
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-9 pr-3.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <div className="p-6 bg-crimson-surface border border-crimson/30 rounded-lg text-sm text-crimson">
          Failed to load organizers. Please verify Firestore rules and emulator connection.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No organizers found"
          description={
            searchTerm
              ? `No organizers matched "${searchTerm}".`
              : "No organizers in this category yet."
          }
          action={
            <Link href="/organizers/new">
              <Button size="sm">
                <UserPlus className="w-3.5 h-3.5" />
                Create First Organizer
              </Button>
            </Link>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organizer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>App Account</TableHead>
              <TableHead>Events</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar src={org.avatarUrl} name={org.name} size="md" />
                    <div className="flex flex-col">
                      <Link
                        href={`/organizers/${org.id}`}
                        className="font-semibold text-ink hover:text-accent-deep transition-colors"
                      >
                        {org.name}
                      </Link>
                      <span className="text-xs text-ink-muted">{org.email}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-mono text-ink-muted">{org.phone}</span>
                </TableCell>

                <TableCell>
                  <Badge variant={org.status === "active" ? "active" : "suspended"}>
                    {org.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  {org.linkedUserId ? (
                    <div className="flex items-center gap-1.5 text-xs text-accent-deep font-medium">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span className="font-mono truncate max-w-[150px]">
                        {org.linkedUserEmail || "Linked"}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveLinkingOrg(org)}
                      className="inline-flex items-center gap-1 text-xs text-sand hover:text-ink font-medium underline underline-offset-2 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      Link Account
                    </button>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-ink">{org.upcomingEventCount ?? 0}</span>
                    <span className="text-ink-faint">upcoming / {org.eventCount ?? 0} total</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        suspendMutation.mutate({ id: org.id, status: org.status })
                      }
                      disabled={suspendMutation.isPending}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        org.status === "active"
                          ? "text-ink-faint hover:text-crimson hover:bg-crimson-surface"
                          : "text-accent hover:text-accent-deep hover:bg-accent/10"
                      }`}
                      title={org.status === "active" ? "Suspend Organizer" : "Reactivate Organizer"}
                    >
                      {org.status === "active" ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </button>

                    <Link href={`/organizers/${org.id}`}>
                      <button
                        type="button"
                        className="p-1.5 text-ink-faint hover:text-ink hover:bg-surface-subtle rounded-md transition-colors cursor-pointer"
                        title="Edit Organizer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Account Linking Modal */}
      {activeLinkingOrg && (
        <LinkAccountModal
          isOpen={Boolean(activeLinkingOrg)}
          onClose={() => setActiveLinkingOrg(null)}
          organizerId={activeLinkingOrg.id}
          organizerName={activeLinkingOrg.name}
          onLinked={async (userId, userEmail) => {
            await updateOrganizer(activeLinkingOrg.id, {
              linkedUserId: userId,
              linkedUserEmail: userEmail,
            });
            queryClient.invalidateQueries({ queryKey: qk.organizers.all });
          }}
        />
      )}
    </div>
  );
}
