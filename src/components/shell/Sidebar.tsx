"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { qk } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/AuthContext";
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Users2,
  UserCheck,
  ShieldAlert,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function Sidebar() {
  const pathname = usePathname();
  const { authState, signOut } = useAuth();

  // Poll pending count every 60 seconds
  const { data: pendingCount = 0 } = useQuery({
    queryKey: qk.events.pending,
    queryFn: async () => {
      try {
        const q = query(collection(db, "events"), where("status", "==", "pending"));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
      } catch (err) {
        console.warn("Could not fetch pending count:", err);
        return 0;
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Poll pending reports count every 60 seconds
  const { data: reportsCount = 0 } = useQuery({
    queryKey: ["reports", "pending-count"],
    queryFn: async () => {
      try {
        const q = query(collection(db, "reports"), where("status", "==", "pending"));
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
      } catch {
        return 0;
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Pending",
      href: "/pending",
      icon: Clock,
      isActive: pathname.startsWith("/pending"),
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      name: "Events",
      href: "/events",
      icon: CalendarDays,
      isActive: pathname.startsWith("/events"),
    },
    {
      name: "Organizers",
      href: "/organizers",
      icon: Users2,
      isActive: pathname.startsWith("/organizers"),
    },
    {
      name: "Users",
      href: "/users",
      icon: UserCheck,
      isActive: pathname.startsWith("/users"),
    },
    {
      name: "Reports",
      href: "/reports",
      icon: ShieldAlert,
      isActive: pathname.startsWith("/reports"),
      badge: reportsCount > 0 ? reportsCount : undefined,
    },
  ];

  const userEmail =
    authState.status === "authenticated" ? authState.email : "admin@aasanevent.com";

  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-surface flex flex-col justify-between h-full select-none">
      <div className="flex flex-col">
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-on-ink font-bold text-base shadow-xs">
            A
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-ink tracking-tight">
              Aasanevent
            </span>
            <span className="text-[11px] text-ink-muted flex items-center gap-1 font-medium">
              Admin Panel
              {process.env.NEXT_PUBLIC_USE_EMULATOR === "true" && (
                <Sparkles className="w-2.5 h-2.5 text-accent" />
              )}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 flex flex-col gap-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm transition-colors ${
                  item.isActive
                    ? "bg-secondary text-ink font-semibold shadow-xs"
                    : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      item.isActive ? "text-accent-deep" : "text-ink-faint"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-crimson text-on-ink">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Admin user info & Logout footer */}
      <div className="p-4 border-t border-border bg-surface-subtle/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={userEmail} size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-ink truncate">Admin</span>
            <span className="text-[11px] text-ink-faint truncate" title={userEmail}>
              {userEmail}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="p-1.5 text-ink-faint hover:text-crimson hover:bg-surface rounded-md transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
