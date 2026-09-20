import React from "react";
import { UserList } from "@/features/users/UserList";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">User Directory</h1>
        <p className="text-xs text-ink-muted">
          Manage registered users, assign organizer privileges, and handle account suspensions.
        </p>
      </div>
      <UserList />
    </div>
  );
}
