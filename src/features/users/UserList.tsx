"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUsers, toggleUserSuspend, updateUserRole, UserRow } from "./api";
import { fetchOrganizers } from "@/features/organizers/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FilterChip } from "@/components/ui/FilterChip";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import {
  Search,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

type UserFilterTab = "all" | "admin" | "organizer" | "user" | "suspended";

export function UserList() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<UserFilterTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleModalUser, setRoleModalUser] = useState<UserRow | null>(null);
  const [selectedRole, setSelectedRole] = useState<"admin" | "organizer" | "user">("user");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", activeTab],
    queryFn: () => fetchUsers({ role: activeTab }),
  });

  const { data: organizers = [] } = useQuery({
    queryKey: ["organizers", "all"],
    queryFn: fetchOrganizers,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ uid, currentStatus }: { uid: string; currentStatus: string }) =>
      toggleUserSuspend(uid, currentStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated");
    },
    onError: () => toast.error("Failed to update user status"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      uid,
      role,
      orgId,
    }: {
      uid: string;
      role: "admin" | "organizer" | "user";
      orgId?: string | null;
    }) => updateUserRole(uid, role, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setRoleModalUser(null);
      toast.success("User role updated successfully");
    },
    onError: () => toast.error("Failed to update role"),
  });

  const filtered = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.uid.toLowerCase().includes(term) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(term))
    );
  });

  const openRoleModal = (user: UserRow) => {
    setRoleModalUser(user);
    setSelectedRole((user.role as "admin" | "organizer" | "user") || "user");
    setSelectedOrgId(user.linkedOrganizerId || "");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label="All Users"
            isSelected={activeTab === "all"}
            onClick={() => setActiveTab("all")}
          />
          <FilterChip
            label="Admins"
            isSelected={activeTab === "admin"}
            onClick={() => setActiveTab("admin")}
          />
          <FilterChip
            label="Organizers"
            isSelected={activeTab === "organizer"}
            onClick={() => setActiveTab("organizer")}
          />
          <FilterChip
            label="Attendees"
            isSelected={activeTab === "user"}
            onClick={() => setActiveTab("user")}
          />
          <FilterChip
            label="Suspended"
            isSelected={activeTab === "suspended"}
            onClick={() => setActiveTab("suspended")}
          />
        </div>

        <div className="w-full sm:w-72">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-9 pr-3.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No users found"
          description="There are no registered users matching your filter or query."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Linked Organizer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const isSuspended = u.status === "suspended";
              const linkedOrg = organizers.find((o) => o.id === u.linkedOrganizerId);

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={u.displayName || "User"}
                        size="sm"
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink text-sm">
                          {u.displayName || "User"}
                        </span>
                        <span className="text-[11px] text-ink-muted font-mono truncate max-w-[140px]">
                          {u.uid}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span className="text-ink font-medium">{u.email}</span>
                      {u.phoneNumber && (
                        <span className="text-ink-muted">{u.phoneNumber}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold capitalize ${
                        u.role === "admin"
                          ? "bg-crimson-surface text-crimson border border-crimson/30"
                          : u.role === "organizer"
                          ? "bg-accent/20 text-accent-deep border border-accent/40"
                          : "bg-surface-subtle text-ink-muted border border-border"
                      }`}
                    >
                      {u.role || "user"}
                    </span>
                  </TableCell>

                  <TableCell>
                    {linkedOrg ? (
                      <span className="text-xs font-medium text-ink flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-accent-deep" />
                        {linkedOrg.name}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-disabled">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isSuspended
                          ? "bg-crimson-surface text-crimson"
                          : "bg-accent/15 text-accent-deep"
                      }`}
                    >
                      {isSuspended ? "Suspended" : "Active"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openRoleModal(u)}
                      >
                        Change Role
                      </Button>

                      <Button
                        type="button"
                        variant={isSuspended ? "primary" : "destructive"}
                        size="sm"
                        onClick={() =>
                          suspendMutation.mutate({
                            uid: u.uid,
                            currentStatus: u.status || "active",
                          })
                        }
                      >
                        {isSuspended ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Unsuspend
                          </>
                        ) : (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            Suspend
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Role & Organizer Link Modal */}
      {roleModalUser && (
        <Modal
          isOpen={Boolean(roleModalUser)}
          onClose={() => setRoleModalUser(null)}
          title="Manage User Role"
          description={`Update role permissions or link to an organizer profile for ${roleModalUser.displayName}.`}
          maxWidth="md"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setRoleModalUser(null)}
                disabled={updateRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={updateRoleMutation.isPending}
                onClick={() =>
                  updateRoleMutation.mutate({
                    uid: roleModalUser.uid,
                    role: selectedRole,
                    orgId: selectedRole === "organizer" ? selectedOrgId : null,
                  })
                }
              >
                Save Role
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            <Select
              label="System Role"
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(e.target.value as "admin" | "organizer" | "user")
              }
              options={[
                { value: "user", label: "Regular Attendee (Standard App User)" },
                { value: "organizer", label: "Event Organizer (Can submit and manage events)" },
                { value: "admin", label: "System Administrator (Full Control)" },
              ]}
            />

            {selectedRole === "organizer" && (
              <Select
                label="Link to Organizer Profile"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                options={[
                  { value: "", label: "— No Organizer Linked —" },
                  ...organizers.map((o) => ({
                    value: o.id,
                    label: o.name,
                  })),
                ]}
                helperText="Links this user account to the organizer brand"
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
