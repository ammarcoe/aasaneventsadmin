import React from "react";
import type { DashboardMetrics } from "./api";
import { Clock, CalendarCheck, Ticket, Users2 } from "lucide-react";
import Link from "next/link";

export interface MetricCardsProps {
  metrics: DashboardMetrics;
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const cards = [
    {
      title: "PENDING",
      value: metrics.pendingCount,
      subtitle: metrics.oldestPendingSubtitle,
      icon: Clock,
      href: "/pending",
      badgeColor: "bg-sand text-ink",
    },
    {
      title: "PUBLISHED",
      value: metrics.publishedCount,
      subtitle: metrics.publishedThisWeekSubtitle,
      icon: CalendarCheck,
      href: "/events",
      badgeColor: "bg-accent/20 text-accent-deep",
    },
    {
      title: "REGISTRATIONS",
      value: metrics.registrationsCount,
      subtitle: metrics.registrationsThisWeekSubtitle,
      icon: Ticket,
      href: "/events",
      badgeColor: "bg-secondary text-ink",
    },
    {
      title: "ORGANIZERS",
      value: metrics.organizersCount,
      subtitle: metrics.unlinkedOrganizersSubtitle,
      icon: Users2,
      href: "/organizers",
      badgeColor: "bg-control text-ink",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            href={card.href}
            className="p-5 bg-surface rounded-lg border border-border hover:border-border-strong transition-all shadow-xs flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-ink-muted uppercase">
                {card.title}
              </span>
              <div className="p-2 rounded-md bg-surface-subtle border border-border text-ink-muted group-hover:text-accent-deep transition-colors">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex flex-col mt-4">
              <span className="text-3xl font-bold tracking-tight text-ink font-mono">
                {card.value}
              </span>
              <span className="text-xs text-ink-muted mt-1">
                {card.subtitle}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
