import type { EventFilter } from "@/types";

export const qk = {
  events: {
    all: ["events"] as const,
    list: (f?: EventFilter) => ["events", "list", f ?? {}] as const,
    detail: (id: string) => ["events", "detail", id] as const,
    pending: ["events", "pending"] as const,
    pendingCount: ["events", "pending-count"] as const,
  },
  organizers: {
    all: ["organizers"] as const,
    detail: (id: string) => ["organizers", "detail", id] as const,
  },
  registrations: {
    byEvent: (id: string) => ["registrations", id] as const,
  },
  payouts: {
    queue: ["payouts", "queue"] as const,
    queueCount: ["payouts", "queue-count"] as const,
    detail: (organizerId: string) => ["payouts", "detail", organizerId] as const,
  },
  dashboard: ["dashboard"] as const,
};
